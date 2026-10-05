import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {kinds} from '../src/engine/exercises.js';
import {freshState} from '../src/engine/learner.js';
import {formatAvailable} from '../src/engine/format-release.js';
import {displayTokens,normalize} from '../src/engine/util.js';
import {MISSING_WORD_GAP,MISSING_WORD_RELEASE,MISSING_WORD_SIZE,agreementKey,answerMissingWord,currentMissingWordQuestion,missingWordOffer,missingWordPool,missingWordSummary,startMissingWord} from '../src/engine/listening-missing-word.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';

const foundation=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-10-05T12:00:00');

function ready(content=foundation,ids=['F1']){
 const state=freshState(content,now);
 for(const id of ids)Object.assign(state.progress[id],{taught:true,lessonAcknowledged:true,practiceAttempts:4});
 return state;
}

function row(id,nl,en,subject,verb,verbIndex,forms,pool='practice'){
 return {id,concept:'F1',pool,nl,en,subject,verb,verbIndex,forms,suitableKinds:['listening']};
}

function fixture(){
 const content={
  concepts:[{id:'F1',title:'Subject and verb',level:'Foundation',prerequisites:[],minPractice:40,rule:'Subject then verb.',example:'Ik werk.',translation:'I work.'}],
  sentences:[
   row('p1','Ik werk thuis.','I work at home.','Ik','werken',1,['werk','werkt','werken']),
   row('p2','Ik lees thuis.','I read at home.','Ik','lezen',1,['lees','leest','lezen']),
   row('p3','Ik slaap thuis.','I sleep at home.','Ik','slapen',1,['slaap','slaapt','slapen']),
   row('p4','Hij werkt thuis.','He works at home.','Hij','werken',1,['werk','werkt','werken']),
   row('p5','Wij lezen thuis.','We read at home.','Wij','lezen',1,['lees','leest','lezen']),
   row('p6','Ik word moe.','I get tired.','Ik','worden',1,['word','wordt','worden']),
   row('proof','Ik kook thuis.','I cook at home.','Ik','koken',1,['kook','kookt','koken'],'proof')
  ]
 };
 content.byId=Object.fromEntries(content.sentences.map(item=>[item.id,item]));
 content.conceptById=Object.fromEntries(content.concepts.map(item=>[item.id,item]));
 return content;
}

test('missing-word listening stays out of the daily question kinds',()=>{
 assert.equal(kinds.includes('listen-missing-word'),false);
 for(const file of ['../src/engine/scheduler.js','../src/engine/exercises.js','../src/engine/learner.js']){
  assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/listen-missing-word|listening-missing-word/);
 }
});

test('a taught topic can offer a short optional missing-word round',()=>{
 const state=ready();
 const offer=missingWordOffer(state,foundation,'F1');
 assert.equal(offer.count,MISSING_WORD_SIZE);
 assert.ok(offer.available>=MISSING_WORD_SIZE);
 assert.equal(missingWordOffer(freshState(foundation,now),foundation,'F1'),null);
 assert.equal(missingWordOffer(state,foundation,'F2'),null);
});

test('the gap is the taught finite verb and the other words stay in place',()=>{
 const state=ready(),before=JSON.stringify(state);
 const session=startMissingWord(state,foundation,{conceptId:'F1',seed:'round'});
 assert.equal(session.questions.length,5);
 assert.equal(session.format,'listen-missing-word');
 for(const question of session.questions){
  const item=foundation.byId[question.sourceId];
  assert.equal(item.pool,'practice');
  assert.equal(item.concept,'F1');
  assert.equal(question.kind,'listen-missing-word');
  assert.equal(question.prompt,'Listen, then choose the missing word.');
  assert.equal(question.audio,item.nl);
  const words=displayTokens(question.sentence);
  assert.equal(normalize(question.answer),normalize(words[item.verbIndex]));
  const gapped=displayTokens(question.frame);
  assert.equal(gapped[item.verbIndex],MISSING_WORD_GAP);
  assert.deepEqual(gapped.filter((_,index)=>index!==item.verbIndex).map(normalize),words.filter((_,index)=>index!==item.verbIndex).map(normalize));
  assert.equal(question.options.length,3);
  assert.equal(new Set(question.options.map(normalize)).size,3);
  assert.ok(question.options.includes(question.answer));
 }
 assert.equal(JSON.stringify(state),before);
});

