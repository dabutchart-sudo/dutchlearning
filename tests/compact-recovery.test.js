import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState} from '../src/engine/learner.js';
import {createRepository} from '../src/engine/persistence.js';
import {encodeRecovery,decodeRecovery,readLocalState,writeLocalState} from '../src/engine/recovery-storage.js';

const content={concepts:[{id:'F5'}],byId:{p1:{id:'p1'}},sentences:[]};
const stamp=new Date('2026-11-25T12:00:00Z'),key='learning',backup=key+'-recovery';
function history(){
 const state=freshState(content,stamp);
 state.attempts=Array.from({length:1600},(_,i)=>({id:'attempt-'+i,date:'2026-11-24',concept:'F5',direction:'en-nl',expected:'Wij hebben een blauwe fiets.',answer:'Wij hebben een blauwe fiets.',grammar:i%3!==0,spelling:null,assisted:false,capability:'produce',unknownFutureField:{value:i/10,unicode:'ĳ, ë, 🙂',empty:'',list:[null,true,false,0,'0','a']}}));
 state.exposures=state.attempts.map(a=>({id:a.id,nl:a.expected,words:['hebben','fiets'],reason:'question'}));
 state.pending={id:'resume-me',sourceId:'p1',concept:'F5',phase:'practice'};
 state.progress.F5.proofHistory=[{type:'mastery',passed:false,studyDate:'2026-11-24'}];
 return state;
}
function constrained(current,recovery=current){
 const values=new Map([[key,JSON.stringify(current)],[backup,JSON.stringify(recovery)],['unrelated','keep-me']]);
 const size=()=>[...values].reduce((sum,[k,v])=>sum+k.length+v.length,0);
 const limit=size();let denyCurrent=false,denyBackup=false;
 const storage={getItem:k=>values.get(k)??null,setItem(k,value){
  if((k===key&&denyCurrent)||(k===backup&&denyBackup)||size()-(values.get(k)?.length||0)-(values.has(k)?k.length:0)+k.length+value.length>limit)throw Object.assign(new Error('Full'),{name:'QuotaExceededError'});
  values.set(k,value);
 },removeItem:k=>values.delete(k)};
 return {storage,values,repo:createRepository(storage,content,{key,now:()=>stamp}),set denyCurrent(v){denyCurrent=v;},set denyBackup(v){denyBackup=v;}};
}

test('lossless dictionary keeps all history, unknown fields, Unicode and special property names',()=>{
 const state=history();state.future=JSON.parse('{"__proto__":{"constructor":"safe"},"0":"integer key","null":null}');
 const raw=JSON.stringify(state),compact=encodeRecovery(raw);
 assert.ok(compact.length<raw.length*.7,'large histories must gain useful headroom');
 assert.equal(decodeRecovery(compact),raw);
 assert.deepEqual(JSON.parse(decodeRecovery(compact)),state);
 assert.equal({}.constructor,Object);
 assert.equal(encodeRecovery('{"small":true}'),'{"small":true}');
 assert.equal(decodeRecovery(raw),raw);
 assert.deepEqual(JSON.parse(decodeRecovery(encodeRecovery(JSON.stringify(state,null,2)))),state);
});

test('a completely full store can save, resume and export without deleting either history copy or unrelated storage',()=>{
 const current=history(),f=constrained(current),next=structuredClone(current);
 next.attempts.push({...next.attempts[0],id:'today',date:'2026-11-25'});next.daily.count=1;next.revision++;
 f.repo.save(next);
 assert.equal(decodeRecovery(f.values.get(key)),JSON.stringify(next),'main data remains exactly reproducible');
 assert.ok(f.values.get(key).length<JSON.stringify(next).length*.7);
 assert.equal(decodeRecovery(f.values.get(backup)),JSON.stringify(current));
 assert.deepEqual(f.repo.load(),next);
 assert.deepEqual(JSON.parse(f.repo.export(f.repo.load())),next);
 assert.equal(f.values.get('unrelated'),'keep-me');
 const reopened=createRepository(f.storage,content,{key,now:()=>stamp});
 assert.equal(reopened.load().pending.id,'resume-me');
 next.daily.count=20;next.pending=null;f.repo.save(next);
 assert.equal(reopened.load().daily.count,20);
 assert.equal(decodeRecovery(f.values.get(backup)),JSON.stringify({...next,daily:{...next.daily,count:1},pending:current.pending}));
});

