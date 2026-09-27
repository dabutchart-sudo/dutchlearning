import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {makeExercise,bankAnswer} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {normalize,tokens} from '../src/engine/util.js';

const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);
const rows=content.sentences.filter(s=>s.concept==='A1.8'&&s.pool==='practice');
const added=rows.filter(s=>Number(s.id.split('-').at(-1))>10);

test('question-word practice covers all five question words in varied contexts',()=>{
 assert.ok(rows.length>=20);
 assert.equal(new Set(rows.map(s=>normalize(s.nl))).size,rows.length);
 assert.equal(new Set(rows.map(s=>normalize(s.en))).size,rows.length);
 assert.ok(new Set(rows.map(s=>s.verb)).size>=10);
 assert.ok(new Set(rows.map(s=>s.subject)).size>=10);
 for(const word of ['waar','wat','wanneer','hoe','wie']){
  assert.ok(rows.filter(s=>tokens(s.nl)[0]===word).length>=4,word);
  for(const row of rows.filter(s=>tokens(s.nl)[0]===word)){
   assert.equal(row.vocabulary[0].nl,word,row.id);
  }
 }
 const existingText=new Set(content.sentences.filter(s=>!added.includes(s)).map(s=>normalize(s.nl)));
 for(const row of added)assert.ok(!existingText.has(normalize(row.nl)),row.id);
});

test('added question-word sentences work in all declared formats',()=>{
 for(const row of added){
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
   if(q.options){
    assert.ok(q.options.includes(q.answer));
    assert.equal(new Set(q.options.map(normalize)).size,q.options.length);
    for(const wrong of q.options.filter(option=>normalize(option)!==normalize(q.answer))){
     assert.equal(assess(q,wrong).grammar,false,`${row.id}: ${kind} distractor`);
    }
   }
   assert.equal(assess(q,answer).grammar,true,`${row.id}: ${kind}`);
  }
 }
});

test('question-word production accepts sentence case and rejects missing words or changed order',()=>{
 for(const row of added){
  const q=makeExercise(row,'typed',content);
  assert.equal(assess(q,row.nl.toLowerCase()).grammar,true,row.id);
  const words=tokens(row.nl);
  assert.equal(assess(q,words.slice(1).join(' ')).grammar,false,row.id);
  [words[0],words[1]]=[words[1],words[0]];
  assert.equal(assess(q,words.join(' ')).errorType,'word_order',row.id);
 }
});
