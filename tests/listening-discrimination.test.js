import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {kinds} from '../src/engine/exercises.js';
import {freshState} from '../src/engine/learner.js';
import {formatAvailable} from '../src/engine/format-release.js';
import {normalize} from '../src/engine/util.js';
import {DISCRIMINATION_SIZE,SENTENCE_DISCRIMINATION_RELEASE,answerSentenceDiscrimination,currentDiscriminationQuestion,discriminationPool,discriminationSummary,sentenceDiscriminationOffer,startSentenceDiscrimination} from '../src/engine/listening-discrimination.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';

const foundation=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-10-03T12:00:00');

function ready(content=foundation){
 const state=freshState(content,now);
 Object.assign(state.progress.F1,{taught:true,lessonAcknowledged:true,practiceAttempts:4});
 return state;
}

function fixture(){
 const content={
  concepts:[{id:'F1',title:'Subject and verb',level:'Foundation',prerequisites:[],minPractice:40,rule:'Subject then verb.',example:'Ik schrijf.',translation:'I write.'}],
  sentences:[
   {id:'p1',concept:'F1',pool:'practice',nl:'Ik schrijf.',en:'I write.',subject:'ik',verb:'schrijven',suitableKinds:['listening']},
   {id:'p2',concept:'F1',pool:'practice',nl:'Ik lees.',en:'I read.',subject:'ik',verb:'lezen',suitableKinds:['listening']},
   {id:'p3',concept:'F1',pool:'practice',nl:'Zij werkt.',en:'She works.',subject:'zij',verb:'werken',suitableKinds:['listening']},
   {id:'proof',concept:'F1',pool:'proof',nl:'Ik schrijf nu.',en:'I write now.',subject:'ik',verb:'schrijven',suitableKinds:['listening']}
  ]
 };
 content.byId=Object.fromEntries(content.sentences.map(item=>[item.id,item]));
 content.conceptById=Object.fromEntries(content.concepts.map(item=>[item.id,item]));
 return content;
}

test('sentence discrimination stays out of the daily question kinds',()=>{
 assert.equal(kinds.includes('listen-discriminate'),false);
 const scheduler=readFileSync(new URL('../src/engine/scheduler.js',import.meta.url),'utf8');
 const exercises=readFileSync(new URL('../src/engine/exercises.js',import.meta.url),'utf8');
 assert.doesNotMatch(scheduler,/listen-discriminate/);
 assert.doesNotMatch(exercises,/listen-discriminate/);
});

test('a taught topic can offer a short optional discrimination round',()=>{
 const state=ready();
 const offer=sentenceDiscriminationOffer(state,foundation,'F1');
 assert.equal(offer.count,DISCRIMINATION_SIZE);
 assert.ok(offer.available>=DISCRIMINATION_SIZE);
 assert.equal(sentenceDiscriminationOffer(freshState(foundation,now),foundation,'F1'),null);
 assert.equal(sentenceDiscriminationOffer(state,foundation,'F2'),null);
});

test('questions use only taught practice sentences and prefer a near distractor',()=>{
 const state=ready(),before=JSON.stringify(state);
 const session=startSentenceDiscrimination(state,foundation,{conceptId:'F1',seed:'round'});
 assert.equal(session.questions.length,5);
 assert.equal(session.format,'listen-discriminate');
 assert.ok(session.questions.every(question=>question.kind==='listen-discriminate'&&question.phase==='listening-discrimination'&&question.prompt==='Listen, then choose the Dutch sentence you heard.'));
 const pool=discriminationPool(state,foundation,'F1');
 for(const question of session.questions){
  const item=foundation.byId[question.sourceId];
  assert.equal(item.pool,'practice');
  assert.equal(item.concept,'F1');
  assert.equal(question.audio,item.nl);
  assert.equal(question.answer,item.nl);
  assert.deepEqual([...question.options].sort(),[...new Set(question.options)].sort());
  assert.equal(question.options.length,3);
  assert.ok(question.options.includes(item.nl));
  assert.ok(question.meaningOptions.includes(item.en));
  assert.equal(question.meaningOptions.length,3);
  assert.ok(question.meaningOptions.every(meaning=>pool.some(candidate=>normalize(candidate.en)===normalize(meaning))));
  const nearExists=pool.some(candidate=>normalize(candidate.nl)!==normalize(item.nl)&&(candidate.subject===item.subject||candidate.verb===item.verb));
  if(nearExists){
   assert.ok(question.options.some(option=>{
    if(normalize(option)===normalize(item.nl))return false;
    const other=pool.find(candidate=>normalize(candidate.nl)===normalize(option));
    return other&&(other.subject===item.subject||other.verb===item.verb);
   }));
  }
 }
 assert.equal(JSON.stringify(state),before);
});

test('proof sentences are never heard or offered as distractors',()=>{
 const content=fixture(),state=ready(content);
 const session=startSentenceDiscrimination(state,content,{conceptId:'F1',size:3,seed:'proof-safe'});
 const rendered=JSON.stringify(session.questions);
 assert.doesNotMatch(rendered,/Ik schrijf nu/);
 assert.equal(session.questions.find(question=>question.sourceId==='p1').options.includes('Ik lees.'),true);
});

