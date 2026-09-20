import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);
test('A1.21 teaches place and movement after clock time',()=>{
 assert.ok(content.conceptById['A1.21']);
 assert.deepEqual(content.conceptById['A1.21'].prerequisites,['A1.20']);
 assert.match(content.conceptById['A1.21'].rule,/naar/);
 assert.match(content.conceptById['A1.21'].rule,/Uit|uit/);
 assert.match(content.conceptById['A1.21'].rule,/van/);
});
test('A1.21 has enough unique practice and proof material',()=>{
 const p=content.sentences.filter(x=>x.concept==='A1.21'&&x.pool==='practice');
 const proof=content.sentences.filter(x=>x.concept==='A1.21'&&x.pool==='proof');
 assert.ok(p.length>=10);
 assert.ok(proof.length>=40);
 assert.equal(new Set(proof.map(x=>x.nl.toLowerCase())).size,proof.length);
 for(const row of [...p,...proof]){
  assert.ok(row.forms?.length);
  assert.ok(row.verbIndex>=0&&row.verbIndex<row.nl.trim().split(/\s+/).length);
 }
});
test('A1.21 practises naar, in, op, bij, uit and van in useful sentences',()=>{
 const text=content.sentences.filter(x=>x.concept==='A1.21').map(x=>x.nl).join(' ');
 for(const form of ['naar','in','op','bij','uit','van'])assert.match(text,new RegExp(`\\b${form}\\b`,'i'));
 assert.match(text,/ga naar huis|ligt op de tafel|komt uit Amsterdam|is van mijn zus/i);
});
test('capability expansion 3 ships in the offline build',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(sw,/a1-capability-expansion-3\.js/);
});
