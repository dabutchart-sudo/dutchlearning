import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);
test('A1.22 follows place and movement with a usable directions framework',()=>{
 const concept=content.conceptById['A1.22'];assert.ok(concept);assert.deepEqual(concept.prerequisites,['A1.21']);
 for(const phrase of ['rechtdoor','links','rechts','naast','tegenover'])assert.match(concept.rule,new RegExp(phrase));
});
test('A1.22 has distinct guided practice and enough proof material',()=>{
 const practice=content.sentences.filter(x=>x.concept==='A1.22'&&x.pool==='practice');
 const proof=content.sentences.filter(x=>x.concept==='A1.22'&&x.pool==='proof');
 assert.ok(practice.length>=10);assert.ok(proof.length>=40);assert.equal(new Set(proof.map(x=>x.nl.toLowerCase())).size,proof.length);
 for(const row of [...practice,...proof]){assert.ok(row.forms?.length);assert.ok(row.verbIndex>=0&&row.verbIndex<row.nl.trim().split(/\s+/).length);}
});
test('A1.22 practices directions and relative locations in everyday contexts',()=>{
 const text=content.sentences.filter(x=>x.concept==='A1.22').map(x=>x.nl).join(' ');
 for(const phrase of ['rechtdoor','links','rechts','naast','tegenover'])assert.match(text,new RegExp(`\\b${phrase}\\b`,'i'));
 assert.match(text,/station|supermarkt|kerk/i);
});
test('A1.22 content ships in the offline build',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert.match(sw,/a1-capability-expansion-4\.js/);
});