test('every distractor agrees with the subject, so grammar alone cannot give the answer',()=>{
 const state=ready(foundation,foundation.concepts.map(concept=>concept.id));
 let checked=0;
 for(const concept of foundation.concepts){
  if(!missingWordOffer(state,foundation,concept.id))continue;
  const pool=missingWordPool(state,foundation,concept.id);
  const session=startMissingWord(state,foundation,{conceptId:concept.id,seed:'agreement'});
  for(const question of session.questions){
   const item=foundation.byId[question.sourceId];
   const key=agreementKey(item);
   for(const option of question.options.filter(option=>option!==question.answer)){
    const source=pool.filter(candidate=>normalize(displayTokens(candidate.nl)[candidate.verbIndex])===normalize(option));
    assert.ok(source.some(candidate=>agreementKey(candidate)===key),`${item.nl}: ${option}`);
    assert.equal((item.forms||[]).map(normalize).includes(normalize(option)),false,`${item.nl}: ${option} is a form of the heard verb`);
    checked++;
   }
  }
 }
 assert.ok(checked>=100);
});

test('agreement keys separate person and number',()=>{
 const c=fixture();
 assert.equal(agreementKey(c.byId.p1),'stem');
 assert.equal(agreementKey(c.byId.p4),'third');
 assert.equal(agreementKey(c.byId.p5),'plural');
 assert.equal(agreementKey({nl:'Werk jij thuis?',subject:'jij',verbIndex:0,forms:['werk','werkt','werken']}),'stem');
 assert.equal(agreementKey({nl:'Jij werkt thuis.',subject:'Jij',verbIndex:1,forms:['werk','werkt','werken']}),'jij');
 assert.equal(agreementKey({nl:'De kinderen spelen buiten.',subject:'De kinderen',verbIndex:2,forms:['speel','speelt','spelen']}),'plural');
 assert.equal(agreementKey({nl:'De man speelt buiten.',subject:'De man',verbIndex:2,forms:['speel','speelt','spelen']}),'third');
});

test('forms of the heard verb and proof sentences are never options',()=>{
 const content=fixture(),state=ready(content);
 const session=startMissingWord(state,content,{conceptId:'F1',size:5,seed:'safe'});
 const rendered=JSON.stringify(session.questions);
 assert.doesNotMatch(rendered,/kook/);
 const word=session.questions.find(question=>question.sourceId==='p6');
 if(word)assert.equal(word.options.some(option=>normalize(option)==='wordt'),false);
 const work=session.questions.find(question=>question.sourceId==='p1');
 assert.ok(work);
 assert.ok(work.options.includes('werk'));
 assert.ok(work.options.every(option=>['werk','lees','slaap','word'].includes(option)));
 assert.equal(session.questions.some(question=>question.sourceId==='p4'||question.sourceId==='p5'),false);
});

test('Practice release cannot enter Trial or Core, and the kill switch hides the offer',()=>{
 assert.equal(formatAvailable('listening','practice',MISSING_WORD_RELEASE),true);
 assert.equal(formatAvailable('listening','trial',MISSING_WORD_RELEASE),false);
 assert.equal(formatAvailable('listening','core',MISSING_WORD_RELEASE),false);
 const disabled={listening:{releaseLevel:'practice',enabled:false}};
 assert.equal(missingWordOffer(ready(),foundation,'F1',disabled),null);
 assert.throws(()=>startMissingWord(ready(),foundation,{conceptId:'F1',release:disabled}),/unavailable/);
});

test('a heard answer is a listening diagnostic and does not change learner state',()=>{
 const content=fixture(),state=ready(content),before=JSON.stringify(state);
 let session=startMissingWord(state,content,{conceptId:'F1',size:1,seed:'heard'});
 const question=currentMissingWordQuestion(session);
 session=answerMissingWord(session,question.answer.toLocaleUpperCase('nl'));
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[0].capability,'listen');
 assert.equal(session.answers[0].countsTowardProgress,false);
 session=startMissingWord(state,content,{conceptId:'F1',size:1,seed:'heard'});
 session=answerMissingWord(session,question.options.find(option=>option!==question.answer));
 assert.equal(session.answers[0].correct,false);
 assert.equal(session.answers[0].capability,'listen');
 assert.deepEqual(missingWordSummary(session),{total:1,heard:1,heardCorrect:0,textFallbacks:0,audioUnclear:0,audioUnavailable:0,audioIssues:[],countsTowardProgress:false});
 assert.equal(JSON.stringify(state),before);
 assert.equal(state.daily.count,0);
 assert.equal(state.attempts.length,0);
});

