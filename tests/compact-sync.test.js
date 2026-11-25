import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {freshState} from '../src/engine/learner.js';
import {applyLearningSync,mergeRemoteAttempts,attemptMergeBase} from '../src/engine/learning-sync.js';
import {readLocalState,writeLocalState,STORAGE_KEY} from '../src/engine/recovery-storage.js';
import {learningChromeFromStorage} from '../src/ui/daily-chrome.js';
const content={concepts:[{id:'F5'}],byId:{p1:{id:'p1'}}};
const now=new Date('2026-11-25T12:00:00Z');
const source=await fs.readFile(new URL('../src/ui/v51.js',import.meta.url),'utf8');
const syncSource=source.slice(source.indexOf('async function syncNow('),source.indexOf('function enhance('));
function device(initial,remote){
 const values=new Map(),writes=[];
 const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 if(initial)writeLocalState(storage,initial);
 const context={syncing:false,lastRevision:0,isAuthSessionMissingError:()=>false,
  supabase:{auth:{getUser:async()=>({data:{user:{id:'test-user'}}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:remote.value,error:null})})}),upsert:async row=>{writes.push(structuredClone(row));remote.value={state:structuredClone(row.state)};return {error:null};}})},
  localState:()=>readLocalState(storage),localStorage:storage,writeLocalState,setStatus:()=>{},
  course:async()=>content,applyLearningSync,pullAttempts:async()=>[],mergeRemoteAttempts,attemptMergeBase,pushAttempts:async()=>{},
  document:{querySelector:()=>null},setTimeout:()=>{},location:{reload:()=>{}},navigator:{onLine:true},console,renderSyncPanel:()=>{}};
 vm.createContext(context);vm.runInContext(syncSource,context);
 return {storage,values,writes,sync:()=>context.syncNow()};
}
function history(){
 const state=freshState(content,now);
 state.revision=10;state.daily.count=20;
 state.attempts=Array.from({length:250},(_,i)=>({id:'synthetic-'+i,date:'2026-11-24',concept:'F5',expected:'Wij hebben een fiets.',answer:'Wij hebben een fiets.',grammar:true,assisted:false}));
 return state;
}

test('actual sync uploads plain V5 state from a compact device and downloads it to an empty second device',async()=>{
 const current=history(),remote={value:null};
 const a=device(current,remote);await a.sync();
 assert.equal(a.writes.length,1);assert.deepEqual(a.writes[0].state,current);
 assert.equal(typeof remote.value.state,'object');assert.equal(remote.value.state.schemaVersion,5);
 assert.ok(a.values.get(STORAGE_KEY).startsWith('zin-recovery-dictionary-v1'));
 const b=device(null,remote);await b.sync();assert.equal(b.writes.length,0,'empty local must not upload over populated remote');
 assert.deepEqual(readLocalState(b.storage),current);
 assert.deepEqual(learningChromeFromStorage(b.storage,'2026-11-25'),{count:20,done:true,extra:false});
 const next={...current,revision:11,words:{fiets:{taughtAt:'2026-11-25',attempts:2}}};
 writeLocalState(b.storage,next);await b.sync();assert.deepEqual(remote.value.state,next);
 await a.sync();assert.deepEqual(readLocalState(a.storage),next);assert.equal(a.writes.length,1,'older compact device must download newer remote');
});

test('rollback disables new compact writes while retaining the reader and all existing history',async()=>{
 const current=history(),a=device(current,{value:null});
 const codec=await fs.readFile(new URL('../src/engine/recovery-storage.js',import.meta.url),'utf8');
 const rollback=await import('data:text/javascript;base64,'+Buffer.from(codec.replace('COMPACT_LOCAL_WRITES=true','COMPACT_LOCAL_WRITES=false')).toString('base64'));
 assert.deepEqual(rollback.readLocalState(a.storage),current);
 rollback.writeLocalState(a.storage,current);
 assert.deepEqual(JSON.parse(a.values.get(STORAGE_KEY)),current);
});
