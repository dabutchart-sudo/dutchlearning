import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,ensureDay,prepareQuestion,DAY_SIZE} from '../src/engine/learner.js';
import {createRepository} from '../src/engine/persistence.js';

function contentFixture(){
 const concept={id:'A1.TEST',level:'A1',title:'Test concept',rule:'A simple rule.',example:'Ik werk.',translation:'I work.',exampleId:'p1',prerequisites:[],minPractice:40};
 const item={id:'p1',concept:'A1.TEST',pool:'practice',nl:'Ik werk.',en:'I work.',alternatives:[],verb:'werken',subject:'ik',family:'present',verbIndex:1,verbSlots:[1],forms:['werk','werkt','werken'],vocabulary:[{id:'w1',nl:'werken',en:'to work',mature:false}]};
 return {concepts:[concept],sentences:[item],conceptById:{'A1.TEST':concept},byId:{p1:item}};
}

function memoryStorage(){
 const values=new Map();
 return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),values};
}

test('completed learning day survives reload and cannot create question 21',()=>{
 const content=contentFixture();
 const storage=memoryStorage();
 const now=new Date('2026-09-13T12:00:00');
 const repo=createRepository(storage,content,{key:'test-learning-session',now:()=>now});
 const state=freshState(content,now);
 state.daily.count=DAY_SIZE;
 state.attempts.push({id:'attempt-1',date:'2026-09-13',concept:'A1.TEST'});
 repo.save(state);

 const reloaded=repo.load();
 assert.equal(reloaded.daily.date,'2026-09-13');
 assert.equal(reloaded.daily.count,DAY_SIZE);
 assert.equal(reloaded.attempts.length,1);
 assert.equal(prepareQuestion(reloaded,content,now),null);
});

test('next study day reopens the session without discarding learner evidence',()=>{
 const content=contentFixture();
 const state=freshState(content,new Date('2026-09-13T12:00:00'));
 state.daily.count=DAY_SIZE;
 state.progress['A1.TEST'].practiceAttempts=7;
 state.progress['A1.TEST'].weakness=3;
 state.words.w1={weakness:4,attempts:5,spellingErrors:2,recallErrors:2,taughtAt:'2026-09-13'};
 state.attempts.push({id:'attempt-1',date:'2026-09-13',concept:'A1.TEST'});

 ensureDay(state,new Date('2026-09-14T12:00:00'));

 assert.deepEqual(state.daily,{date:'2026-09-14',count:0});
 assert.equal(state.progress['A1.TEST'].practiceAttempts,7);
 assert.equal(state.progress['A1.TEST'].weakness,3);
 assert.equal(state.words.w1.weakness,4);
 assert.equal(state.attempts.length,1);
});

test('resuming an unchanged pending question does not rewrite browser storage',()=>{
 const content=contentFixture();
 const values=new Map();
 let writes=0;
 const storage={
  getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>{writes++;values.set(key,String(value));},
  removeItem:key=>values.delete(key)
 };
 const now=new Date('2026-09-14T12:00:00');
 const repo=createRepository(storage,content,{key:'resume-session',now:()=>now});
 const state=freshState(content,now);
 state.progress['A1.TEST'].taught=true;
 state.progress['A1.TEST'].lessonAcknowledged=true;
 const pending=prepareQuestion(state,content,now,false);
 repo.save(state);
 const writesAfterInitialSave=writes;

 const reopened=repo.load();
 assert.equal(prepareQuestion(reopened,content,now,false).id,pending.id);
 repo.save(reopened);

 assert.equal(writes,writesAfterInitialSave,'opening the same pending question should not broadcast a redundant storage write to other tabs');
 assert.equal(repo.load().pending.id,pending.id);
});

test('same-day daily count is reconstructed from persisted attempt evidence',()=>{
 const content=contentFixture();
 const storage=memoryStorage();
 const now=new Date('2026-09-14T18:00:00');
 const repo=createRepository(storage,content,{key:'count-recovery',now:()=>now});
 const state=freshState(content,now);
 state.daily.count=0;
 state.attempts=Array.from({length:14},(_,i)=>({id:'a'+i,date:'2026-09-14',concept:'A1.TEST'}));
 storage.setItem('count-recovery',JSON.stringify(state));

 const recovered=repo.load();
 assert.equal(recovered.daily.count,14,'visible progress should recover from the attempt ledger instead of showing 0/20');
});

test('rolling recovery copy restores a more advanced same-day session after an accidental fresh overwrite',()=>{
 const content=contentFixture();
 const storage=memoryStorage();
 const now=new Date('2026-09-14T18:00:00');
 const repo=createRepository(storage,content,{key:'upgrade-recovery',now:()=>now});
 const progressed=freshState(content,now);
 progressed.daily.count=14;
 progressed.attempts=Array.from({length:14},(_,i)=>({id:'a'+i,date:'2026-09-14',concept:'A1.TEST'}));
 repo.save(progressed);

 const accidental=freshState(content,now);
 accidental.learnerId=progressed.learnerId;
 accidental.deviceId=progressed.deviceId;
 repo.save(accidental);
 assert.equal(JSON.parse(storage.getItem('upgrade-recovery')).daily.count,0,'test setup should emulate the bad fresh overwrite');

 const recovered=repo.load();
 assert.equal(recovered.daily.count,14);
 assert.equal(recovered.attempts.length,14);
});

test('an explicit Learning reset is not undone by the recovery copy',()=>{
 const content=contentFixture();
 const storage=memoryStorage();
 const now=new Date('2026-09-14T18:00:00');
 const repo=createRepository(storage,content,{key:'intentional-reset',now:()=>now});
 const progressed=freshState(content,now);
 progressed.daily.count=14;
 progressed.attempts=Array.from({length:14},(_,i)=>({id:'a'+i,date:'2026-09-14',concept:'A1.TEST'}));
 repo.save(progressed);

 repo.resetLearning();
 const reopened=repo.load();
 assert.equal(reopened.daily.count,0);
 assert.equal(reopened.attempts.length,0);
});

test('the course path has an explicit finished state after 20 and no Today start button',async()=>{
 const source=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../src/ui/app.js',import.meta.url),'utf8'));
 const overview=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../src/ui/course-overview.js',import.meta.url),'utf8'));
 assert.match(overview,/Today’s 20 are done/);
 assert.match(overview,/daily\?\.done/);
 assert.match(source,/view='curriculum'/);
 assert.doesNotMatch(source,/function renderToday/);
});
