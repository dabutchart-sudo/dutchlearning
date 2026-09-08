import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {makeExercise,maskedCorrection,sentenceDifference,wordBank,bankAnswer} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {freshState,submit,prepareQuestion,useHelp,ensureDay,startProof} from '../src/engine/learner.js';
import {selectPractice} from '../src/engine/scheduler.js';
import {spellingBlocked,wordBlocked} from '../src/engine/word-recall.js';
import {createRepository} from '../src/engine/persistence.js';
const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-09-08T12:00:00');
const item=content.sentences.find(s=>s.nl==='Wij schrijven.'&&s.pool==='practice');
function state(){const s=freshState(content,now);Object.assign(s.progress.F1,{recognised:4,constructed:4,taught:true});return s;}
function answer(s,raw,kind='typed',source=item,assisted=false){const q=makeExercise(source,kind,content);s.pending=q;if(assisted)useHelp(s);return submit(s,content,q.id,raw,now);}
test('correction hides half the model word including endings, with no capitalisation mismatch',()=>{
 const example={...item,nl:'Hij studeert.',verbIndex:1};
 assert.equal(maskedCorrection(example),'Hij stud____.');
 assert.deepEqual(sentenceDifference('hij studeren','Hij studeert.'),[{text:'Hij',changed:false},{text:'studeert',changed:true}]);
 assert.deepEqual(sentenceDifference('wij speelt','Wij spelen.').map(x=>x.changed),[false,true]);
 for(const word of ['is','heb','werkt','schrijven']){
  const mask=maskedCorrection({...item,nl:`Hij ${word}.`}).split(' ')[1];
  assert.equal((mask.match(/_/g)||[]).length,Math.min(word.length,Math.max(2,Math.ceil(word.length/2))));
 }
});
test('every content sentence produces consistent models and a correct answer in every exercise type',()=>{
 for(const source of content.sentences){
  for(const kind of ['wordbank','gap','form','correction','correct-sentence']){
   const q=makeExercise(source,kind,{sentences:[source]},{seed:1});
   if(q.options)assert.ok(q.options.includes(q.answer),`${source.id} ${kind}`);
   if(kind==='wordbank')assert.match(q.bank.find(t=>t.id==='tile-0').text,/^\p{Lu}/u);
   if(kind==='correction')assert.ok(q.prompt.includes('__'));
   if(kind==='gap'&&source.verbIndex!==0)assert.match(q.prompt,/^\p{Lu}/u);
  }
 }
});
test('word bank preserves repeated tiles and sentence position casing',()=>{
 const bank=wordBank('Wij zien de vrouw en de man.',['wij de'],1);
 assert.equal(bank.filter(t=>t.text==='de').length,2);
 assert.equal(bankAnswer([...bank].sort((a,b)=>Number(a.id.slice(5))-Number(b.id.slice(5))).map(t=>t.id),bank),'Wij zien de vrouw en de man');
});
test('capitalisation and lexical spelling remain separate from grammar',()=>{
 const q=makeExercise(item,'typed',content);
 const lower=assess(q,'wij schrijven');assert.equal(lower.grammar,true);assert.equal(lower.spelling,true);assert.equal(lower.capitalization,false);
 const typo=assess(q,'Wij schijven');assert.equal(typo.grammar,true);assert.equal(typo.spelling,false);
 const form=assess(q,'Wij schrijft');assert.equal(form.grammar,false);assert.equal(form.spelling,true);assert.deepEqual(form.lexicalErrors,[]);
 const unknown=assess(q,'Wij sxxyven');assert.equal(unknown.grammar,null);assert.equal(unknown.spelling,false);
});
test('third independent failure saturates across inflections and exercise types; supported use remains',()=>{
 const s=state();answer(s,'Wij schijven');answer(s,'Wij schijven');
 assert.equal(wordBlocked(s,'schrijven'),true);
 answer(s,item.nl,'wordbank');assert.equal(wordBlocked(s,'schrijven'),false);
 answer(s,'Wij schijven');
 for(const kind of ['typed','gap','correction'])assert.equal(spellingBlocked(s,item,kind),true);
 assert.equal(spellingBlocked(s,item,'wordbank'),false);
 assert.equal(s.wordStruggles.schrijven.needsReintroduction,true);
 assert.equal(s.progress.F1.weakness,0);
 for(let count=s.daily.count;count<20;count++){
  const chosen=selectPractice(s,content,'F1',s.daily.date,false);
  assert.equal(spellingBlocked(s,chosen.item,chosen.kind),false);
  answer(s,chosen.kind==='gap'?chosen.item.nl.replace(/[.!?]/g,'').split(' ')[chosen.item.verbIndex]:chosen.kind==='choice'?chosen.item.en:chosen.item.nl,chosen.kind,chosen.item);
 }
 assert.equal(prepareQuestion(s,content,now),null);
});
test('assistance and grammar-only failures cannot saturate a word',()=>{
 const s=state();for(let i=0;i<3;i++)answer(s,'Wij schijven','typed',item,true);
 for(let i=0;i<3;i++)answer(s,'Wij schrijft');
 assert.equal(wordBlocked(s,'schrijven'),false);assert.equal(s.wordStruggles?.schrijven,undefined);
 assert.equal(s.attempts[0].independent,false);
});
test('lexical ambiguity does not increase grammar weakness or penalise other words',()=>{
 const s=state();const record=answer(s,'Wij sxxyven');assert.equal(record.grammar,null);assert.equal(s.progress.F1.weakness,0);
 const multi={...item,id:'multi',nl:'Wij schrijven boeken.',vocabulary:[...item.vocabulary,{id:'books',nl:'boeken',en:'books'}]};
 const c={...content,byId:{...content.byId,multi}};
 const q=makeExercise(multi,'typed',c);s.pending=q;submit(s,c,q.id,'Wij schijven boeken',now);
 assert.equal(s.words.books.weakness,0);
});
test('saturation survives persistence and allows a gradual new-day return',()=>{
 const s=state();for(let i=0;i<3;i++)answer(s,'Wij schijven');
 const storage=new Map(),repo=createRepository({getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},content);
 repo.save(s);const restored=repo.load();assert.equal(wordBlocked(restored,'schrijven'),true);
 const tomorrow=new Date('2026-09-09T12:00:00');ensureDay(restored,tomorrow);
 assert.equal(wordBlocked(restored,'schrijven'),false);
 let q=makeExercise(item,'typed',content);restored.pending=q;submit(restored,content,q.id,'Wij schijven',tomorrow);
 assert.equal(wordBlocked(restored,'schrijven'),true);
 ensureDay(restored,new Date('2026-09-10T12:00:00'));q=makeExercise(item,'typed',content);restored.pending=q;submit(restored,content,q.id,item.nl,new Date('2026-09-10T12:00:00'));
 assert.equal(wordBlocked(restored,'schrijven'),false);assert.equal(restored.wordStruggles.schrijven.needsReintroduction,false);
});
test('pending V5.1.4 questions upgrade in the engine without losing assistance or identity',()=>{
 const s=state();s.pending=makeExercise(item,'correction',content);delete s.pending.presentationVersion;s.pending.prompt='wij schrijft';s.pending.assisted=true;const id=s.pending.id;
 const q=prepareQuestion(s,content,now);assert.equal(q.id,id);assert.equal(q.assisted,true);assert.equal(q.prompt,'Wij schr_____.');
});
test('proof remains unassisted, twenty questions, with independent unseen material',()=>{
 const s=state();s.progress.F1.status='proof-ready';startProof(s,content,'F1','mastery',now);
 assert.equal(s.proof.questions.length,20);assert.equal(new Set(s.proof.questions.map(q=>q.sourceId)).size,20);
 prepareQuestion(s,content,now);assert.throws(()=>useHelp(s),/unavailable/);
 for(let i=0;i<20;i++){const q=prepareQuestion(s,content,now);submit(s,content,q.id,q.answer,now);}
 assert.equal(s.lastProof.passed,true);assert.equal(s.progress.F1.retentionDue,'2026-09-11');assert.equal(s.progress.F1.masteredAt,null);
});
test('service worker caches every new runtime module and version',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const file of ['word-recall.js','peek.js'])assert.ok(sw.includes(file));assert.ok(sw.includes('v5.1.5'));
});
test('feedback always supplies full Dutch and English before specific word differences',async()=>{
 const {correctiveFeedback}=await import('../src/engine/exercises.js');
 for(const kind of ['gap','form','typed','correction','choice','correct-sentence','wordbank']){
  const q=makeExercise(item,kind,content),raw=['gap','form'].includes(kind)?'schrijft':'wij schrijft';
  const feedback=correctiveFeedback(q,item,raw,assess(q,raw));
  assert.equal(feedback.words.map(w=>w.text).join(' ')+feedback.punctuation,item.nl);
  assert.equal(feedback.meaning,item.en);
  if(q.direction==='en-nl')assert.ok(feedback.differences.includes('schrijft → schrijven'));
 }
});
test('accepted subject aliases are not misleadingly highlighted in feedback',async()=>{
 const {correctiveFeedback}=await import('../src/engine/exercises.js');const q=makeExercise(item,'typed',content);
 const feedback=correctiveFeedback(q,item,'We schrijven.',assess(q,'We schrijven.'));
 assert.equal(feedback.differences.length,0);assert.ok(feedback.words.every(w=>!w.changed));
});
test('a fully saturated practice pool falls back to supported construction',()=>{
 const s=state();for(let i=0;i<3;i++)answer(s,'Wij schijven');s.progress.F1.practiceAttempts=0;
 const limited={...content,sentences:[item],concepts:[content.conceptById.F1]};
 const chosen=selectPractice(s,limited,'F1',s.daily.date,false);assert.equal(chosen.kind,'wordbank');
});
test('unknown misspelled endings remain unproven grammar, not grammar failures or proof credit',()=>{
 const q=makeExercise(item,'typed',content);
 for(const raw of ['Wij schrijvn','Wij schijve']){const result=assess(q,raw);assert.equal(result.grammar,null);assert.equal(result.spelling,false);assert.deepEqual(result.lexicalErrors,[1]);}
});
test('participle weakness does not block an auxiliary-only gap',()=>{
 const source=content.sentences.find(x=>x.concept==='A1.6'&&x.verb==='werken');const s=state();
 s.wordStruggles.werken={needsReintroduction:true};s.attempts=[{date:s.daily.date,phase:'practice',wordEvidence:{attempted:['werken'],failed:['werken'],supported:[]}}];
 assert.equal(spellingBlocked(s,source,'typed'),true);assert.equal(spellingBlocked(s,source,'gap'),false);
});