test('audio failure becomes recognition and keeps the round moving',()=>{
 const content=fixture();
 let session=startMissingWord(ready(content),content,{conceptId:'F1',size:2,seed:'fallback'});
 let question=currentMissingWordQuestion(session);
 session=answerMissingWord(session,question.answer,{usedTextFallback:true,audioIssue:'unclear'});
 question=currentMissingWordQuestion(session);
 session=answerMissingWord(session,question.options.find(option=>option!==question.answer),{usedTextFallback:true,audioIssue:'unavailable'});
 assert.equal(session.answers[0].capability,'recognise');
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[1].capability,'recognise');
 assert.equal(session.answers[1].correct,false);
 const summary=missingWordSummary(session);
 assert.equal(summary.heard,0);
 assert.equal(summary.textFallbacks,2);
 assert.equal(summary.audioUnclear,1);
 assert.equal(summary.audioUnavailable,1);
 assert.equal(summary.audioIssues.length,2);
 assert.equal(summary.countsTowardProgress,false);
 assert.equal(currentMissingWordQuestion(session),null);
});

test('the round requires teaching, enough agreeing words, and a selected answer',()=>{
 const content=fixture();
 assert.throws(()=>startMissingWord(freshState(content,now),content,{conceptId:'F1'}),/first teaching step/);
 const short={...content,sentences:content.sentences.slice(0,2)};
 assert.throws(()=>startMissingWord(ready(content),short,{conceptId:'F1'}),/few more familiar sentences/);
 let session=startMissingWord(ready(content),content,{conceptId:'F1',size:1});
 assert.throws(()=>answerMissingWord(session,' '),/Choose an answer/);
 session=answerMissingWord(session,currentMissingWordQuestion(session).answer);
 assert.throws(()=>answerMissingWord(session,'werk'),/already complete/);
});

test('the topic page offers the activity after sentence discrimination and not on Course home',()=>{
 const state=ready();
 const today='2026-10-05';
 const topic=topicPage(state,foundation,'F1',{today});
 assert.match(topic,/Which word did you hear/);
 assert.match(topic,/id="start-listening-missing-word"/);
 assert.ok(topic.indexOf('start-listening-discrimination')<topic.indexOf('start-listening-missing-word'));
 assert.ok(topic.indexOf('start-listening-missing-word')<topic.indexOf('start-speaking-practice'));
 assert.doesNotMatch(coursePage(state,foundation,{today}),/start-listening-missing-word/);
 assert.doesNotMatch(topicPage(freshState(foundation,now),foundation,'F1',{today}),/start-listening-missing-word/);
});

test('the round keeps the sentence hidden until audio starts and explains the fallback',()=>{
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 const slice=app.slice(app.indexOf('function beginMissingWord'),app.indexOf('function beginSpeakingPractice'));
 assert.match(slice,/Listen, then choose the missing word/);
 assert.match(slice,/appears when the audio starts/);
 assert.match(slice,/onStart:\(\)=>\{[^}]*if\(!usedTextFallback\)revealFrame\(\)/);
 assert.match(slice,/<div id="answer-area"><\/div>/);
 assert.match(slice,/Audio unclear/);
 assert.match(slice,/Audio unavailable/);
 assert.match(slice,/counts only as recognition, not listening/);
 assert.match(slice,/Check answer/);
 assert.match(slice,/does not use today’s 20/);
 assert.match(slice,/No Course, mastery, or retention progress changed/);
 assert.match(slice,/prepareSpeech\(audioText\)/);
 assert.match(slice,/answerMissingWord\(/);
 assert.doesNotMatch(slice,/repo\.save|transaction\(|submit\(/);
 assert.match(app,/on\('start-listening-missing-word'/);
 assert.match(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),/listening-missing-word\.js/);
});
