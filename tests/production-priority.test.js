import test from 'node:test';
import assert from 'node:assert/strict';
import {productionPracticeQueue,productionExercise,spellingRecoveryActive,PRODUCTION_STAGE,SPELLING_RECOVERY_DAYS} from '../src/engine/flashcards.js';

const card=(id,overrides={})=>({id,dutch:`woord${id}`,english:`word ${id}`,partofword:'noun',type:'review',interval:30,ease:2.5,reps:5,lapses:0,first_seen:'2026-08-01',last_reviewed:'2026-09-01',due_date:'2026-10-01',suspended:false,...overrides});

test('daily practice prioritises guided words one success from Independent',()=>{
 const cards=[card(1),card(2),card(3,{interval:10}),card(4,{interval:10})];
 const state={words:{'card:1':{guidedSuccesses:1},'card:2':{guidedSuccesses:0}},flashcardProduction:{attempts:[]}};
 const q=productionPracticeQueue(cards,state,{today:'2026-09-11',limit:1,random:()=>.5});
 assert.equal(q.length,1);
 assert.equal(q[0].id,'1');
 assert.equal(q[0].evidence.productionStage,PRODUCTION_STAGE.GUIDED);
 assert.equal(q[0].evidence.guidedSuccesses,1);
});

test('graduation focus uses at most two slots so practice keeps some breadth',()=>{
 const cards=[card(1),card(2),card(3),card(4,{interval:10}),card(5,{interval:10})];
 const state={words:{'card:1':{guidedSuccesses:1},'card:2':{guidedSuccesses:1},'card:3':{guidedSuccesses:1}},flashcardProduction:{attempts:[]}};
 const q=productionPracticeQueue(cards,state,{today:'2026-09-11',limit:3,random:()=>.5});
 assert.equal(q.length,3);
 assert.equal(q.slice(0,2).every(x=>x.evidence.productionStage===PRODUCTION_STAGE.GUIDED&&x.evidence.guidedSuccesses===1),true);
 assert.equal(new Set(q.map(x=>x.id)).size,3);
});

test('three recent spelling misses trigger a short spelling-recovery period',()=>{
 const state={flashcardProduction:{attempts:[
  {cardId:'1',date:'2026-09-08',meaningful:true,correct:false,errorType:'spelling'},
  {cardId:'1',date:'2026-09-09',meaningful:true,correct:false,errorType:'spelling'},
  {cardId:'1',date:'2026-09-10',meaningful:true,correct:false,errorType:'spelling'}
 ]}};
 assert.equal(SPELLING_RECOVERY_DAYS,3);
 assert.equal(spellingRecoveryActive(state,'1','2026-09-11'),true);
 assert.equal(spellingRecoveryActive(state,'1','2026-09-12'),true);
 assert.equal(spellingRecoveryActive(state,'1','2026-09-13'),false);
});

test('recovery gives a guided spelling word recognition support instead of another spelling test',()=>{
 const cards=[card(1,{dutch:'schrijven',english:'to write'}),card(2,{dutch:'lezen',english:'to read'}),card(3,{dutch:'spreken',english:'to speak'}),card(4,{dutch:'werken',english:'to work'})];
 const state={words:{'card:1':{guidedSuccesses:0}},flashcardProduction:{attempts:[
  {cardId:'1',date:'2026-09-08',meaningful:true,correct:false,errorType:'spelling'},
  {cardId:'1',date:'2026-09-09',meaningful:true,correct:false,errorType:'spelling'},
  {cardId:'1',date:'2026-09-10',meaningful:true,correct:false,errorType:'spelling'}
 ]}};
 const q=productionPracticeQueue(cards,state,{today:'2026-09-11',limit:4,random:()=>.5});
 const record=q.find(x=>x.id==='1');
 assert.ok(record);
 assert.equal(record.evidence.spellingRecoveryActive,true);
 const exercise=productionExercise(record,q,()=>.5);
 assert.equal(exercise.kind,'choice');
 assert.equal(exercise.recovery,'spelling');
 assert.equal(exercise.answer,'schrijven');
});

test('spelling-recovery answers do not count as guided graduation successes',async()=>{
 const {recordProductionAttempt}=await import('../src/engine/flashcards.js');
 const state={words:{'card:1':{guidedSuccesses:1}},flashcardProduction:{attempts:[]}};
 const exercise={cardId:'1',stage:PRODUCTION_STAGE.GUIDED,kind:'choice',prompt:'to write',answer:'schrijven',meaningful:true,recovery:'spelling'};
 recordProductionAttempt(state,exercise,'schrijven',{today:'2026-09-11',nowIso:'2026-09-11T10:00:00Z'});
 assert.equal(state.words['card:1'].guidedSuccesses,1);
});
