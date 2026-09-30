import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {normalize,tokens} from '../src/engine/util.js';
import {makeExercise} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {lessonMaterial} from '../src/ui/teaching-support.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const ids=Array.from({length:15},(_,i)=>`A1.${i+7}`);
const added=content.sentences.filter(row=>row.id.includes('-teaching-p-'));

test('A1.7–A1.21 have taught patterns and varied practice before proof',()=>{
 for(const id of ids){
  const practice=content.sentences.filter(row=>row.concept===id&&row.pool==='practice');
  const proof=content.sentences.filter(row=>row.concept===id&&row.pool==='proof');
  assert.ok(practice.length>=20,`${id}: fewer than 20 practice contexts`);
  assert.ok(new Set(practice.map(row=>normalize(row.nl))).size>=20,`${id}: too few distinct contexts`);
  assert.ok(new Set(practice.map(row=>normalize(row.subject))).size>=5,`${id}: too few subjects`);
  assert.ok(proof.length>=20,`${id}: no substantial assessed pool`);
  assert.ok(lessonMaterial(content,id).focus.length>=2,`${id}: missing focused teaching`);
 }
});

test('the added contexts have complete metadata, do not overlap proof, and work in their formats',()=>{
 assert.equal(added.length,29);
 const proof=new Set(content.sentences.filter(row=>row.pool==='proof').map(row=>normalize(row.nl)));
 const seen=new Set();
 for(const row of added){
  const key=normalize(row.nl),words=tokens(row.nl);
  assert.ok(!proof.has(key),`${row.id}: repeats proof`);
  assert.ok(!seen.has(key),`${row.id}: duplicate added context`);seen.add(key);
  assert.ok(row.en&&row.vocabulary.length,`${row.id}: missing meaning or word metadata`);
  for(const word of words)assert.ok(row.vocabulary.some(v=>tokens(v.nl).includes(word)),`${row.id}: missing ${word}`);
  assert.ok(row.forms.some(form=>normalize(form)===words[row.verbIndex]),`${row.id}: wrong finite verb`);
  for(const slot of row.verbSlots)assert.ok(slot>=0&&slot<words.length,`${row.id}: invalid verb slot`);
  for(const kind of row.suitableKinds){
   const q=makeExercise(row,kind,content,{phase:'practice'});
   assert.equal(assess(q,q.answer).grammar,true,`${row.id}: ${kind} rejects model answer`);
  }
 }
});

test('new content and teaching helper are in the offline app bundle',()=>{
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(worker,/\.\/src\/content\/a1-teaching-practice\.js/);
 assert.match(worker,/\.\/src\/ui\/teaching-support\.js/);
});
