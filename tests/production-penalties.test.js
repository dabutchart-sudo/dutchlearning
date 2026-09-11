import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTION_STAGE,recordProductionAttempt} from '../src/engine/flashcards.js';

const exercise={cardId:'42',stage:PRODUCTION_STAGE.INDEPENDENT,kind:'typed',prompt:'to write',answer:'schrijven',meaningful:true};

test('spelling slips receive a light weakness penalty and spelling evidence',()=>{const state={words:{}};const attempt=recordProductionAttempt(state,exercise,'schrjven',{today:'2026-09-11',nowIso:'2026-09-11T12:00:00Z'});const word=state.words['card:42'];assert.equal(attempt.correct,false);assert.equal(attempt.errorType,'spelling');assert.equal(word.weakness,.25);assert.equal(word.spellingErrors,1);assert.equal(word.recallErrors,0);});

test('recall misses retain the stronger weakness penalty',()=>{const state={words:{}};const attempt=recordProductionAttempt(state,exercise,'lezen',{today:'2026-09-11',nowIso:'2026-09-11T12:01:00Z'});const word=state.words['card:42'];assert.equal(attempt.errorType,'recall');assert.equal(word.weakness,1);assert.equal(word.recallErrors,1);assert.equal(word.spellingErrors,0);});

test('correct answers still reduce weakness and record no error',()=>{const state={words:{'card:42':{weakness:1,attempts:0,spellingErrors:2,recallErrors:1,independentSuccesses:0}}};const attempt=recordProductionAttempt(state,exercise,'Schrijven.',{today:'2026-09-11',nowIso:'2026-09-11T12:02:00Z'});const word=state.words['card:42'];assert.equal(attempt.errorType,'none');assert.equal(word.weakness,.5);assert.equal(word.independentSuccesses,1);assert.equal(word.spellingErrors,2);assert.equal(word.recallErrors,1);});
