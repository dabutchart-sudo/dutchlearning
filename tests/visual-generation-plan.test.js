import test from 'node:test';
import assert from 'node:assert/strict';
import {visualGenerationPrompt,visualGenerationPlan,visualGenerationQueue} from '../src/engine/visual-generation-plan.js';
import {recordVisualSemanticDecision} from '../src/engine/visual-semantic-review.js';

const card=(id,dutch='fiets',english='bicycle',partofword='noun')=>({id,dutch,english,partofword,image_url:''});
const miss=(id,date)=>({cardId:String(id),date,timestamp:`${date}T10:00:00Z`,meaningful:true,correct:false,errorType:'recall',expected:'fiets',answer:'wrong'});
const correct=(id,date)=>({cardId:String(id),date,timestamp:`${date}T10:00:00Z`,meaningful:true,correct:true,errorType:'none',expected:'fiets',answer:'fiets'});
const stateFor=id=>({flashcardProduction:{attempts:[miss(id,'2026-09-08'),miss(id,'2026-09-10')]}});

test('does not plan generation before explicit semantic approval',()=>{
 const state=stateFor(1),record=card(1);
 assert.equal(visualGenerationPlan(record,state,{today:'2026-09-11'}),null);
 recordVisualSemanticDecision(state,record,'suitable',{today:'2026-09-11'});
 assert.equal(visualGenerationPlan(record,state,{today:'2026-09-11'}).cardId,'1');
});

test('generation prompt requests a semantic image without written answer text',()=>{
 const prompt=visualGenerationPrompt(card(1,'fiets','bicycle'));
 assert.match(prompt,/meaning "bicycle"/i);
 assert.match(prompt,/Do not include written words/i);
 assert.match(prompt,/Dutch learner/i);
});

test('queue is conservative and defaults to one highest-need candidate',()=>{
 const state={flashcardProduction:{attempts:[miss(1,'2026-09-07'),miss(1,'2026-09-08'),miss(1,'2026-09-10'),miss(2,'2026-09-08'),miss(2,'2026-09-10')]}};
 const first=card(1,'fiets','bicycle'),second=card(2,'appel','apple');
 recordVisualSemanticDecision(state,first,'suitable',{today:'2026-09-11'});
 recordVisualSemanticDecision(state,second,'suitable',{today:'2026-09-11'});
 const queue=visualGenerationQueue([second,first],state,{today:'2026-09-11'});
 assert.equal(queue.length,1);
 assert.equal(queue[0].cardId,'1');
 assert.equal(queue[0].recallMissDays,3);
});

test('later successful recall removes a previously approved word from generation queue',()=>{
 const record=card(1),state=stateFor(1);
 recordVisualSemanticDecision(state,record,'suitable',{today:'2026-09-11'});
 state.flashcardProduction.attempts.push(correct(1,'2026-09-11'));
 assert.equal(visualGenerationQueue([record],state,{today:'2026-09-11'}).length,0);
});

test('existing image prevents generation even after semantic approval',()=>{
 const record={...card(1),image_url:'https://example.com/fiets.jpg'},state=stateFor(1);
 recordVisualSemanticDecision(state,record,'suitable',{today:'2026-09-11'});
 assert.equal(visualGenerationPlan(record,state,{today:'2026-09-11'}),null);
});
