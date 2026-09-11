import test from 'node:test';
import assert from 'node:assert/strict';
import {productionPracticeQueue,PRODUCTION_STAGE} from '../src/engine/flashcards.js';

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
