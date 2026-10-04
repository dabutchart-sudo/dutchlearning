import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {normalize,displayTokens} from '../src/engine/util.js';
import {lessonMaterial} from '../src/ui/teaching-support.js';
const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);
test('S2 follows the simple-problem chunk with reusable introductions',()=>{
 const concept=content.conceptById.S2;assert.ok(concept);assert.deepEqual(concept.prerequisites,['S1']);
 for(const phrase of ['ik heet','hoe heet u','ik kom uit','ik woon in'])assert.match(concept.rule,new RegExp(phrase));
});
test('S2 has distinct guided practice and enough unseen proof',()=>{
 const rows=content.sentences.filter(x=>x.concept==='S2');
 const practice=rows.filter(x=>x.pool==='practice');
 const proof=rows.filter(x=>x.pool==='proof');
 assert.ok(practice.length>=10);assert.ok(proof.length>=40);
 const dutch=rows.map(x=>normalize(x.nl));
 assert.equal(new Set(dutch).size,dutch.length);
 const earlier=new Set(content.sentences.filter(x=>x.concept!=='S2').map(x=>normalize(x.nl)));
 for(const row of rows){
  assert.equal(earlier.has(normalize(row.nl)),false,row.nl);
  assert.deepEqual(row.suitableKinds,['choice','wordbank','typed','gap','form','correct-sentence','correction','listening']);
  const parts=displayTokens(row.nl);
  assert.ok(row.verbIndex>=0&&row.verbIndex<parts.length,row.nl);
  assert.ok(row.forms.map(normalize).includes(normalize(parts[row.verbIndex])),row.nl);
 }
});
test('S2 practises name, origin and home before proof',()=>{
 const practice=content.sentences.filter(x=>x.concept==='S2'&&x.pool==='practice').map(x=>x.nl).join(' ');
 for(const phrase of ['heet','Hoe heet u','kom uit','woon in','Amsterdam'])assert.match(practice,new RegExp(phrase));
 const lesson=lessonMaterial(content,'S2');
 assert.ok(lesson.focus.length>=2);
 assert.ok(lesson.examples.length>=2);
 for(const example of lesson.examples)assert.ok(content.sentences.some(x=>x.concept==='S2'&&x.pool==='practice'&&x.nl===example.nl));
});
test('S2 content ships in the offline build',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert.match(sw,/scenario-introductions\.js/);
});
