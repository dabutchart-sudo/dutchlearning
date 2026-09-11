import test from 'node:test';
import assert from 'node:assert/strict';
import {independentRecallCandidates,independentExercise,independentAttemptsToday} from '../src/engine/independent-recall.js';
import {PRODUCTION_STAGE} from '../src/engine/flashcards.js';

const card=(id,overrides={})=>({id,dutch:`woord${id}`,english:`word ${id}`,partofword:'noun',type:'review',interval:30,ease:2.5,reps:5,lapses:0,first_seen:'2026-08-01',last_reviewed:'2026-09-01',due_date:'2026-10-01',suspended:false,...overrides});
const independentState={words:{'card:1':{guidedSuccesses:2},'card:2':{guidedSuccesses:2}},flashcardProduction:{attempts:[]}};

test('offers at most one independent word per day',()=>{const q=independentRecallCandidates([card(1),card(2)],structuredClone(independentState),{today:'2026-09-11',random:()=>.5});assert.equal(q.length,1);assert.equal(q[0].evidence.productionStage,PRODUCTION_STAGE.INDEPENDENT);});

test('does not offer another independent word after one meaningful independent attempt',()=>{const s=structuredClone(independentState);s.flashcardProduction.attempts.push({cardId:'1',date:'2026-09-11',stage:PRODUCTION_STAGE.INDEPENDENT,meaningful:true,correct:true});assert.equal(independentAttemptsToday(s,'2026-09-11'),1);assert.equal(independentRecallCandidates([card(1),card(2)],s,{today:'2026-09-11'}).length,0);});

test('independent recall respects the overall five-question daily cap',()=>{const s=structuredClone(independentState);s.flashcardProduction.attempts=Array.from({length:5},(_,i)=>({cardId:String(i+10),date:'2026-09-11',stage:PRODUCTION_STAGE.GUIDED,meaningful:true,correct:true}));assert.equal(independentRecallCandidates([card(1),card(2)],s,{today:'2026-09-11'}).length,0);});

test('independent exercise is genuinely unsupported typed recall',()=>{const record={id:'42',dutch:'schrijven',english:'to write'};assert.deepEqual(independentExercise(record),{cardId:'42',stage:PRODUCTION_STAGE.INDEPENDENT,kind:'typed',prompt:'to write',answer:'schrijven',meaningful:true});});
