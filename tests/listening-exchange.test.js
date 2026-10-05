import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {LISTENING_EXCHANGES} from '../src/content/listening-exchanges.js';
import {kinds} from '../src/engine/exercises.js';
import {freshState} from '../src/engine/learner.js';
import {formatAvailable} from '../src/engine/format-release.js';
import {normalize,tokens} from '../src/engine/util.js';
import {EXCHANGE_RELEASE,EXCHANGE_SIZE,answerExchange,currentExchangeQuestion,exchangeOffer,exchangePool,exchangeSummary,startExchangePractice} from '../src/engine/listening-exchange.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';

const foundation=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-10-05T12:00:00');
const TOPICS=['A1.2','A1.8','A1.14','A1.23','A1.24','S1','S2','S3'];

function ready(ids=['A1.8']){
 const state=freshState(foundation,now);
 for(const id of ids)Object.assign(state.progress[id],{taught:true,lessonAcknowledged:true,practiceAttempts:4});
 return state;
}

test('exchange listening stays out of the daily question kinds',()=>{
 assert.equal(kinds.includes('listen-exchange'),false);
 for(const file of ['../src/engine/scheduler.js','../src/engine/exercises.js','../src/engine/learner.js','../src/content/registry.js']){
  assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/listen-exchange|listening-exchange/);
 }
});

test('every exchange uses only words its topic or an earlier topic already practises',()=>{
 const order=foundation.concepts.map(concept=>concept.id);
 for(const exchange of LISTENING_EXCHANGES){
  const upto=order.indexOf(exchange.concept);
  assert.ok(upto>=0,exchange.id);
  const known=new Set(foundation.sentences.filter(item=>item.pool==='practice'&&order.indexOf(item.concept)<=upto).flatMap(item=>tokens(item.nl)));
  for(const turn of exchange.turns)for(const word of tokens(turn.nl))assert.ok(known.has(word),`${exchange.id}: ${word}`);
 }
});

test('no exchange line is an unseen test sentence, and every clip is short',()=>{
 const proof=new Set(foundation.sentences.filter(item=>item.pool!=='practice').map(item=>normalize(item.nl)));
 for(const exchange of LISTENING_EXCHANGES){
  for(const turn of exchange.turns)assert.equal(proof.has(normalize(turn.nl)),false,`${exchange.id}: ${turn.nl}`);
  assert.ok(exchange.turns.map(turn=>turn.nl).join(' ').length<=110,exchange.id);
 }
});

test('each exchange has two turns, a question first, and two distinct wrong meanings that change one turn each',()=>{
 const ids=new Set();
 for(const exchange of LISTENING_EXCHANGES){
  assert.equal(ids.has(exchange.id),false,exchange.id);ids.add(exchange.id);
  assert.equal(exchange.turns.length,2);
  assert.match(exchange.turns[0].nl,/\?$/,exchange.id);
  assert.doesNotMatch(exchange.turns[1].nl,/\?$/,exchange.id);
  const [first,second]=exchange.turns.map(turn=>turn.en);
  assert.equal(exchange.meaning,`${first} — ${second}`);
  const [wrongFirst,wrongSecond]=exchange.wrongMeanings;
  assert.ok(wrongFirst.endsWith(` — ${second}`)&&!wrongFirst.startsWith(`${first} —`),exchange.id);
  assert.ok(wrongSecond.startsWith(`${first} — `)&&!wrongSecond.endsWith(` — ${second}`),exchange.id);
 }
 assert.deepEqual([...new Set(LISTENING_EXCHANGES.map(exchange=>exchange.concept))],TOPICS);
 for(const topic of TOPICS)assert.ok(LISTENING_EXCHANGES.filter(exchange=>exchange.concept===topic).length>=4,topic);
});

test('only taught topics with exchanges offer the round',()=>{
 const all=ready(foundation.concepts.map(concept=>concept.id));
 for(const concept of foundation.concepts){
  const offer=exchangeOffer(all,concept.id);
  assert.equal(Boolean(offer),TOPICS.includes(concept.id),concept.id);
 }
 assert.equal(exchangeOffer(freshState(foundation,now),'A1.8'),null);
 assert.equal(exchangeOffer(ready(['F2']),'F2'),null);
 assert.equal(exchangeOffer(ready(),'A1.8').count,EXCHANGE_SIZE);
});

test('a round plays both turns as one clip and offers the three meanings',()=>{
 const state=ready(),before=JSON.stringify(state);
 const session=startExchangePractice(state,{conceptId:'A1.8',seed:'round'});
 assert.equal(session.questions.length,5);
 assert.equal(session.format,'listen-exchange');
 for(const question of session.questions){
  assert.equal(question.audio,question.turns.map(turn=>turn.nl).join(' '));
  assert.equal(question.options.length,3);
  assert.ok(question.options.includes(question.meaning));
  assert.ok(exchangePool(state,'A1.8').some(exchange=>exchange.id===question.sourceId));
 }
 assert.equal(JSON.stringify(state),before);
});

test('a heard answer is listening only, never conversation or speaking evidence',()=>{
 const state=ready(),before=JSON.stringify(state);
 let session=startExchangePractice(state,{conceptId:'A1.8',size:2,seed:'heard'});
 const first=currentExchangeQuestion(session);
 session=answerExchange(session,first.meaning);
 const second=currentExchangeQuestion(session);
 session=answerExchange(session,second.options.find(option=>option!==second.meaning));
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[1].correct,false);
 for(const answer of session.answers){
  assert.equal(answer.capability,'listen');
  assert.equal(answer.interactionEvidence,false);
  assert.equal(answer.speakingEvidence,false);
  assert.equal(answer.countsTowardProgress,false);
 }
 assert.deepEqual(exchangeSummary(session),{total:2,heard:2,heardCorrect:1,textFallbacks:0,audioUnclear:0,audioUnavailable:0,audioIssues:[],countsTowardProgress:false});
 assert.equal(JSON.stringify(state),before);
 assert.equal(state.daily.count,0);
 assert.equal(state.attempts.length,0);
});

