import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {freshState} from '../src/engine/learner.js';
import {answerSentenceDiscrimination,currentDiscriminationQuestion,discriminationSummary,startSentenceDiscrimination} from '../src/engine/listening-discrimination.js';
import {answerMissingWord,currentMissingWordQuestion,missingWordSummary,startMissingWord} from '../src/engine/listening-missing-word.js';
import {answerDictation,currentDictationQuestion,dictationSummary,startDictation} from '../src/engine/listening-dictation.js';

const foundation=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const speech=readFileSync(new URL('../src/ui/speech.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');

function ready(){
 const state=freshState(foundation,new Date('2026-10-05T12:00:00'));
 Object.assign(state.progress.F1,{taught:true,lessonAcknowledged:true,practiceAttempts:4});
 return state;
}

test('a slower replay is supported listening, counted in each summary, and ignored after a text fallback',()=>{
 const rounds=[
  [startSentenceDiscrimination,currentDiscriminationQuestion,answerSentenceDiscrimination,discriminationSummary,question=>question.answer,question=>question.meaning],
  [startMissingWord,currentMissingWordQuestion,answerMissingWord,missingWordSummary,question=>question.answer,question=>question.answer],
  [(state,content,options)=>startDictation(state,content,options),currentDictationQuestion,answerDictation,dictationSummary,question=>question.answer,question=>question.meaning]
 ];
 for(const [start,current,answer,summary,heardAnswer,fallbackAnswer] of rounds){
  let session=start(ready(),foundation,{conceptId:'F1',size:3,seed:'speed'});
  session=answer(session,heardAnswer(current(session)),{slowed:true});
  session=answer(session,heardAnswer(current(session)));
  session=answer(session,fallbackAnswer(current(session)),{usedTextFallback:true,audioIssue:'unclear',slowed:true});
  const [slow,normal,fallback]=session.answers;
  assert.equal(slow.capability,'listen');
  assert.equal(slow.support,'supported');
  assert.equal(slow.slowed,true);
  assert.equal(slow.correct,true);
  assert.equal(normal.support,'independent');
  assert.equal(normal.slowed,false);
  assert.equal(fallback.capability,'recognise');
  assert.equal(fallback.slowed,false);
  assert.equal(fallback.support,'independent');
  assert.equal(summary(session).slowed,1);
  for(const result of session.answers){
   assert.equal(result.countsTowardProgress,false);
   assert.notEqual(result.capability,'speak');
   assert.notEqual(result.capability,'interact');
  }
 }
});

test('playback speed is normal unless the slower replay is asked for, and audio elements keep pitch',()=>{
 assert.match(speech,/export const SLOWER_RATE=\.8;/);
 assert.match(speech,/requestedRate=events\.rate===SLOWER_RATE\?SLOWER_RATE:1;/);
 assert.match(speech,/audio\.defaultPlaybackRate=requestedRate;audio\.playbackRate=requestedRate;/);
 assert.match(speech,/audio\.preservesPitch=true;audio\.webkitPreservesPitch=true;/);
 assert.equal((speech.match(/applyRate\(audio\);/g)||[]).length,2);
 assert.match(speech,/if\(decoded&&requestedRate===1&&startDecodedBuffer\(decoded,gen,hooks\)\)return true;/);
 assert.match(speech,/u\.rate=\.85\*requestedRate;/);
});

test('only the phone-accepted Practice rounds offer a slower replay',()=>{
 const slice=(from,to)=>app.slice(app.indexOf(from),app.indexOf(to));
 for(const [prefix,from,to] of [['discrimination','function renderDiscrimination(','function beginMissingWord('],['missing-word','function renderMissingWord(','function beginDictation('],['dictation','function renderDictation(','function beginExchange(']]){
  const body=slice(from,to);
  assert.match(body,new RegExp(`id="${prefix}-play-slower"[^>]*>Play slower<`),prefix);
  assert.match(body,new RegExp(`on\\('${prefix}-play-slower',\\(\\)=>playAt\\(SLOWER_RATE\\)\\)`),prefix);
  assert.match(body,/speak\(audioText,audioError,\{rate,onStart:\(\)=>\{if\(rate!==1&&!usedTextFallback&&!locked\)slowed=true;/,prefix);
  assert.match(body,/\{usedTextFallback,audioIssue,slowed\}\)/,prefix);
  assert.match(body,/Heard slower/,prefix);
  assert.match(body,/That counts as supported listening/,prefix);
  assert.match(body,new RegExp(`on\\('replay-${prefix}-slower',\\(\\)=>speak\\(audioText,notify,\\{rate:SLOWER_RATE\\}\\)\\)`),prefix);
 }
 // Not yet accepted, or not Practice: no slower option.
 assert.doesNotMatch(slice('function renderExchange(','function beginSpeakingPractice('),/SLOWER_RATE|Play slower/);
 const outsidePractice=app.slice(0,app.indexOf('function renderDiscrimination('))+app.slice(app.indexOf('function beginSpeakingPractice('));
 assert.doesNotMatch(outsidePractice.replace(/import \{[^}]*\} from '\.\/speech\.js';/,''),/SLOWER_RATE|Play slower/);
});

test('the daily session and its listening question are unchanged',()=>{
 for(const file of ['../src/engine/scheduler.js','../src/engine/exercises.js','../src/engine/learner.js']){
  assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/slowed|SLOWER_RATE|playbackRate/);
 }
});
