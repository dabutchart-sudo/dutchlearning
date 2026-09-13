import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
const foundation=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([foundation]);

test('A1.15 and A1.16 extend the sequential A1 course',()=>{
 const neg=content.conceptById['A1.15'],sep=content.conceptById['A1.16'];
 assert.ok(neg);assert.ok(sep);
 assert.deepEqual(neg.prerequisites,['A1.14']);
 assert.deepEqual(sep.prerequisites,['A1.15']);
 assert.match(neg.rule,/geen/);assert.match(neg.rule,/niet/);
 assert.match(sep.rule,/separable verb splits/);
});

test('new concepts have enough distinct practice and proof material for sustained progression',()=>{
 for(const id of ['A1.15','A1.16']){
  const practice=content.sentences.filter(x=>x.concept===id&&x.pool==='practice');
  const proof=content.sentences.filter(x=>x.concept===id&&x.pool==='proof');
  assert.ok(practice.length>=10,`${id} needs a useful practice pool`);
  assert.ok(proof.length>=32,`${id} needs mastery plus retention proof reserve`);
  assert.equal(new Set(proof.map(x=>x.nl.toLowerCase())).size,proof.length,`${id} proof sentences must be unique`);
 }
});

test('negation teaches both geen for nouns and niet for other negation',()=>{
 const rows=content.sentences.filter(x=>x.concept==='A1.15');
 assert.ok(rows.some(x=>/\bgeen\b/i.test(x.nl)));
 assert.ok(rows.some(x=>/\bniet\b/i.test(x.nl)));
});

test('separable-verb material marks both finite verb and separated particle',()=>{
 const rows=content.sentences.filter(x=>x.concept==='A1.16');
 assert.ok(rows.every(x=>Array.isArray(x.verbSlots)&&x.verbSlots.length===2));
 assert.ok(rows.some(x=>x.nl==='Ik sta om zeven uur op.'));
 assert.ok(rows.some(x=>x.nl==='Zij belt haar moeder op.'));
});