test('Practice release cannot enter Trial or Core, and the kill switch hides the offer',()=>{
 assert.equal(formatAvailable('listening','experimental',SENTENCE_DISCRIMINATION_RELEASE),true);
 assert.equal(formatAvailable('listening','practice',SENTENCE_DISCRIMINATION_RELEASE),true);
 assert.equal(formatAvailable('listening','trial',SENTENCE_DISCRIMINATION_RELEASE),false);
 assert.equal(formatAvailable('listening','core',SENTENCE_DISCRIMINATION_RELEASE),false);
 const disabled={listening:{releaseLevel:'practice',enabled:false}};
 assert.equal(sentenceDiscriminationOffer(ready(),foundation,'F1',disabled),null);
 assert.throws(()=>startSentenceDiscrimination(ready(),foundation,{conceptId:'F1',release:disabled}),/unavailable/);
});

test('a heard answer is listening diagnostic and does not change learner state',()=>{
 const content=fixture(),state=ready(content),before=JSON.stringify(state);
 let session=startSentenceDiscrimination(state,content,{conceptId:'F1',size:1,seed:'heard'});
 const question=currentDiscriminationQuestion(session);
 session=answerSentenceDiscrimination(session,question.answer.toLocaleLowerCase('nl'));
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[0].capability,'listen');
 assert.equal(session.answers[0].countsTowardProgress,false);
 session=startSentenceDiscrimination(state,content,{conceptId:'F1',size:1,seed:'heard-miss'});
 const missed=currentDiscriminationQuestion(session);
 session=answerSentenceDiscrimination(session,missed.options.find(option=>normalize(option)!==normalize(missed.answer)));
 assert.equal(session.answers[0].correct,false);
 assert.equal(session.answers[0].capability,'listen');
 assert.deepEqual(discriminationSummary(session),{total:1,heard:1,heardCorrect:0,textFallbacks:0,audioUnclear:0,audioUnavailable:0,audioIssues:[],countsTowardProgress:false});
 assert.equal(JSON.stringify(state),before);
 assert.equal(state.daily.count,0);
 assert.equal(state.attempts.length,0);
});

test('audio failure becomes recognition and keeps the round moving',()=>{
 const content=fixture();
 let session=startSentenceDiscrimination(ready(content),content,{conceptId:'F1',size:2,seed:'fallback'});
 let question=currentDiscriminationQuestion(session);
 session=answerSentenceDiscrimination(session,question.meaning,{usedTextFallback:true,audioIssue:'unclear'});
 question=currentDiscriminationQuestion(session);
 session=answerSentenceDiscrimination(session,'not the meaning',{usedTextFallback:true,audioIssue:'unavailable'});
 assert.equal(session.answers[0].capability,'recognise');
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[1].capability,'recognise');
 assert.equal(session.answers[1].correct,false);
 const summary=discriminationSummary(session);
 assert.equal(summary.heard,0);
 assert.equal(summary.textFallbacks,2);
 assert.equal(summary.audioUnclear,1);
 assert.equal(summary.audioUnavailable,1);
 assert.equal(summary.countsTowardProgress,false);
});

test('the round requires teaching, enough sentences, and a selected answer',()=>{
 const content=fixture();
 assert.throws(()=>startSentenceDiscrimination(freshState(content,now),content,{conceptId:'F1'}),/first teaching step/);
 const short={...content,sentences:content.sentences.slice(0,2)};
 assert.throws(()=>startSentenceDiscrimination(ready(content),short,{conceptId:'F1'}),/few more familiar sentences/);
 let session=startSentenceDiscrimination(ready(content),content,{conceptId:'F1',size:1});
 assert.throws(()=>answerSentenceDiscrimination(session,' '),/Choose an answer/);
 session=answerSentenceDiscrimination(session,currentDiscriminationQuestion(session).answer);
 assert.throws(()=>answerSentenceDiscrimination(session,'Ik lees.'));
});

test('the topic page offers the activity without placing it on Course home',()=>{
 const content=fixture();
 const state=ready(content);
 const today='2026-10-03';
 const topic=topicPage(state,content,'F1',{today});
 assert.match(topic,/Which sentence did you hear/);
 assert.match(topic,/does not use today’s 20/);
 assert.match(topic,/id="start-listening-discrimination"/);
 assert.ok(topic.indexOf('What you’ll learn')<topic.indexOf('start-listening-discrimination'));
 assert.doesNotMatch(coursePage(state,content,{today}),/start-listening-discrimination/);
 assert.doesNotMatch(topicPage(freshState(content,now),content,'F1',{today}),/start-listening-discrimination/);
});

test('the learner-facing round explains listening evidence, fallback, and no saved progress',()=>{
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 assert.match(app,/Listen, then choose the Dutch sentence you heard/);
 assert.match(app,/Audio unclear/);
 assert.match(app,/Audio unavailable/);
 assert.match(app,/counts only as recognition, not listening/);
 assert.match(app,/Check answer/);
 assert.match(app,/Does not change progress/);
 assert.match(app,/No Course, mastery, or retention progress changed/);
 assert.match(app,/answerSentenceDiscrimination\(/);
 assert.match(app,/prepareSpeech\(audioText\)/);
 assert.match(app,/listening-practice-card/);
});
