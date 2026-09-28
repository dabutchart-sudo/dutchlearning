import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {auditA1ProofCapacity} from '../src/content/a1-proof-capacity-audit.js';
import {proofVocabularyNeed} from '../src/engine/proof-vocabulary.js';
import {freshState,prepareQuestion,proofEligibility,startProof,submit} from '../src/engine/learner.js';
import {normalize} from '../src/engine/util.js';
import {seedCompletedPractice} from './helpers/practice-evidence.js';

const pack=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([pack]);
const topics=Array.from({length:15},(_,index)=>`A1.${index+7}`);
const day=index=>new Date(Date.UTC(2026,8,1+index,12));

test('all A1.7–A1.21 topics have ninety effective, practised, unseen proof sentences',()=>{
 const report=auditA1ProofCapacity(content);
 assert.deepEqual(report.map(row=>row.concept),topics);
 for(const row of report){
  assert.equal(row.shortfall,0,`${row.concept}: ${row.effective} effective of 90 required`);
  assert.equal(row.duplicates.length,0,`${row.concept}: duplicate proof text`);
  assert.equal(row.unpractised.length,0,`${row.concept}: unpractised proof vocabulary`);
 }
});

test('capacity audit flags duplicate proof and earlier-course exposure',()=>{
 const duplicate={...content.sentences.find(row=>row.concept==='A1.7'&&row.pool==='proof'),id:'audit-duplicate'};
 const earlier={...content.sentences.find(row=>row.concept==='A1.8'&&row.pool==='proof'),
  id:'audit-earlier',nl:content.sentences.find(row=>row.concept==='A1.7'&&row.pool==='practice').nl};
 const report=auditA1ProofCapacity({...content,sentences:[...content.sentences,duplicate,earlier]});
 assert.ok(report.find(row=>row.concept==='A1.7').duplicates.includes('audit-duplicate'));
 assert.ok(report.find(row=>row.concept==='A1.8').exposureCollisions.includes('audit-earlier'));
});

test('three failed mastery days, a fresh pass, then delayed retention consume distinct proof sentences',()=>{
 for(const id of topics){
  const state=freshState(content,day(0));
  for(const concept of content.concepts){
   if(concept.id===id)break;
   Object.assign(state.progress[concept.id],{status:'mastered',masteredAt:'2026-08-31',nextMaintenance:'2099-01-01'});
   for(const item of content.sentences.filter(row=>row.concept===concept.id))
    state.exposures.push({nl:normalize(item.nl),reason:'earlier-course',words:[]});
  }
  seedCompletedPractice(state,content,id);
  for(const item of content.sentences.filter(row=>row.concept===id&&row.pool==='practice'))
   state.exposures.push({nl:normalize(item.nl),reason:'practice',words:[]});
  Object.assign(state.progress[id],{status:'proof-ready',practiceAttempts:40,taught:true,lessonAcknowledged:true});
  const proofSeen=new Set();
  for(let attempt=0;attempt<4;attempt++){
   const date=day(attempt);
   state.daily={date:date.toISOString().slice(0,10),count:0};
   assert.equal(proofEligibility(state,content,id,'mastery',date),null,`${id}: mastery attempt ${attempt+1}`);
   assert.ok(proofVocabularyNeed(state,content,id,'mastery').available>=30);
   startProof(state,content,id,'mastery',date);
   assert.equal(state.proof.questions.length,20);
   for(let index=0;index<20;index++){
    const question=prepareQuestion(state,content,date,false);
    const sentence=normalize(content.byId[question.sourceId].nl);
    assert.ok(!proofSeen.has(sentence),`${id}: recycled mastery sentence ${sentence}`);
    proofSeen.add(sentence);
    submit(state,content,question.id,attempt<3&&index<2?'definitely wrong':question.answer,date);
   }
   assert.equal(state.lastProof.passed,attempt===3,`${id}: attempt ${attempt+1} outcome`);
  }
  const retention=day(6);
  state.daily={date:retention.toISOString().slice(0,10),count:0};
  assert.equal(proofEligibility(state,content,id,'retention',retention),null,`${id}: retention`);
  startProof(state,content,id,'retention',retention);
  for(let index=0;index<10;index++){
   const question=prepareQuestion(state,content,retention,false);
   const sentence=normalize(content.byId[question.sourceId].nl);
   assert.ok(!proofSeen.has(sentence),`${id}: recycled retention sentence ${sentence}`);
   proofSeen.add(sentence);
   submit(state,content,question.id,question.answer,retention);
  }
  assert.equal(state.lastProof.passed,true,`${id}: retention passed`);
  assert.equal(state.progress[id].status,'mastered',`${id}: retained`);
  assert.equal(proofSeen.size,90,`${id}: exactly ninety distinct proof sentences used`);
 }
});

test('capacity pack is available offline',()=>{
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(worker,/\.\/src\/content\/a1-proof-capacity\.js/);
});
