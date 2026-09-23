import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {freshState} from '../src/engine/learner.js';
import {LISTENING_PRACTICE_RELEASE,answerListeningPractice,currentListeningQuestion,listeningPracticeItems,listeningPracticeSummary,startListeningPractice} from '../src/engine/listening-practice.js';
import {formatAvailable} from '../src/engine/format-release.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-09-23T12:00:00');

function ready(){const state=freshState(content,now);Object.assign(state.progress.F1,{taught:true,lessonAcknowledged:true,practiceAttempts:4});return state;}

test('optional listening uses only taught practice content and never mutates learner state',()=>{
 const state=ready(),before=JSON.stringify(state),items=listeningPracticeItems(state,content);
 assert.ok(items.length>=5);assert.ok(items.every(item=>item.concept==='F1'&&item.pool==='practice'));
 const session=startListeningPractice(state,content,{seed:'test'});
 assert.equal(session.questions.length,5);assert.ok(session.questions.every(q=>q.kind==='listening'&&q.phase==='listening-practice'&&q.prompt==='Listen, then choose the meaning.'));
 assert.ok(session.questions.every(q=>q.audio===content.byId[q.sourceId].nl&&q.answer===content.byId[q.sourceId].en&&q.options.includes(q.answer)));
 assert.equal(JSON.stringify(state),before);
});

test('Practice release is available only in isolated Experimental and Practice contexts',()=>{
 assert.equal(formatAvailable('listening','experimental',LISTENING_PRACTICE_RELEASE),true);
 assert.equal(formatAvailable('listening','practice',LISTENING_PRACTICE_RELEASE),true);
 assert.equal(formatAvailable('listening','trial',LISTENING_PRACTICE_RELEASE),false);
 assert.equal(formatAvailable('listening','core',LISTENING_PRACTICE_RELEASE),false);
});

test('heard answers create session-only listening diagnostics',()=>{
 const state=ready(),before=JSON.stringify(state);let session=startListeningPractice(state,content,{size:1,seed:'heard'});
 const question=currentListeningQuestion(session);session=answerListeningPractice(session,question.answer);
 assert.deepEqual(session.answers[0],{questionId:question.id,sourceId:question.sourceId,concept:'F1',correct:true,capability:'listen',support:'independent',releaseLevel:'practice',usedTextFallback:false,countsTowardProgress:false});
 assert.deepEqual(listeningPracticeSummary(session),{total:1,heard:1,heardCorrect:1,textFallbacks:0,countsTowardProgress:false});
 assert.equal(JSON.stringify(state),before);
});

test('revealing text changes evidence to recognition and never claims listening proof',()=>{
 let session=startListeningPractice(ready(),content,{size:1,seed:'fallback'});const question=currentListeningQuestion(session);
 session=answerListeningPractice(session,question.answer,{usedTextFallback:true});
 assert.equal(session.answers[0].capability,'recognise');assert.equal(session.answers[0].usedTextFallback,true);
 assert.deepEqual(listeningPracticeSummary(session),{total:1,heard:0,heardCorrect:0,textFallbacks:1,countsTowardProgress:false});
});

test('practice requires teaching, a selected answer and an unfinished question',()=>{
 assert.throws(()=>startListeningPractice(freshState(content,now),content),/first teaching step/);
 let session=startListeningPractice(ready(),content,{size:1});assert.throws(()=>answerListeningPractice(session,''),/Choose an answer/);
 session=answerListeningPractice(session,currentListeningQuestion(session).answer);assert.throws(()=>answerListeningPractice(session,'anything'),/already complete/);
});

test('the learner-facing route states its isolation and safe fallback',()=>{
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 assert.match(app,/Optional listening practice/i);assert.match(app,/does not use today’s 20/);
 assert.match(app,/Audio unavailable\? Show the Dutch text/);assert.match(app,/No Course, mastery, or retention progress changed/);
 assert.match(app,/speak\(audioText,audioError/);assert.doesNotMatch(app,/practice-play',\(\)=>speak\(item\.nl/);
 assert.match(app,/Loading Dutch audio/);assert.match(app,/prepareSpeech\(audioText\)/);assert.match(app,/prepareSpeech\(upcoming\.audio\)/);
});
