import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTION_STAGE,learnerEvidenceForCard,productionStageForCard,recordProductionAttempt} from '../src/engine/flashcards.js';

const card=overrides=>({id:42,dutch:'schrijven',english:'to write',type:'review',interval:30,ease:2.5,reps:8,lapses:0,first_seen:'2026-08-01',last_reviewed:'2026-09-10',due_date:'2026-10-10',suspended:false,...overrides});

test('two correct guided recalls graduate a mature card to independent readiness',()=>{
 const state={words:{},flashcardProduction:{attempts:[]}};
 const exercise={cardId:'42',stage:PRODUCTION_STAGE.GUIDED,kind:'guided-spelling',prompt:'to write',answer:'schrijven',meaningful:true};
 recordProductionAttempt(state,exercise,'schrijven',{today:'2026-09-10',nowIso:'2026-09-10T08:00:00Z'});
 let evidence=learnerEvidenceForCard(state,42);
 assert.equal(evidence.guidedSuccesses,1);
 assert.equal(productionStageForCard(card(),evidence),PRODUCTION_STAGE.GUIDED);
 recordProductionAttempt(state,exercise,'schrijven',{today:'2026-09-11',nowIso:'2026-09-11T08:00:00Z'});
 evidence=learnerEvidenceForCard(state,42);
 assert.equal(evidence.guidedSuccesses,2);
 assert.equal(productionStageForCard(card(),evidence),PRODUCTION_STAGE.INDEPENDENT);
});

test('an incorrect guided recall does not count toward graduation',()=>{
 const state={words:{},flashcardProduction:{attempts:[]}};
 const exercise={cardId:'42',stage:PRODUCTION_STAGE.GUIDED,kind:'guided-spelling',prompt:'to write',answer:'schrijven',meaningful:true};
 recordProductionAttempt(state,exercise,'schriven',{today:'2026-09-10',nowIso:'2026-09-10T08:00:00Z'});
 const evidence=learnerEvidenceForCard(state,42);
 assert.equal(evidence.guidedSuccesses,0);
 assert.equal(evidence.recallErrors,1);
 assert.equal(productionStageForCard(card(),evidence),PRODUCTION_STAGE.GUIDED);
});

test('existing independent evidence still skips the guided gate',()=>{
 const evidence={guidedSuccesses:0,independentSuccesses:2,weakness:0};
 assert.equal(productionStageForCard(card(),evidence),PRODUCTION_STAGE.INDEPENDENT);
});
