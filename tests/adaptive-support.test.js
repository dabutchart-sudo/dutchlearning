import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptiveSupportSummary} from '../src/engine/adaptive-support.js';

const card=(id,overrides={})=>({id,dutch:`woord${id}`,english:`word ${id}`,partofword:'noun',type:'review',interval:30,ease:2.5,reps:5,lapses:0,first_seen:'2026-08-01',last_reviewed:'2026-09-01',due_date:'2026-10-01',suspended:false,...overrides});
const recallMiss=(id,date)=>({cardId:String(id),date,meaningful:true,correct:false,errorType:'recall',stage:'guided-production'});
const spellingMiss=(id,date)=>({cardId:String(id),date,meaningful:true,correct:false,errorType:'spelling',stage:'guided-production'});

test('separates spelling and recall recovery and removes both from near-independent',()=>{
 const state={words:{'card:1':{guidedSuccesses:1},'card:2':{guidedSuccesses:1},'card:3':{guidedSuccesses:1}},flashcardProduction:{attempts:[
  spellingMiss(1,'2026-09-08'),spellingMiss(1,'2026-09-09'),spellingMiss(1,'2026-09-10'),
  recallMiss(2,'2026-09-09'),recallMiss(2,'2026-09-10')
 ]}};
 const summary=adaptiveSupportSummary([card(1),card(2),card(3)],state,'2026-09-11');
 assert.deepEqual(summary.spelling.map(r=>r.id),['1']);
 assert.deepEqual(summary.recall.map(r=>r.id),['2']);
 assert.deepEqual(summary.nearIndependent.map(r=>r.id),['3']);
});

test('spelling support takes precedence if a word qualifies for both recovery modes',()=>{
 const state={words:{'card:1':{guidedSuccesses:0}},flashcardProduction:{attempts:[
  recallMiss(1,'2026-09-07'),recallMiss(1,'2026-09-08'),
  spellingMiss(1,'2026-09-09'),spellingMiss(1,'2026-09-10'),spellingMiss(1,'2026-09-11')
 ]}};
 const summary=adaptiveSupportSummary([card(1)],state,'2026-09-11');
 assert.equal(summary.spelling.length,1);
 assert.equal(summary.recall.length,0);
});
