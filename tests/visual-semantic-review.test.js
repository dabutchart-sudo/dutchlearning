import test from 'node:test';
import assert from 'node:assert/strict';
import {visualSemanticDecision,visualSemanticReviewQueue,recordVisualSemanticDecision,visualGenerationCandidate} from '../src/engine/visual-semantic-review.js';

const card=(id,partofword='noun')=>({id,dutch:`woord${id}`,english:`word${id}`,partofword,image_url:''});
const miss=(id,date)=>({cardId:String(id),date,timestamp:`${date}T10:00:00Z`,meaningful:true,correct:false,errorType:'recall',expected:`woord${id}`,answer:'wrong'});
const stateFor=(id=1)=>({flashcardProduction:{attempts:[miss(id,'2026-09-08'),miss(id,'2026-09-10')]}});

test('queues genuine visual need for semantic review but not structural words',()=>{
 const state={flashcardProduction:{attempts:[miss(1,'2026-09-08'),miss(1,'2026-09-10'),miss(2,'2026-09-08'),miss(2,'2026-09-10')]}};
 const queue=visualSemanticReviewQueue([card(1,'noun'),card(2,'preposition')],state,{today:'2026-09-11'});
 assert.deepEqual(queue.map(x=>String(x.record.id)),['1']);
});

test('recorded semantic decision removes a card from the review queue',()=>{
 const state=stateFor(1),record=card(1);
 recordVisualSemanticDecision(state,record,'suitable',{today:'2026-09-11'});
 assert.equal(visualSemanticReviewQueue([record],state,{today:'2026-09-11'}).length,0);
 assert.equal(visualSemanticDecision(state,1).decision,'suitable');
});

test('only an explicit suitable semantic decision makes generation eligible',()=>{
 const state=stateFor(1),record=card(1);
 assert.equal(visualGenerationCandidate(record,state,{today:'2026-09-11'}),false);
 recordVisualSemanticDecision(state,record,'unsuitable',{today:'2026-09-11'});
 assert.equal(visualGenerationCandidate(record,state,{today:'2026-09-11'}),false);
 recordVisualSemanticDecision(state,record,'suitable',{today:'2026-09-11'});
 assert.equal(visualGenerationCandidate(record,state,{today:'2026-09-11'}),true);
});

test('invalid semantic decisions are rejected',()=>{
 assert.throws(()=>recordVisualSemanticDecision({},card(1),'maybe'),/suitable or unsuitable/);
});