test('compact checkpoints recover damaged main state and restore advanced same-day history',()=>{
 const current=history(),f=constrained(current);f.repo.save({...current,revision:1});
 f.values.set(key,'broken');assert.deepEqual(f.repo.load(),current);
 const accidental=freshState(content,stamp);accidental.learnerId=current.learnerId;accidental.deviceId=current.deviceId;
 f.values.set(key,JSON.stringify(accidental));assert.deepEqual(f.repo.load(),current);
});

test('genuine save failure stays visible while both complete copies remain readable',()=>{
 const current=history(),f=constrained(current);f.denyCurrent=true;
 assert.throws(()=>f.repo.save({...current,revision:1}),{name:'QuotaExceededError'});
 assert.equal(f.values.get(key),JSON.stringify(current));
 assert.equal(decodeRecovery(f.values.get(backup)),JSON.stringify(current));
 f.denyCurrent=false;f.repo.save({...current,revision:1});assert.equal(f.repo.load().revision,1);
});

test('failed backup replacements retain the existing valid checkpoint while the compact main save succeeds',()=>{
 const current=history(),f=constrained(current);f.denyBackup=true;
 const before=f.values.get(backup);
 f.repo.save({...current,revision:100});
 assert.equal(f.values.get(backup),before);assert.equal(f.repo.load().revision,100);
});

test('a corrupt checkpoint cannot authorise skipping a failed backup refresh',()=>{
 const current=history(),f=constrained(current);f.denyBackup=true;
 f.values.set(backup,'zin-recovery-dictionary-v1\n[["schemaVersion"],{"zz":5}]');
 assert.throws(()=>f.repo.save({...current,revision:1}),{name:'QuotaExceededError'});
 assert.equal(f.values.get(key),JSON.stringify(current));
});

test('shared local-state readers and writers keep cloud payloads as plain objects',()=>{
 const current=history(),f=constrained(current);
 writeLocalState(f.storage,current,key);
 assert.deepEqual(readLocalState(f.storage,key),current);
 const cloudPayload=JSON.parse(JSON.stringify(readLocalState(f.storage,key)));
 assert.deepEqual(cloudPayload,current);assert.equal(cloudPayload.schemaVersion,5);
 const revision=cloudPayload.revision+1;
 writeLocalState(f.storage,{...cloudPayload,revision},key);
 assert.equal(f.repo.load().revision,revision);
 assert.equal(f.repo.load().attempts.length,current.attempts.length);
});

test('unchanged compact state makes no redundant writes and remains import/export compatible',()=>{
 const current=history(),f=constrained(current);f.repo.save({...current,revision:1});
 const before=f.values.get(key),checkpoint=f.values.get(backup);
 f.denyCurrent=true;f.denyBackup=true;f.repo.save(f.repo.load());
 assert.equal(f.values.get(key),before);assert.equal(f.values.get(backup),checkpoint);
});

test('unchanged raw history frees space for a previously blocked briefing marker without adding an answer',()=>{
 const current=history(),f=constrained(current);
 f.repo.save(current);
 f.storage.setItem('dutch_learning_vocab_briefing_v1','{"2026-11-25:F5":true}');
 assert.deepEqual(f.repo.load(),current);
 assert.equal(decodeRecovery(f.values.get(backup)),JSON.stringify(current));
 assert.ok(f.values.get(key).length<JSON.stringify(current).length);
});

test('malformed compact data is rejected, and import/export stays portable V5 JSON',()=>{
 for(const raw of ['zin-recovery-dictionary-v1\n{}','zin-recovery-dictionary-v1\n[["ok"],"1"]','zin-recovery-dictionary-v1\n[["ok"],"00"]'])assert.throws(()=>decodeRecovery(raw));
 const current=history(),f=constrained(current);f.repo.save({...current,revision:1});
 const exported=f.repo.export(f.repo.load());assert.equal(JSON.parse(exported).schemaVersion,5);
 f.repo.import(exported);assert.equal(f.repo.load().revision,1);
});

test('unreadable compact copies never silently become a fresh learner',()=>{
 const f=constrained(history()),bad='zin-recovery-dictionary-v1\n[["missing"],"x"]';
 f.values.set(key,bad);f.values.set(backup,bad);
 assert.throws(()=>f.repo.load(),/could not be decoded safely/);
 assert.equal(f.values.get(key),bad);assert.equal(f.values.get(backup),bad);
});
