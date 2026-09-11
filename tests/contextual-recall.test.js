import test from 'node:test';
import assert from 'node:assert/strict';
import {contextualRecallCandidates,contextualExercise,contextualAttemptsToday,contextualEvidenceForCard,contextualProofSummary,CONTEXTUAL_DAILY_LIMIT,CONTEXTUAL_PROOF_SUCCESSES} from '../src/engine/contextual-recall.js';
import {PRODUCTION_STAGE} from '../src/engine/flashcards.js';

const card=(id,overrides={})=>({id,dutch:`woord${id}`,english:`word ${id}`,partofword:'noun',type:'review',interval:120,ease:2.5,reps:12,lapses:0,first_seen:'2026-06-01',last_reviewed:'2026-09-01',due_date:'2026-12-01',suspended:false,dutch_sentence:`Ik gebruik woord${id} vandaag.`,english_sentence:`I use word ${id} today.`,...overrides});
const contextualState={words:{'card:1':{guidedSuccesses:2,independentSuccesses:5,weakness:0},'card:2':{guidedSuccesses:2,independentSuccesses:5,weakness:0}},flashcardProduction:{attempts:[]},attempts:[]};
const ctx=(cardId,date,correct=true)=>({cardId:String(cardId),date,stage:PRODUCTION_STAGE.CONTEXTUAL,meaningful:true,correct});
const course=(cardId,date,overrides={})=>({words:[`card:${cardId}`],date,occurredAt:`${date}T08:00:00Z`,direction:'en-nl',independent:true,grammar:true,spelling:true,assisted:false,...overrides});

test('offers at most one contextual sentence per day and respects overall active-recall capacity',()=>{
 const q=contextualRecallCandidates([card(1),card(2)],structuredClone(contextualState),{today:'2026-09-11',random:()=>.5});
 assert.equal(CONTEXTUAL_DAILY_LIMIT,1);
 assert.equal(q.length,1);
 assert.equal(q[0].evidence.productionStage,PRODUCTION_STAGE.CONTEXTUAL);
 const full=structuredClone(contextualState);full.flashcardProduction.attempts=Array.from({length:5},(_,i)=>({cardId:String(i+10),date:'2026-09-11',stage:PRODUCTION_STAGE.GUIDED,meaningful:true,correct:true}));
 assert.equal(contextualRecallCandidates([card(1)],full,{today:'2026-09-11'}).length,0);
});

test('requires a usable sentence pair containing the complete target word or phrase',()=>{
 const missing=card(1,{dutch_sentence:'',english_sentence:''});
 const unrelated=card(2,{dutch_sentence:'Ik lees vandaag.',english_sentence:'I read today.'});
 assert.equal(contextualRecallCandidates([missing,unrelated],structuredClone(contextualState),{today:'2026-09-11'}).length,0);
 const state={words:{'card:1':{guidedSuccesses:2,independentSuccesses:5,weakness:0}},flashcardProduction:{attempts:[]},attempts:[]};
 const substring=card(1,{dutch:'man',english:'man',dutch_sentence:'De mand staat hier.',english_sentence:'The basket is here.'});
 assert.equal(contextualRecallCandidates([substring],state,{today:'2026-09-11'}).length,0);
 const punctuated=card(1,{dutch:'man',english:'man',dutch_sentence:'Daar staat de man, vandaag.',english_sentence:'The man is standing there today.'});
 assert.equal(contextualRecallCandidates([punctuated],state,{today:'2026-09-11'}).length,1);
});

test('builds a meaningful full-sentence tile exercise',()=>{
 const record=contextualRecallCandidates([card(1)],structuredClone(contextualState),{today:'2026-09-11',random:()=>.5})[0];
 const exercise=contextualExercise(record,()=>.5);
 assert.equal(exercise.stage,PRODUCTION_STAGE.CONTEXTUAL);
 assert.equal(exercise.kind,'context-tiles');
 assert.equal(exercise.answer,'Ik gebruik woord1 vandaag.');
 assert.equal(exercise.prompt,'I use word 1 today.');
 assert.equal(exercise.target,'woord1');
 assert.equal(exercise.meaningful,true);
 assert.equal(exercise.tiles.length,4);
});

test('does not offer a second contextual item after one contextual attempt today',()=>{
 const s=structuredClone(contextualState);s.flashcardProduction.attempts.push(ctx(1,'2026-09-11'));
 assert.equal(contextualAttemptsToday(s,'2026-09-11'),1);
 assert.equal(contextualRecallCandidates([card(1),card(2)],s,{today:'2026-09-11'}).length,0);
});

test('requires successful contextual use on two different days for proof',()=>{
 const s=structuredClone(contextualState);s.flashcardProduction.attempts.push(ctx(1,'2026-09-09'),ctx(1,'2026-09-10'));
 const evidence=contextualEvidenceForCard(s,1);
 assert.equal(CONTEXTUAL_PROOF_SUCCESSES,2);
 assert.equal(evidence.successDays,2);
 assert.equal(evidence.proven,true);
 const sameDay=structuredClone(contextualState);sameDay.flashcardProduction.attempts.push(ctx(1,'2026-09-10'),ctx(1,'2026-09-10'));
 assert.equal(contextualEvidenceForCard(sameDay,1).proven,false);
});

test('independent English to Dutch Course sentences contribute contextual proof',()=>{
 const s=structuredClone(contextualState);s.attempts.push(course(1,'2026-09-09'));s.flashcardProduction.attempts.push(ctx(1,'2026-09-10'));
 const evidence=contextualEvidenceForCard(s,1);
 assert.equal(evidence.courseSuccessDays,1);
 assert.equal(evidence.flashcardSuccessDays,1);
 assert.equal(evidence.successDays,2);
 assert.equal(evidence.proven,true);
 const summary=contextualProofSummary([card(1),card(2)],s);
 assert.equal(summary.courseContributors,1);
});

test('assisted, recognition-direction or grammatically wrong Course work does not count as contextual proof',()=>{
 const s=structuredClone(contextualState);s.attempts.push(course(1,'2026-09-08',{assisted:true}),course(1,'2026-09-09',{direction:'nl-en'}),course(1,'2026-09-10',{grammar:false}));
 const evidence=contextualEvidenceForCard(s,1);
 assert.equal(evidence.courseSuccessDays,0);
 assert.equal(evidence.successDays,0);
 assert.equal(evidence.proven,false);
});

test('a later contextual miss removes proof until later independent sentence use succeeds again',()=>{
 const s=structuredClone(contextualState);s.flashcardProduction.attempts.push(ctx(1,'2026-09-08'),ctx(1,'2026-09-09'),ctx(1,'2026-09-10',false));
 assert.equal(contextualEvidenceForCard(s,1).proven,false);
 s.attempts.push(course(1,'2026-09-11'));
 assert.equal(contextualEvidenceForCard(s,1).proven,true);
 assert.equal(contextualEvidenceForCard(s,1).lastSource,'course');
});

test('contextual practice prioritises unproven words before already proven words',()=>{
 const s=structuredClone(contextualState);s.flashcardProduction.attempts.push(ctx(1,'2026-09-08'),ctx(1,'2026-09-09'));
 const q=contextualRecallCandidates([card(1),card(2)],s,{today:'2026-09-11',random:()=>.5});
 assert.equal(q[0].id,'2');
 const summary=contextualProofSummary([card(1),card(2)],s);
 assert.equal(summary.eligible,2);
 assert.equal(summary.proven,1);
 assert.equal(summary.untried,1);
});
