import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {verbGloss} from '../src/content/a1-vocabulary.js';
import {auditA1Fairness} from '../src/content/a1-fairness-audit.js';
import {tokens,normalize} from '../src/engine/util.js';
import {makeExercise} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {freshState} from '../src/engine/learner.js';
import {selectPractice} from '../src/engine/scheduler.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const inScope=s=>/^A1\.(?:[7-9]|1\d|2[01])$/.test(s.concept);
const rows=content.sentences.filter(inScope);

test('content audit reports missing vocabulary and ambiguous prompts',()=>{
 const result=auditA1Fairness(content);
 assert.deepEqual(result.errors,[]);
 assert.deepEqual(result.unpractisedProof,[],'proof must use words introduced in prior or current practice');
 const row={...content.byId['A1.8-t-02'],englishPrompt:content.byId['A1.8-p-01'].englishPrompt,vocabulary:[],suitableKinds:['typed']};
 const changed={...content,sentences:content.sentences.map(s=>s.id===row.id?row:s)};
 const broken=auditA1Fairness(changed).errors;
 assert.ok(broken.some(x=>x.includes('missing vocabulary word')));
 assert.ok(broken.some(x=>x.includes('ambiguous English prompt')));
 assert.ok(broken.some(x=>x.includes('proof needs choice and typed')));
});

test('finite verbs, auxiliaries and participles have accurate positions and meanings',()=>{
 const perfect=content.byId['A1.9-p-01'];
 assert.deepEqual(perfect.verbSlots,[1,4]);
 assert.equal(perfect.vocabulary.find(word=>word.nl==='ben')?.en,'be (perfect tense)');
 assert.equal(perfect.vocabulary.find(word=>word.nl==='gegaan')?.en,'gone');
 const enough=content.byId['A1.19-p-10'];
 assert.equal(enough.verbIndex,3);
 assert.equal(enough.vocabulary.find(word=>word.nl==='genoeg')?.en,'enough');
});

test('the full-vocabulary module is included in the offline course cache',()=>{
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(worker,/\.\/src\/content\/a1-vocabulary\.js/);
 assert.match(worker,/\.\/src\/content\/a1-fair-practice\.js/);
});

test('A1.7–A1.21 sentence vocabulary names every surface word and gives real English target meanings',()=>{
 assert.equal(rows.length,1011);
 for(const row of rows){
  const inventory=new Set(row.vocabulary.flatMap(word=>tokens(word.nl)));
  for(const word of tokens(row.nl))assert.ok(inventory.has(word),`${row.id}: ${word} missing from vocabulary`);
  for(const word of row.vocabulary)assert.ok(word.en?.trim(),`${row.id}: ${word.nl} missing English`);
  for(const word of row.vocabulary.filter(w=>!w.supportOnly&&w.nl===row.verb)){
   assert.ok(verbGloss[row.verb],`${row.id}: no curated verb meaning`);
   assert.notEqual(normalize(word.en),normalize(word.nl),`${row.id}: untranslated target verb`);
  }
 }
});

test('new fairness practice has distinct wording from every proof and valid verb positions',()=>{
 const added=rows.filter(row=>row.id.includes('-fair-p-'));
 assert.equal(added.length,151);
 const proof=new Set(content.sentences.filter(row=>row.pool==='proof').map(row=>normalize(row.nl)));
 const seen=new Set();
 for(const row of added){
  assert.ok(!proof.has(normalize(row.nl)),`${row.id}: repeats proof`);
  assert.ok(!seen.has(normalize(row.nl)),`${row.id}: duplicate practice`);
  seen.add(normalize(row.nl));
  const words=tokens(row.nl);
  assert.ok(row.verbIndex>=0&&row.verbIndex<words.length,`${row.id}: invalid verb position`);
  assert.ok(row.forms.some(form=>normalize(form)===words[row.verbIndex]),`${row.id}: finite form does not match verb metadata`);
  for(const slot of row.verbSlots)assert.ok(slot>=0&&slot<words.length,`${row.id}: invalid verb slot`);
 }
});

test('ambiguous English you prompts specify whether one or several people are addressed',()=>{
 const singular=content.byId['A1.8-p-01'];
 const plural=content.byId['A1.8-t-02'];
 assert.equal(singular.en,plural.en);
 assert.match(singular.englishPrompt,/one person/);
 assert.match(plural.englishPrompt,/several people/);
 assert.notEqual(singular.englishPrompt,plural.englishPrompt);
 for(const row of rows.filter(x=>/\b(you|your)\b/i.test(x.en)&&/\b(jij|je|jou|jouw|jullie|u)\b/i.test(x.nl))){
  assert.notEqual(row.englishPrompt,row.en,`${row.id}: ambiguous you prompt`);
 }
 const seen=new Map();
 for(const row of rows){
  const key=`${row.concept}:${normalize(row.englishPrompt)}`;
  const previous=seen.get(key);
  if(previous)assert.equal(normalize(previous.nl),normalize(row.nl),`${row.id} and ${previous.id}: ambiguous English prompt`);
  else seen.set(key,row);
 }
 assert.match(makeExercise(plural,'typed',content).prompt,/several people/);
});

test('documented time-fronting alternatives receive grammar credit without accepting broken verb order',()=>{
 const normal=content.byId['A1.7-p-01'];
 const q=makeExercise(normal,'typed',content,{phase:'mastery'});
 assert.equal(assess(q,'Vandaag werk ik niet.').grammar,true);
 assert.equal(assess(q,'Vandaag ik werk niet.').grammar,false);
 const jij=content.byId['A1.7-t-02'];
 const q2=makeExercise(jij,'typed',content,{phase:'mastery'});
 assert.equal(assess(q2,'Morgen werk jij niet.').grammar,true);
 assert.equal(assess(q2,'Morgen werkt jij niet.').grammar,false);
 const predicate=content.byId['A1.20-p-06'];
 assert.deepEqual(predicate.alternatives,[]);
});

test('normal scheduling honours suitableKinds and chooses a compatible fallback',()=>{
 const row={...content.byId['A1.7-p-01'],suitableKinds:['choice']};
 const state=freshState(content,new Date('2026-09-28T12:00:00'));
 Object.assign(state.progress['A1.7'],{recognised:4,constructed:4,practiceAttempts:10});
 const selected=selectPractice(state,{sentences:[row],concepts:content.concepts},'A1.7','2026-09-28',false);
 assert.equal(selected.kind,'choice');
 assert.equal(selected.item.id,row.id);
});

test('every declared A1.7–A1.21 question format can present and score its model answer',()=>{
 for(const row of rows){
  assert.ok(row.suitableKinds.length,`${row.id}: no suitable formats`);
  if(row.pool==='proof')for(const kind of ['choice','typed'])assert.ok(row.suitableKinds.includes(kind),`${row.id}: proof needs ${kind}`);
  for(const kind of row.suitableKinds){
   const q=makeExercise(row,kind,content,{seed:row.id,phase:'practice'});
   assert.equal(assess(q,q.answer).grammar,true,`${row.id}: ${kind} rejects the model`);
   if(q.options){assert.ok(q.options.includes(q.answer),`${row.id}: ${kind} omits the answer`);assert.equal(new Set(q.options.map(normalize)).size,q.options.length,`${row.id}: ${kind} repeats an option`);}
   if(q.bank)assert.ok(q.bank.length>=tokens(row.nl).length,`${row.id}: ${kind} has an incomplete bank`);
  }
 }
});
