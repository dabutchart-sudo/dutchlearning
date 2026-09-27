import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {makeExercise,bankAnswer} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {normalize,tokens} from '../src/engine/util.js';

const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);
const rows=content.sentences.filter(s=>s.concept==='A1.9'&&s.pool==='practice');
const added=rows.filter(s=>Number(s.id.split('-').at(-1))>10);
const participles={gaan:'gegaan',komen:'gekomen',blijven:'gebleven',worden:'geworden',vertrekken:'vertrokken',aankomen:'aangekomen'};

test('zijn-perfect practice broadens every taught verb without introducing new verb families',()=>{
 assert.ok(rows.length>=20);
 assert.equal(new Set(rows.map(s=>normalize(s.nl))).size,rows.length);
 assert.equal(new Set(rows.map(s=>normalize(s.en))).size,rows.length);
 assert.ok(new Set(rows.map(s=>s.subject)).size>=10);
 assert.deepEqual([...new Set(rows.map(s=>s.verb))].sort(),Object.keys(participles).sort());
 for(const verb of Object.keys(participles))assert.ok(rows.filter(s=>s.verb===verb).length>=3,verb);
 const existingText=new Set(content.sentences.filter(s=>!added.includes(s)).map(s=>normalize(s.nl)));
 for(const row of added)assert.ok(!existingText.has(normalize(row.nl)),row.id);
});

test('new perfect-tense items identify both the auxiliary and final participle for scoring',()=>{
 for(const row of added){
  const words=tokens(row.nl);
  assert.ok(['ben','bent','is','zijn'].includes(words[row.verbIndex]),row.id);
  assert.ok(row.forms.includes(words[row.verbIndex]),row.id);
  assert.equal(words.at(-1),participles[row.verb],row.id);
  assert.deepEqual(row.verbSlots,[row.verbIndex,words.length-1],row.id);
  assert.equal(row.vocabulary[0].nl,row.verb,row.id);
 }
});

test('added zijn-perfect sentences work in all declared question formats',()=>{
 for(const row of added){
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

test('zijn-perfect production tolerates capitalisation but rejects lost tense structure',()=>{
 for(const row of added){
  const q=makeExercise(row,'typed',content);
  assert.equal(assess(q,row.nl.toLowerCase()).grammar,true,row.id);
  const words=tokens(row.nl);
  assert.equal(assess(q,words.filter((_,i)=>i!==row.verbIndex).join(' ')).grammar,false,row.id);
  assert.equal(assess(q,words.slice(0,-1).join(' ')).grammar,false,row.id);
  const wrongAuxiliary=[...words];wrongAuxiliary[row.verbIndex]=words[row.verbIndex]==='zijn'?'hebben':'heeft';
  assert.equal(assess(q,wrongAuxiliary.join(' ')).grammar,false,row.id);
  const wrongOrder=[...words];[wrongOrder[row.verbIndex],wrongOrder[words.length-1]]=[wrongOrder[words.length-1],wrongOrder[row.verbIndex]];
  assert.equal(assess(q,wrongOrder.join(' ')).errorType,'word_order',row.id);
 }
});
