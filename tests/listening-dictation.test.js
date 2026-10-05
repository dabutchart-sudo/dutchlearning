import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {kinds} from '../src/engine/exercises.js';
import {freshState} from '../src/engine/learner.js';
import {formatAvailable} from '../src/engine/format-release.js';
import {normalize,tokens} from '../src/engine/util.js';
import {DICTATION_MAX_WORDS,DICTATION_RELEASE,DICTATION_SIZE,answerDictation,currentDictationQuestion,dictationMarking,dictationOffer,dictationPool,dictationSummary,startDictation} from '../src/engine/listening-dictation.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';

const foundation=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-10-05T12:00:00');

function ready(content=foundation,ids=['F1']){
 const state=freshState(content,now);
 for(const id of ids)Object.assign(state.progress[id],{taught:true,lessonAcknowledged:true,practiceAttempts:4});
 return state;
}

function fixture(){
 const row=(id,nl,en,subject,verb,pool='practice')=>({id,concept:'F1',pool,nl,en,subject,verb,verbIndex:1,forms:[],suitableKinds:['listening']});
 const content={
  concepts:[{id:'F1',title:'Subject and verb',level:'Foundation',prerequisites:[],minPractice:40,rule:'Subject then verb.',example:'Ik drink thee.',translation:'I drink tea.'}],
  sentences:[
   row('p1','Ik drink thee.','I drink tea.','Ik','drinken'),
   row('p2','Hij leest een boek.','He reads a book.','Hij','lezen'),
   row('p3','Wij werken.','We work.','Wij','werken'),
   row('long','De man drinkt elke ochtend in de keuken koffie.','The man drinks coffee in the kitchen every morning.','De man','drinken'),
   row('proof','Ik kook soep.','I cook soup.','Ik','koken','proof')
  ]
 };
 content.byId=Object.fromEntries(content.sentences.map(item=>[item.id,item]));
 content.conceptById=Object.fromEntries(content.concepts.map(item=>[item.id,item]));
 return content;
}

test('dictation stays out of the daily question kinds',()=>{
 assert.equal(kinds.includes('listen-dictation'),false);
 for(const file of ['../src/engine/scheduler.js','../src/engine/exercises.js','../src/engine/learner.js']){
  assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/listen-dictation|listening-dictation/);
 }
});

test('every taught topic can offer a short dictation round',()=>{
 const all=ready(foundation,foundation.concepts.map(concept=>concept.id));
 for(const concept of foundation.concepts){
  const offer=dictationOffer(all,foundation,concept.id);
  assert.ok(offer,concept.id);
  assert.equal(offer.count,DICTATION_SIZE,concept.id);
 }
 assert.equal(dictationOffer(freshState(foundation,now),foundation,'F2'),null);
 assert.equal(dictationOffer(ready(),foundation,'F2'),null);
});

test('only short, known practice sentences are dictated',()=>{
 const content=fixture(),state=ready(content),before=JSON.stringify(state);
 assert.deepEqual(dictationPool(state,content,'F1').map(item=>item.id).sort(),['p1','p2','p3']);
 const session=startDictation(state,content,{conceptId:'F1',seed:'round'});
 assert.equal(session.questions.length,3);
 assert.equal(session.format,'listen-dictation');
 const rendered=JSON.stringify(session.questions);
 assert.doesNotMatch(rendered,/kook|keuken/);
 for(const question of session.questions){
  assert.equal(question.audio,question.answer);
  assert.equal(question.wordCount,tokens(question.answer).length);
  assert.equal(question.meaningOptions.length,3);
  assert.ok(question.meaningOptions.includes(question.meaning));
 }
 const real=startDictation(ready(),foundation,{conceptId:'F1',seed:'real'});
 for(const question of real.questions){
  const item=foundation.byId[question.sourceId];
  assert.equal(item.pool,'practice');
  assert.equal(item.concept,'F1');
  assert.ok(tokens(item.nl).length<=DICTATION_MAX_WORDS);
 }
 assert.equal(JSON.stringify(state),before);
});

