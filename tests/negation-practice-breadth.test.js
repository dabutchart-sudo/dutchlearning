import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {makeExercise,bankAnswer} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {normalize,tokens} from '../src/engine/util.js';
const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);
const rows=content.sentences.filter(s=>s.concept==='A1.7'&&s.pool==='practice');

test('negation practice broadens contexts without exposing proof sentences',()=>{
 assert.ok(rows.length>=20);
 assert.equal(new Set(rows.map(s=>normalize(s.nl))).size,rows.length);
 assert.equal(new Set(rows.map(s=>normalize(s.en))).size,rows.length);
 assert.ok(new Set(rows.map(s=>s.verb)).size>=10);
 assert.ok(new Set(rows.map(s=>s.subject)).size>=10);
 const proof=new Set(content.sentences.filter(s=>s.pool==='proof').map(s=>normalize(s.nl)));
 for(const row of rows.filter(s=>Number(s.id.split('-').at(-1))>10))assert.ok(!proof.has(normalize(row.nl)),row.id);
});

test('every added sentence works in its declared formats and rejects lost negation',()=>{
 for(const row of rows.filter(s=>Number(s.id.split('-').at(-1))>10)){
  assert.ok(row.forms.includes(tokens(row.nl)[row.verbIndex]),row.id);
  for(const kind of row.suitableKinds){
   const q=makeExercise(row,kind,content,{seed:row.id});
   let answer=q.answer;
   if(kind==='wordbank'){
    const selection=[];
    for(const word of tokens(row.nl)){
     const tile=q.bank.find(t=>normalize(t.text)===word&&!selection.includes(t.id));
     assert.ok(tile,`${row.id}: ${word}`);selection.push(tile.id);
    }
    answer=bankAnswer(selection,q.bank);
   }
   if(q.options){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);}
   assert.equal(assess(q,answer).grammar,true,`${row.id}: ${kind}`);
  }
  const q=makeExercise(row,'typed',content);
  assert.equal(assess(q,row.nl.replace(/niet(?: |\.)/,'')).grammar,false,row.id);
 }
});
