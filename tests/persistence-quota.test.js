import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState} from '../src/engine/learner.js';
import {createRepository} from '../src/engine/persistence.js';

const content={concepts:[{id:'F5'}],byId:{},sentences:[]},key='quota-learning',backup=key+'-recovery';
const stamp=new Date('2026-11-24T12:00:00Z');
const quota=()=>Object.assign(new Error('The quota has been exceeded.'),{name:'QuotaExceededError'});
function fixture(){
 const old=freshState(content,stamp);old.attempts=[{id:'prior-1',date:'2026-11-23',grammar:true}];
 const current=structuredClone(old);current.attempts.push({id:'prior-2',date:'2026-11-23',grammar:false});current.revision=2;
 const next=structuredClone(current);next.attempts.push({id:'today-1',date:'2026-11-24',grammar:true});next.daily.count=1;next.revision=3;
 const values=new Map([[key,JSON.stringify(current)],[backup,JSON.stringify(old)]]);
 let failBackup=null,failCurrent=null,writes=0;
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>{writes++;if(k===backup&&failBackup)throw failBackup;if(k===key&&failCurrent)throw failCurrent;values.set(k,v);},removeItem:k=>values.delete(k)};
 return {old,current,next,values,repo:createRepository(storage,content,{key,now:()=>stamp}),set backupError(e){failBackup=e;},set currentError(e){failCurrent=e;},get writes(){return writes;}};
}

test('a quota-limited backup refresh retains the valid checkpoint and saves every current attempt',()=>{
 const f=fixture(),before=f.values.get(backup);f.backupError=quota();f.repo.save(f.next);
 assert.equal(f.values.get(backup),before);
 assert.deepEqual(f.repo.load().attempts,f.next.attempts);assert.equal(f.repo.load().daily.count,1);
 assert.equal(f.repo.load().revision,3);
});

test('normal saves still refresh the recovery checkpoint',()=>{
 const f=fixture();f.repo.save(f.next);
 assert.deepEqual(JSON.parse(f.values.get(backup)),f.current);
 assert.deepEqual(f.repo.load().attempts,f.next.attempts);
});

test('missing, invalid or unrelated backups cannot justify skipping a failed backup refresh',()=>{
 for(const value of [null,'invalid JSON',JSON.stringify({...fixture().old,learnerId:'another-learner'})]){
  const f=fixture(),before=f.values.get(key);if(value===null)f.values.delete(backup);else f.values.set(backup,value);
  f.backupError=quota();assert.throws(()=>f.repo.save(f.next),{name:'QuotaExceededError'});
  assert.equal(f.values.get(key),before);assert.equal(f.values.get(backup),value===null?undefined:value);
 }
});

test('non-quota backup failures are still surfaced without overwriting current progress',()=>{
 const f=fixture(),before=f.values.get(key);f.backupError=Object.assign(new Error('Storage blocked'),{name:'SecurityError'});
 assert.throws(()=>f.repo.save(f.next),{name:'SecurityError'});assert.equal(f.values.get(key),before);
});

test('a failed current save stays a failure and preserves both stored copies',()=>{
 for(const refreshFails of [true,false]){
  const f=fixture(),before=f.values.get(key);if(refreshFails)f.backupError=quota();f.currentError=quota();
  assert.throws(()=>f.repo.save(f.next),{name:'QuotaExceededError'});assert.equal(f.values.get(key),before);
  assert.deepEqual(JSON.parse(f.values.get(backup)),refreshFails?f.old:f.current);
  assert.equal(f.repo.load().daily.count,0);assert.deepEqual(f.repo.load().attempts,f.current.attempts);
 }
});

test('the retained checkpoint still recovers an invalid main copy',()=>{
 const f=fixture();f.backupError=quota();f.repo.save(f.next);f.values.set(key,'invalid JSON');
 const recovered=f.repo.load();assert.deepEqual(recovered.attempts,f.old.attempts);assert.equal(recovered.learnerId,f.old.learnerId);
});

test('an unchanged state still avoids writes when storage is constrained',()=>{
 const f=fixture();f.backupError=quota();f.currentError=quota();f.repo.save(f.current);assert.equal(f.writes,0);
});