test('marking ignores capitals and punctuation and aligns words in order',()=>{
 const exact=dictationMarking('ik drink thee','Ik drink thee.');
 assert.deepEqual(exact.words.map(word=>word.status),['heard','heard','heard']);
 assert.deepEqual(exact.extra,[]);
 assert.deepEqual(dictationMarking('Ik thee.','Ik drink thee.').words.map(word=>word.status),['heard','missed','heard']);
 const extra=dictationMarking('ik drink de thee','Ik drink thee.');
 assert.deepEqual(extra.words.map(word=>word.status),['heard','heard','heard']);
 assert.deepEqual(extra.extra,['de']);
 const slip=dictationMarking('de vrouw leest een boeck','De vrouw leest een boek.');
 assert.equal(slip.words[4].status,'spelling');
 assert.equal(slip.words[4].typed,'boeck');
 assert.equal(dictationMarking('ik zie thee','Ik drink thee.').words[1].status,'missed');
 assert.deepEqual(dictationMarking('ik zie thee','Ik drink thee.').extra,['zie']);
});

test('a typed heard answer is listening plus writing, never speaking evidence',()=>{
 const content=fixture(),state=ready(content),before=JSON.stringify(state);
 let session=startDictation(state,content,{conceptId:'F1',size:3,seed:'typed'});
 const first=currentDictationQuestion(session);
 session=answerDictation(session,first.answer.toLocaleLowerCase('nl').replace('.',''));
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[0].capability,'listen');
 assert.equal(session.answers[0].writing,true);
 assert.equal(session.answers[0].speakingEvidence,false);
 assert.equal(session.answers[0].countsTowardProgress,false);
 const second=currentDictationQuestion(session);
 const words=tokens(second.answer);
 const lastWord=words.at(-1);
 const slipped=[...words.slice(0,-1),lastWord.length>=4?lastWord.slice(0,-1)+'x':'zzz'].join(' ');
 session=answerDictation(session,slipped);
 assert.equal(session.answers[1].correct,false);
 assert.equal(session.answers[1].near,lastWord.length>=4);
 session=answerDictation(session,'helemaal fout');
 assert.equal(session.answers[2].correct,false);
 assert.equal(session.answers[2].near,false);
 const summary=dictationSummary(session);
 assert.equal(summary.heard,3);
 assert.equal(summary.heardCorrect,1);
 assert.equal(summary.textFallbacks,0);
 assert.equal(summary.countsTowardProgress,false);
 assert.ok(summary.words>=summary.wordsHeard);
 assert.equal(JSON.stringify(state),before);
 assert.equal(state.daily.count,0);
 assert.equal(state.attempts.length,0);
});

test('audio failure becomes meaning recognition and keeps the round moving',()=>{
 const content=fixture();
 let session=startDictation(ready(content),content,{conceptId:'F1',size:2,seed:'fallback'});
 let question=currentDictationQuestion(session);
 session=answerDictation(session,question.meaning,{usedTextFallback:true,audioIssue:'unclear'});
 question=currentDictationQuestion(session);
 session=answerDictation(session,question.meaningOptions.find(option=>option!==question.meaning),{usedTextFallback:true,audioIssue:'unavailable'});
 assert.equal(session.answers[0].capability,'recognise');
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[0].writing,false);
 assert.equal(session.answers[1].correct,false);
 const summary=dictationSummary(session);
 assert.equal(summary.heard,0);
 assert.equal(summary.textFallbacks,2);
 assert.equal(summary.audioUnclear,1);
 assert.equal(summary.audioUnavailable,1);
 assert.equal(currentDictationQuestion(session),null);
});

