import test from 'node:test';
import assert from 'node:assert/strict';
import {productionPracticeQueue,productionExercise,recordProductionAttempt,recallRecoveryActive,PRODUCTION_STAGE,RECALL_RECOVERY_THRESHOLD} from '../src/engine/flashcards.js';

const card=(id,overrides={})=>({id,dutch:`woord${id}`,english:`word ${id}`,partofword:'noun',type:'review',interval:30,ease:2.5,reps:5,lapses:0,first_seen:'2026-08-01',last_reviewed:'2026-09-01',due_date:'2026-10-01',suspended:false,...overrides});
const miss=(cardId,date)=>({cardId:String(cardId),date,meaningful:true,correct:false,errorType:'recall',stage:PRODUCTION_STAGE.GUIDED});

test('two consecutive recall misses trigger supported recovery',()=>{
 const state={flashcardProduction:{attempts:[miss(1,'2026-09-09'),miss(1,'2026-09-10')]}};
 assert.equal(RECALL_RECOVERY_THRESHOLD,2);
 assert.equal(recallRecoveryActive(state,'1'),true);
});

test('a later correct production answer clears the recall-miss streak',()=>{
 const state={flashcardProduction:{attempts:[miss(1,'2026-09-09'),miss(1,'2026-09-10'),{cardId:'1',date:'2026-09-11',meaningful:true,correct:true,errorType:'none',stage:PRODUCTION_STAGE.GUIDED}]}};
 assert.equal(recallRecoveryActive(state,'1'),false);
});

test('spelling slips do not combine with recall misses to trigger recall recovery',()=>{
 const state={flashcardProduction:{attempts:[miss(1,'2026-09-09'),{cardId:'1',date:'2026-09-10',meaningful:true,correct:false,errorType:'spelling',stage:PRODUCTION_STAGE.GUIDED}]}};
 assert.equal(recallRecoveryActive(state,'1'),false);
});

test('recall recovery converts guided production into one supported choice',()=>{
 const cards=[card(1,{dutch:'schrijven',english:'to write'}),card(2,{dutch:'lezen',english:'to read'}),card(3,{dutch:'spreken',english:'to speak'}),card(4,{dutch:'werken',english:'to work'})];
 const state={words:{'card:1':{guidedSuccesses:1}},flashcardProduction:{attempts:[miss(1,'2026-09-09'),miss(1,'2026-09-10')]}};
 const q=productionPracticeQueue(cards,state,{today:'2026-09-11',limit:4,random:()=>.5});
 const record=q.find(x=>x.id==='1');
 assert.ok(record);
 assert.equal(record.evidence.recallRecoveryActive,true);
 const exercise=productionExercise(record,q,()=>.5);
 assert.equal(exercise.kind,'choice');
 assert.equal(exercise.recovery,'recall');
});

test('successful recall recovery does not count as a guided graduation success',()=>{
 const state={words:{'card:1':{guidedSuccesses:1}},flashcardProduction:{attempts:[]}};
 const exercise={cardId:'1',stage:PRODUCTION_STAGE.GUIDED,kind:'choice',prompt:'to write',answer:'schrijven',meaningful:true,recovery:'recall'};
 recordProductionAttempt(state,exercise,'schrijven',{today:'2026-09-11',nowIso:'2026-09-11T10:00:00Z'});
 assert.equal(state.words['card:1'].guidedSuccesses,1);
 assert.equal(recallRecoveryActive(state,'1'),false);
});