test('audio failure shows the turns, records recognition and keeps the round moving',()=>{
 let session=startExchangePractice(ready(),{conceptId:'A1.8',size:2,seed:'fallback'});
 let question=currentExchangeQuestion(session);
 session=answerExchange(session,question.meaning,{usedTextFallback:true,audioIssue:'unclear'});
 question=currentExchangeQuestion(session);
 session=answerExchange(session,question.options.find(option=>option!==question.meaning),{usedTextFallback:true,audioIssue:'unavailable'});
 assert.equal(session.answers[0].capability,'recognise');
 assert.equal(session.answers[0].correct,true);
 assert.equal(session.answers[1].correct,false);
 const summary=exchangeSummary(session);
 assert.equal(summary.heard,0);
 assert.equal(summary.textFallbacks,2);
 assert.equal(summary.audioUnclear,1);
 assert.equal(summary.audioUnavailable,1);
 assert.equal(currentExchangeQuestion(session),null);
});

test('Practice release cannot enter Trial or Core, and the kill switch hides the offer',()=>{
 assert.equal(formatAvailable('listening','practice',EXCHANGE_RELEASE),true);
 assert.equal(formatAvailable('listening','trial',EXCHANGE_RELEASE),false);
 assert.equal(formatAvailable('listening','core',EXCHANGE_RELEASE),false);
 const disabled={listening:{releaseLevel:'practice',enabled:false}};
 assert.equal(exchangeOffer(ready(),'A1.8',disabled),null);
 assert.throws(()=>startExchangePractice(ready(),{conceptId:'A1.8',release:disabled}),/unavailable/);
});

test('the round requires teaching, exchanges, and a chosen answer',()=>{
 assert.throws(()=>startExchangePractice(freshState(foundation,now),{conceptId:'A1.8'}),/first teaching step/);
 assert.throws(()=>startExchangePractice(ready(['F2']),{conceptId:'F2'}),/no short exchanges/);
 let session=startExchangePractice(ready(),{conceptId:'A1.8',size:1});
 assert.throws(()=>answerExchange(session,' '),/Choose an answer/);
 session=answerExchange(session,currentExchangeQuestion(session).meaning);
 assert.throws(()=>answerExchange(session,'x'),/already complete/);
});

test('the topic page offers the exchange after dictation and not on Course home',()=>{
 // A small course where A1.2 is the first topic, so it is reachable.
 const row=(id,nl,en,subject,verb)=>({id,concept:'A1.2',pool:'practice',nl,en,subject,verb,verbIndex:0,forms:[],suitableKinds:['listening','speaking','typed']});
 const content={concepts:[{id:'A1.2',title:'Yes/no questions',level:'A1',prerequisites:[],minPractice:40,rule:'Put the verb first.',example:'Lees jij een boek?',translation:'Are you reading a book?'}],
  sentences:[row('q1','Lees jij een boek?','Are you reading a book?','jij','lezen'),row('q2','Drinkt zij thee?','Does she drink tea?','zij','drinken'),row('q3','Koop jij een fiets?','Are you buying a bike?','jij','kopen'),row('q4','Ziet hij de hond?','Does he see the dog?','hij','zien')]};
 content.byId=Object.fromEntries(content.sentences.map(item=>[item.id,item]));
 content.conceptById=Object.fromEntries(content.concepts.map(item=>[item.id,item]));
 const state=freshState(content,now);Object.assign(state.progress['A1.2'],{taught:true,lessonAcknowledged:true,practiceAttempts:4});
 const today='2026-10-05';
 const topic=topicPage(state,content,'A1.2',{today});
 assert.match(topic,/Follow a short exchange/);
 assert.match(topic,/id="start-listening-exchange"/);
 assert.ok(topic.indexOf('start-listening-dictation')<topic.indexOf('start-listening-exchange'));
 assert.ok(topic.indexOf('start-listening-exchange')<topic.indexOf('start-speaking-practice'));
 assert.doesNotMatch(coursePage(state,content,{today}),/start-listening-exchange/);
 assert.doesNotMatch(topicPage(freshState(content,now),content,'A1.2',{today}),/start-listening-exchange/);
 assert.doesNotMatch(topicPage(ready(['F1']),foundation,'F1',{today}),/start-listening-exchange/);
});

test('the choices appear only once audio starts, and the screen states the evidence rules',()=>{
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 const slice=app.slice(app.indexOf('function beginExchange'),app.indexOf('function beginSpeakingPractice'));
 assert.match(slice,/Listen to the short exchange, then choose what was said/);
 assert.match(slice,/<div id="answer-area"><\/div>/);
 assert.match(slice,/onStart:\(\)=>\{[^}]*if\(!usedTextFallback\)revealChoices\(\)/);
 assert.match(slice,/Audio unclear/);
 assert.match(slice,/Audio unavailable/);
 assert.match(slice,/counts only as recognition, not listening/);
 assert.match(slice,/Not conversation evidence/);
 assert.match(slice,/not speaking or conversation evidence/);
 assert.match(slice,/does not use today’s 20/);
 assert.match(slice,/No Course, mastery, or retention progress changed/);
 assert.match(slice,/prepareSpeech\(audioText\)/);
 assert.doesNotMatch(slice,/repo\.save|transaction\(|submit\(/);
 assert.match(app,/on\('start-listening-exchange'/);
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(worker,/listening-exchange\.js/);
 assert.match(worker,/content\/listening-exchanges\.js/);
});