test('Practice release cannot enter Trial or Core, and the kill switch hides the offer',()=>{
 assert.equal(formatAvailable('listening','practice',DICTATION_RELEASE),true);
 assert.equal(formatAvailable('listening','trial',DICTATION_RELEASE),false);
 assert.equal(formatAvailable('listening','core',DICTATION_RELEASE),false);
 const disabled={listening:{releaseLevel:'practice',enabled:false}};
 assert.equal(dictationOffer(ready(),foundation,'F1',disabled),null);
 assert.throws(()=>startDictation(ready(),foundation,{conceptId:'F1',release:disabled}),/unavailable/);
});

test('the round requires teaching, enough sentences, and an answer',()=>{
 const content=fixture();
 assert.throws(()=>startDictation(freshState(content,now),content,{conceptId:'F1'}),/first teaching step/);
 const short={...content,sentences:content.sentences.slice(0,2)};
 assert.throws(()=>startDictation(ready(content),short,{conceptId:'F1'}),/few more familiar sentences/);
 let session=startDictation(ready(content),content,{conceptId:'F1',size:1});
 assert.throws(()=>answerDictation(session,' '),/Type what you heard/);
 assert.throws(()=>answerDictation(session,'',{usedTextFallback:true}),/Choose an answer/);
 session=answerDictation(session,'ik drink thee');
 assert.throws(()=>answerDictation(session,'ik drink thee'),/already complete/);
});

test('the topic page offers dictation after the other listening rounds and not on Course home',()=>{
 const state=ready();
 const today='2026-10-05';
 const topic=topicPage(state,foundation,'F1',{today});
 assert.match(topic,/Type what you hear/);
 assert.match(topic,/id="start-listening-dictation"/);
 assert.ok(topic.indexOf('start-listening-missing-word')<topic.indexOf('start-listening-dictation'));
 assert.ok(topic.indexOf('start-listening-dictation')<topic.indexOf('start-speaking-practice'));
 assert.doesNotMatch(coursePage(state,foundation,{today}),/start-listening-dictation/);
 assert.doesNotMatch(topicPage(freshState(foundation,now),foundation,'F1',{today}),/start-listening-dictation/);
});

test('typing opens only once audio starts, and the screen states the evidence rules',()=>{
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 const slice=app.slice(app.indexOf('function beginDictation'),app.indexOf('function beginSpeakingPractice'));
 assert.match(slice,/Listen, then type the Dutch sentence you heard/);
 assert.match(slice,/id="dictation-answer"[^>]*disabled/);
 assert.match(slice,/autocorrect="off"/);
 assert.match(slice,/onStart:\(\)=>\{[^}]*enableTyping\(\)/);
 assert.match(slice,/Play the Dutch audio first/);
 assert.match(slice,/Audio unclear/);
 assert.match(slice,/Audio unavailable/);
 assert.match(slice,/counts only as recognition, not listening/);
 assert.match(slice,/Not speaking evidence/);
 assert.match(slice,/does not use today’s 20/);
 assert.match(slice,/No Course, mastery, or retention progress changed/);
 assert.match(slice,/prepareSpeech\(audioText\)/);
 assert.doesNotMatch(slice,/repo\.save|transaction\(|submit\(/);
 assert.match(app,/on\('start-listening-dictation'/);
 assert.match(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),/listening-dictation\.js/);
});

test('every playback path reports audio start, so waiting screens work on a development copy',()=>{
 const speech=readFileSync(new URL('../src/ui/speech.js',import.meta.url),'utf8');
 assert.match(speech,/if\(canUseLanListen\(\)\)return speakLan\(dutch,onError,events\)/);
 assert.match(speech,/return speakDevice\(dutch,onError,events\);\n\}/);
 const lan=speech.slice(speech.indexOf('function speakLan'),speech.indexOf('function rememberBlob'));
 assert.match(lan,/const gen=\+\+listenGen/);
 assert.match(lan,/if\(gen===listenGen\)events\.onStart\?\.\(\)/);
 assert.match(lan,/if\(gen===listenGen\)events\.onEnd\?\.\(\)/);
 assert.match(speech,/u\.onstart=\(\)=>events\.onStart\(\)/);
});
