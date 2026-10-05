import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {freshState} from '../src/engine/learner.js';
import {formatAvailable} from '../src/engine/format-release.js';
import {SPEAKING_PRACTICE_RELEASE,answerSpeakingPractice,currentSpeakingQuestion,speakingPracticeFeedback,speakingPracticeMayRetry,speakingPracticeOffer,speakingPracticeSummary,speakingPracticeSummaryCopy,startSpeakingPractice} from '../src/engine/speaking-practice.js';
import {transcribeSpokenAnswer} from '../src/engine/speaking-transcription.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-10-05T12:00:00');
const today='2026-10-05';

function ready(){
 const state=freshState(content,now);
 Object.assign(state.progress.F1,{taught:true,lessonAcknowledged:true,practiceAttempts:4});
 return state;
}

test('optional speaking uses taught practice sentences and does not change learner state',()=>{
 const state=ready(),before=JSON.stringify(state);
 const offer=speakingPracticeOffer(state,content,'F1');
 assert.equal(offer.count,5);
 const session=startSpeakingPractice(state,content,{conceptId:'F1',seed:'test'});
 assert.equal(session.releaseLevel,'practice');
 assert.equal(session.questions.length,5);
 assert.ok(session.questions.every(question=>{
  const item=content.byId[question.sourceId];
  return question.kind==='speaking'&&question.phase==='speaking-practice'&&question.direction==='en-nl'&&question.prompt===item.en&&question.answer===item.nl&&item.pool==='practice'&&item.concept==='F1';
 }));
 assert.equal(JSON.stringify(state),before);
 assert.equal(state.daily.count,0);
 assert.equal(state.attempts.length,0);
});

test('Practice release stays out of Trial and Core',()=>{
 assert.equal(formatAvailable('speaking','experimental',SPEAKING_PRACTICE_RELEASE),true);
 assert.equal(formatAvailable('speaking','practice',SPEAKING_PRACTICE_RELEASE),true);
 assert.equal(formatAvailable('speaking','trial',SPEAKING_PRACTICE_RELEASE),false);
 assert.equal(formatAvailable('speaking','core',SPEAKING_PRACTICE_RELEASE),false);
 assert.equal(formatAvailable('speaking','core'),true);
});

test('a spoken match is speaking evidence and a typed match is not',()=>{
 const state=ready(),before=JSON.stringify(state);
 let session=startSpeakingPractice(state,content,{conceptId:'F1',size:2,seed:'evidence'});
 const first=currentSpeakingQuestion(session);
 session=answerSpeakingPractice(session,first.answer.toLowerCase());
 assert.equal(session.answers[0].capability,'speak');
 assert.equal(session.answers[0].speakingEvidence,true);
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[0].typedFallback,false);
 assert.equal(session.answers[0].countsTowardProgress,false);
 assert.equal(speakingPracticeMayRetry(session.answers[0]),false);
 const second=currentSpeakingQuestion(session);
 session=answerSpeakingPractice(session,second.answer,{typedFallback:true});
 assert.equal(session.answers[1].capability,'produce');
 assert.equal(session.answers[1].speakingEvidence,false);
 assert.equal(session.answers[1].correct,true);
 assert.deepEqual(speakingPracticeSummary(session),{total:2,spoken:1,spokenCorrect:1,spokenNear:0,typed:1,typedCorrect:1,speechUnavailable:0,speechUnclear:0,retried:0,countsTowardProgress:false});
 assert.equal(JSON.stringify(state),before);
});

test('a close spoken miss can be retried once and a second miss stays a miss',()=>{
 let session=startSpeakingPractice(ready(),content,{conceptId:'F1',size:1,seed:'retry'});
 const question=currentSpeakingQuestion(session);
 const near=question.answer.replace(/\.$/,'')+'x';
 const first=answerSpeakingPractice(session,near);
 const feedback=speakingPracticeFeedback(first.answers[0],question,near);
 assert.equal(first.answers[0].correct,false);
 assert.equal(first.answers[0].near,true);
 assert.equal(first.answers[0].speakingEvidence,true);
 assert.equal(feedback.headline,'Very close');
 assert.equal(feedback.retry,true);
 assert.equal(feedback.note,'This checks whether the words match. It is not a pronunciation score.');
 const settled=answerSpeakingPractice(session,'not the sentence',{retried:true});
 assert.equal(settled.answers[0].retried,true);
 assert.equal(speakingPracticeMayRetry(settled.answers[0]),false);
 assert.equal(speakingPracticeFeedback(settled.answers[0],question,'not the sentence').retry,false);
 assert.equal(speakingPracticeSummary(settled).retried,1);
});

test('speech failure converts to typing and records no speaking evidence',()=>{
 let session=startSpeakingPractice(ready(),content,{conceptId:'F1',size:2,seed:'fallback'});
 const first=currentSpeakingQuestion(session);
 assert.throws(()=>answerSpeakingPractice(session,'',{speechIssue:'unavailable'}),/Type the Dutch sentence/);
 session=answerSpeakingPractice(session,first.answer,{typedFallback:true,speechIssue:'unavailable'});
 const second=currentSpeakingQuestion(session);
 session=answerSpeakingPractice(session,'not dutch',{typedFallback:true,speechIssue:'unclear'});
 assert.equal(session.answers[0].capability,'produce');
 assert.equal(session.answers[0].speakingEvidence,false);
 assert.equal(session.answers[0].speechIssue,'unavailable');
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[1].speechIssue,'unclear');
 assert.equal(session.answers[1].correct,false);
 const feedback=speakingPracticeFeedback(session.answers[0],first,first.answer);
 assert.equal(feedback.headline,'The words match');
 assert.equal(feedback.badge,'Writing only');
 assert.equal(feedback.heard,'');
 assert.match(feedback.note,/writing practice, not speaking evidence/);
 const copy=speakingPracticeSummaryCopy(speakingPracticeSummary(session));
 assert.equal(copy.heading,'No answers were spoken');
 assert.match(copy.typed,/2 sentences were typed/);
 assert.match(copy.speech,/1 could not be transcribed/);
 assert.match(copy.speech,/1 was unclear/);
 assert.match(copy.note,/No Course, mastery, or retention progress changed/);
 assert.equal(second.phase,'speaking-practice');
});

