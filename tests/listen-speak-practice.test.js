import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {makeExercise} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {freshState,prepareQuestion,prepareExtraQuestion,skipSpeaking,startExtraPractice,startProof,submit,teachConcept} from '../src/engine/learner.js';
import {practiceKind} from '../src/engine/scheduler.js';
import {validateState} from '../src/engine/persistence.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-09-20T12:00:00');
const ready={recognised:4,constructed:4,weakness:0,taught:true,lessonAcknowledged:true};

function practised(canListen=true,canSpeak=false){
 const state=freshState(content,now);
 Object.assign(state.progress.F1,ready,{practiceAttempts:11});
 teachConcept(state,'F1',content);
 return {state,answer(){
  const q=prepareQuestion(state,content,now,canListen,canSpeak);
  assert.ok(q?.id);
  submit(state,content,q.id,q.answer,now);
  return q;
 }};
}

test('existing learner history defaults speaking off and turns the daily listening beat on once',()=>{
 const state=freshState(content,now);
 assert.equal(state.settings.speaking,false);
 assert.equal(state.settings.listening,true);
 const restored=validateState({...state,settings:{listening:false,speaking:false}},content);
 assert.equal(restored.settings.listening,true);
 assert.equal(restored.settings.speaking,false);
 const optedOut=validateState({...state,settings:{listening:false,speaking:false,dailyListenSpeakBeats:true}},content);
 assert.equal(optedOut.settings.listening,false);
 assert.equal(optedOut.settings.speaking,false);
});

test('the later practice cycle keeps correction in place and does not sprinkle speaking',()=>{
 assert.equal(practiceKind({...ready,practiceAttempts:11},false,true),'typed');
 assert.equal(practiceKind({...ready,practiceAttempts:11},false,false),'typed');
 assert.equal(practiceKind({...ready,practiceAttempts:14},true,true),'correction');
 assert.equal(practiceKind({...ready,practiceAttempts:11},true,true,{dailyCount:6,heardToday:false,spokenToday:false,phase:'practice'}),'listening');
 assert.equal(practiceKind({...ready,practiceAttempts:11},true,true,{dailyCount:7,heardToday:true,spokenToday:false,phase:'practice'}),'speaking');
});

test('a later-cycle day includes exactly one listening beat and no extra questions',()=>{
 const {state,answer}=practised(true,false);
 const kinds=[];
 while(state.daily.count<20)kinds.push(answer().kind);
 assert.equal(kinds.filter(kind=>kind==='listening').length,1);
 assert.equal(kinds.filter(kind=>kind==='speaking').length,0);
 assert.ok(kinds.indexOf('listening')>=6);
 assert.equal(state.daily.count,20);
 assert.equal(prepareQuestion(state,content,now,true,false),null);
});

test('speaking stays one skippable beat inside the same daily 20',()=>{
 const {state,answer}=practised(true,true);
 const kinds=[];
 let skipped=false;
 while(state.daily.count<20){
  const q=prepareQuestion(state,content,now,true,true);
  assert.ok(q?.id);
  if(q.kind==='speaking'&&!skipped){
   const typed=skipSpeaking(state);
   assert.equal(typed.id,q.id);
   assert.equal(typed.kind,'typed');
   assert.equal(typed.prompt,q.prompt);
   submit(state,content,typed.id,typed.answer,now);
   skipped=true;
   kinds.push('speaking-skipped');
   continue;
  }
  submit(state,content,q.id,q.answer,now);
  kinds.push(q.kind);
 }
 assert.equal(skipped,true);
 assert.equal(kinds.filter(kind=>kind==='listening').length,1);
 assert.equal(kinds.filter(kind=>kind==='speaking'||kind==='speaking-skipped').length,1);
 assert.equal(state.daily.count,20);
});

test('mastery proofs stay written when listening and speaking are on',()=>{
 const state=freshState(content,now);
 Object.assign(state.progress.F1,ready,{practiceAttempts:40,status:'proof-ready'});
 startProof(state,content,'F1','mastery',now);
 assert.ok(state.proof.questions.every(q=>q.kind==='choice'||q.kind==='typed'));
 assert.equal(state.proof.questions.filter(q=>q.kind==='choice').length,10);
 assert.equal(state.proof.questions.filter(q=>q.kind==='typed').length,10);
});

test('extra practice does not consume the daily listening or speaking beat',()=>{
 const state=freshState(content,now);
 Object.assign(state.progress.F1,ready,{practiceAttempts:40,status:'mastered',masteredAt:'2026-09-13'});
 startExtraPractice(state,'F1',now);
 const kinds=[];
 while(state.extra){
  const q=prepareExtraQuestion(state,content,now,true,true);
  kinds.push(q.kind);
  submit(state,content,q.id,q.answer,now);
 }
 assert.equal(kinds.length,5);
 assert.equal(kinds.includes('listening'),false);
 assert.equal(kinds.includes('speaking'),false);
 assert.equal(state.daily.count,0);
});

test('skipping speaking keeps the same English-to-Dutch item as a typed question',()=>{
 const state=freshState(content,now);
 Object.assign(state.progress.F1,ready,{practiceAttempts:11});
 state.daily.count=7;
 state.daily.listeningBeat=true;
 const spoken=prepareQuestion(state,content,now,true,true);
 assert.equal(spoken.kind,'speaking');
 assert.equal(spoken.direction,'en-nl');
 const typed=skipSpeaking(state);
 assert.equal(typed.id,spoken.id);
 assert.equal(typed.kind,'typed');
 assert.equal(typed.prompt,spoken.prompt);
 assert.equal(typed.answer,spoken.answer);
 assert.equal(state.daily.count,7);
 const rec=submit(state,content,typed.id,typed.answer,now);
 assert.equal(rec.kind,'typed');
 assert.equal(state.daily.count,8);
 assert.throws(()=>skipSpeaking(state),/not a spoken question/);
});

test('spoken answers score exact, near and missed speech without counting as independent writing',()=>{
 const item=content.sentences.find(s=>s.nl==='Wij schrijven.'&&s.pool==='practice');
 const q=makeExercise(item,'speaking',content);
 const exact=assess(q,'wij schrijven');
 assert.equal(exact.grammar,true);
 assert.equal(exact.spelling,true);
 assert.equal(exact.independent,false);
 const near=assess(q,'Wij schijven.');
 assert.equal(near.grammar,true);
 assert.equal(near.spelling,false);
 const miss=assess(q,'Wij lezen.');
 assert.equal(miss.grammar,false);
 assert.equal(miss.independent,false);
});

test('the isolated preview exposes skip-to-type and skip-speaking controls',()=>{
 const html=readFileSync(new URL('../preview/listen-speak.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../preview/listen-speak.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 assert.match(html,/Skip speaking and stay with listening/);
 assert.match(js,/Skip speaking — type instead/);
 assert.match(js,/typeInstead/);
 assert.match(app,/skipSpeaking/);
 assert.match(app,/Skip speaking — type instead/);
 assert.match(app,/canUseServerListen/);
 assert.match(app,/Include one listening question in today’s 20/);
});
