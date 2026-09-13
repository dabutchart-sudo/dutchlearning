import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {activeConcept,freshState,prepareQuestion,proofEligibility,startProof,submit,teachConcept} from '../src/engine/learner.js';

const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);

function answerProof(state,now){
 while(state.proof){const q=prepareQuestion(state,content,now,false);assert.ok(q?.id);submit(state,content,q.id,q.answer,now);}
}
function proveAndRetain(state,id,date){
 const p=state.progress[id];Object.assign(p,{practiceAttempts:40,recognised:4,constructed:4,independent:12,status:'proof-ready',taught:true});state.pending=null;state.daily={date:date.toISOString().slice(0,10),count:0};
 assert.equal(proofEligibility(state,content,id,'mastery',date),null);startProof(state,content,id,'mastery',date);assert.equal(state.proof.questions.length,20);assert.equal(new Set(state.proof.questions.map(q=>q.sourceId)).size,20);answerProof(state,date);
 const retention=new Date(date);retention.setUTCDate(retention.getUTCDate()+3);state.daily={date:retention.toISOString().slice(0,10),count:0};assert.equal(activeConcept(state,content),id);assert.equal(proofEligibility(state,content,id,'retention',retention),null);startProof(state,content,id,'retention',retention);assert.equal(state.proof.questions.length,10);assert.equal(new Set(state.proof.questions.map(q=>q.sourceId)).size,10);answerProof(state,retention);return retention;
}

test('A1.7 and A1.8 extend the existing A1 course with enough real proof material',()=>{
 for(const id of ['A1.7','A1.8']){
  const concept=content.conceptById[id];assert.ok(concept);assert.equal(concept.level,'A1');
  const rows=content.sentences.filter(s=>s.concept===id);assert.ok(rows.filter(s=>s.pool==='practice').length>=10);assert.ok(rows.filter(s=>s.pool==='proof').length>=30);assert.equal(new Set(rows.map(s=>s.nl)).size,rows.length);
 }
 assert.deepEqual(content.conceptById['A1.7'].prerequisites,['A1.6']);assert.deepEqual(content.conceptById['A1.8'].prerequisites,['A1.7']);
});

test('the learner can retain A1.7, unlock A1.8 lesson-first, then retain A1.8',()=>{
 let now=new Date('2026-10-01T12:00:00Z');const state=freshState(content,now);
 for(const c of content.concepts){if(c.id==='A1.7'||c.id==='A1.8')continue;Object.assign(state.progress[c.id],{status:'mastered',masteredAt:'2026-09-30',taught:true,nextMaintenance:'2099-01-01'});}
 assert.equal(activeConcept(state,content),'A1.7');assert.deepEqual(prepareQuestion(state,content,now,false),{teachingConcept:'A1.7'});teachConcept(state,'A1.7',content);now=proveAndRetain(state,'A1.7',now);
 assert.equal(state.progress['A1.7'].status,'mastered');assert.equal(activeConcept(state,content),'A1.8');assert.deepEqual(prepareQuestion(state,content,now,false),{teachingConcept:'A1.8'});teachConcept(state,'A1.8',content);now=proveAndRetain(state,'A1.8',now);assert.equal(state.progress['A1.8'].status,'mastered');
});