test('practice requires teaching, a finished recording, and an unfinished question',()=>{
 assert.equal(speakingPracticeOffer(freshState(content,now),content,'F1'),null);
 assert.throws(()=>startSpeakingPractice(freshState(content,now),content,{conceptId:'F1'}),/first teaching step/);
 assert.throws(()=>startSpeakingPractice(ready(),content,{conceptId:'F1',release:{speaking:{releaseLevel:'practice',enabled:false}}}),/unavailable/);
 let session=startSpeakingPractice(ready(),content,{conceptId:'F1',size:1});
 assert.throws(()=>answerSpeakingPractice(session,' '),/Record an answer/);
 session=answerSpeakingPractice(session,currentSpeakingQuestion(session).answer);
 assert.throws(()=>answerSpeakingPractice(session,'Ik schrijf.'),/already complete/);
});

test('transcription uses the existing preview route and fails closed without a key',async()=>{
 const blob=new Blob(['speech'],{type:'audio/webm'});
 const requests=[];
 const fetchImpl=async(path,options)=>{
  requests.push({path,method:options.method,headers:options.headers,audio:options.body.get('audio')});
  return {ok:true,json:async()=>({text:' Ik schrijf. '})};
 };
 const heard=await transcribeSpokenAnswer(blob,{fetchImpl});
 assert.equal(heard.ok,true);
 assert.equal(heard.text,'Ik schrijf.');
 assert.equal(requests[0].path,'/preview/stt');
 assert.equal(requests[0].method,'POST');
 assert.equal(requests[0].headers,undefined);
 assert.ok(requests[0].audio);
 assert.deepEqual(await transcribeSpokenAnswer(new Blob(),{fetchImpl}),{ok:false,speechIssue:'unavailable',text:''});
 assert.deepEqual(await transcribeSpokenAnswer(blob,{fetchImpl:async()=>{throw Error('offline');}}),{ok:false,speechIssue:'unavailable',text:''});
 assert.deepEqual(await transcribeSpokenAnswer(blob,{fetchImpl:async()=>({ok:false,json:async()=>({error:'missing'})})}),{ok:false,speechIssue:'unavailable',text:''});
 assert.deepEqual(await transcribeSpokenAnswer(blob,{fetchImpl:async()=>({ok:true,json:async()=>({text:'  '})})}),{ok:false,speechIssue:'unclear',text:''});
 const source=readFileSync(new URL('../src/engine/speaking-transcription.js',import.meta.url),'utf8');
 assert.match(source,/\/preview\/stt/);
 assert.doesNotMatch(source,/api\.openai\.com|OPENAI_API_KEY|sk-/);
});

test('the topic page offers speaking practice without putting it on Course home or in the daily 20',()=>{
 const state=ready();
 const topic=topicPage(state,content,'F1',{today});
 assert.match(topic,/Say the Dutch/);
 assert.match(topic,/does not use today’s 20/);
 assert.match(topic,/id="start-speaking-practice"/);
 assert.ok(topic.indexOf('start-listening-discrimination')<topic.indexOf('start-speaking-practice'));
 assert.doesNotMatch(coursePage(state,content,{today}),/start-speaking-practice/);
 assert.doesNotMatch(topicPage(freshState(content,now),content,'F1',{today}),/start-speaking-practice/);
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 const slice=app.slice(app.indexOf('function beginSpeakingPractice'),app.indexOf('async function openExtraQuestion'));
 assert.match(slice,/Optional Practice/);
 assert.match(slice,/does not use today’s 20/);
 assert.match(slice,/Say the Dutch sentence/);
 assert.match(slice,/Type instead/);
 assert.match(slice,/Speech unavailable/);
 assert.match(slice,/Try speaking again/);
 assert.match(slice,/Check answer/);
 assert.match(slice,/Leave practice — no Course progress to save/);
 assert.match(slice,/not a pronunciation score/);
 assert.match(slice,/Typing is not speaking evidence/);
 assert.match(slice,/feedback\.note/);
 assert.match(slice,/copy\.typed/);
 assert.match(slice,/Does not change progress/);
 assert.match(slice,/transcribeSpokenAnswer\(/);
 assert.match(slice,/<h2 class="prompt">\$\{esc\(prompt\)\}<\/h2>/);
 assert.doesNotMatch(slice,/question\.answer|submit\(|transaction\(|skipSpeaking\(/);
 assert.match(app,/skipSpeaking\(s\)/);
 assert.match(app,/SpeechRecognition/);
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(worker,/dutch-v5\.1\.176-20261005-dictation/);
 assert.match(worker,/speaking-practice\.js/);
 assert.match(worker,/speaking-transcription\.js/);
 assert.match(worker,/listen-speak-preview\.js/);
 const styles=readFileSync(new URL('../src/ui/v51.css',import.meta.url),'utf8');
 assert.match(styles,/\.speaking-practice-card\{overflow:auto\}/);
 assert.match(styles,/\.speaking-practice-card \.actions\{position:sticky/);
});
