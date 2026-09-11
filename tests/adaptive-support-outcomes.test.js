import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptiveSupportOutcomes} from '../src/engine/adaptive-support.js';
import {PRODUCTION_STAGE} from '../src/engine/flashcards.js';

const attempt=(cardId,date,{correct=true,recovery=null,errorType='none'}={})=>({cardId:String(cardId),date,timestamp:`${date}T10:00:00Z`,meaningful:true,correct,recovery,errorType,stage:PRODUCTION_STAGE.GUIDED});

test('summarises spelling and recall recovery separately',()=>{
 const state={flashcardProduction:{attempts:[
  attempt(1,'2026-09-01',{correct:true,recovery:'spelling'}),
  attempt(1,'2026-09-02',{correct:true}),
  attempt(2,'2026-09-03',{correct:true,recovery:'recall'}),
  attempt(2,'2026-09-04',{correct:false,errorType:'recall'})
 ]}};
 const result=adaptiveSupportOutcomes(state,{today:'2026-09-11',days:30});
 assert.equal(result.overall.supportTotal,2);
 assert.equal(result.overall.supportCorrect,2);
 assert.equal(result.overall.followups,2);
 assert.equal(result.overall.followupCorrect,1);
 assert.equal(result.byType.spelling.followupRate,1);
 assert.equal(result.byType.recall.followupRate,0);
});

test('counts one unsupported follow-up after consecutive recovery encounters',()=>{
 const state={flashcardProduction:{attempts:[
  attempt(1,'2026-09-01',{correct:true,recovery:'recall'}),
  attempt(1,'2026-09-02',{correct:true,recovery:'recall'}),
  attempt(1,'2026-09-03',{correct:true})
 ]}};
 const result=adaptiveSupportOutcomes(state,{today:'2026-09-11',days:30});
 assert.equal(result.overall.supportTotal,2);
 assert.equal(result.overall.followups,1);
 assert.equal(result.overall.followupCorrect,1);
 assert.equal(result.byType.recall.followups,1);
});

test('attributes a shared follow-up to the most recent recovery type',()=>{
 const state={flashcardProduction:{attempts:[
  attempt(1,'2026-09-01',{correct:true,recovery:'spelling'}),
  attempt(1,'2026-09-02',{correct:true,recovery:'recall'}),
  attempt(1,'2026-09-03',{correct:false,errorType:'recall'})
 ]}};
 const result=adaptiveSupportOutcomes(state,{today:'2026-09-11',days:30});
 assert.equal(result.overall.followups,1);
 assert.equal(result.byType.spelling.followups,0);
 assert.equal(result.byType.recall.followups,1);
 assert.equal(result.byType.recall.followupCorrect,0);
});

test('separate unsupported recalls close separate support episodes',()=>{
 const state={flashcardProduction:{attempts:[
  attempt(1,'2026-09-01',{correct:true,recovery:'recall'}),
  attempt(1,'2026-09-02',{correct:true}),
  attempt(1,'2026-09-03',{correct:true,recovery:'recall'}),
  attempt(1,'2026-09-04',{correct:false,errorType:'recall'})
 ]}};
 const result=adaptiveSupportOutcomes(state,{today:'2026-09-11',days:30});
 assert.equal(result.overall.supportTotal,2);
 assert.equal(result.overall.followups,2);
 assert.equal(result.overall.followupCorrect,1);
});

test('limits support events to the reporting window',()=>{
 const state={flashcardProduction:{attempts:[
  attempt(1,'2026-07-01',{correct:true,recovery:'spelling'}),
  attempt(1,'2026-07-02',{correct:true}),
  attempt(2,'2026-09-10',{correct:false,recovery:'recall',errorType:'recall'})
 ]}};
 const result=adaptiveSupportOutcomes(state,{today:'2026-09-11',days:14});
 assert.equal(result.overall.supportTotal,1);
 assert.equal(result.overall.supportCorrect,0);
 assert.equal(result.overall.followups,0);
 assert.equal(result.overall.followupRate,null);
});
