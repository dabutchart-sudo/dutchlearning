import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {seedCompletedPractice} from './helpers/practice-evidence.js';
import {dailyProofOffer,freshState,prepareQuestion,startProof,submit} from '../src/engine/learner.js';
import {masteryRecovery,recoveryTargets} from '../src/engine/mastery-recovery.js';
import {selectPractice} from '../src/engine/scheduler.js';

const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);

function readyState(concept='A1.7',date='2026-09-23'){
 const now=new Date(`${date}T12:00:00Z`),state=freshState(content,now);
 for(const item of content.concepts){
  if(item.id===concept)break;
  Object.assign(state.progress[item.id],{status:'mastered',masteredAt:'2026-09-22',taught:true,lessonAcknowledged:true,nextMaintenance:'2099-01-01'});
 }
 Object.assign(state.progress[concept],{status:'proof-ready',practiceAttempts:40,recognised:10,constructed:10,independent:20,taught:true,lessonAcknowledged:true});
 seedCompletedPractice(state,content,concept);
 return {state,now};
}

function answerProof(state,now,wrongIndexes=[]){
 let index=0;
 while(state.proof){
  const question=prepareQuestion(state,content,now,false);
  submit(state,content,question.id,wrongIndexes.includes(index)?'definitely wrong':question.answer,now);
  index++;
 }
}

test('mastery accepts 19 of 20 and schedules the missed item for targeted follow-up',()=>{
 const {state,now}=readyState();
 startProof(state,content,'A1.7','mastery',now);
 const missedSource=state.proof.questions[0].sourceId;
 answerProof(state,now,[0]);

 assert.equal(state.lastProof.correct,19);
 assert.equal(state.lastProof.required,19);
 assert.equal(state.lastProof.passed,true);
 assert.deepEqual(state.lastProof.directions,{'nl-en':{correct:9,total:10},'en-nl':{correct:10,total:10}});
 assert.equal(state.progress['A1.7'].status,'retention-wait');
 assert.ok(state.retries.some(retry=>retry.sourceId===missedSource&&retry.reason==='mastery-follow-up'));
});

test('mastery also accepts a single English to Dutch miss',()=>{
 const {state,now}=readyState();
 startProof(state,content,'A1.7','mastery',now);
 answerProof(state,now,[1]);

 assert.equal(state.lastProof.passed,true);
 assert.deepEqual(state.lastProof.directions,{'nl-en':{correct:10,total:10},'en-nl':{correct:9,total:10}});
});

test('mastery still fails at 18 of 20',()=>{
 const {state,now}=readyState();
 startProof(state,content,'A1.7','mastery',now);
 answerProof(state,now,[0,1]);

 assert.equal(state.lastProof.correct,18);
 assert.equal(state.lastProof.passed,false);
 assert.equal(state.progress['A1.7'].status,'learning');
 assert.equal(state.progress['A1.7'].remedial,0);
});

test('retention remains strict at 10 of 10',()=>{
 const {state,now}=readyState();
 Object.assign(state.progress['A1.7'],{status:'retention-wait',retentionDue:'2026-09-23'});
 startProof(state,content,'A1.7','retention',now);
 answerProof(state,now,[0]);

 assert.equal(state.lastProof.correct,9);
 assert.equal(state.lastProof.required,10);
 assert.equal(state.lastProof.passed,false);
 assert.equal(state.progress['A1.7'].status,'learning');
});

test('a failed mastery has enough unseen proof for a next-day retry and retention',()=>{
 const {state,now}=readyState();
 startProof(state,content,'A1.7','mastery',now);
 answerProof(state,now,[0,1]);

 const retryDay=new Date('2026-09-24T12:00:00Z');
 state.daily={date:'2026-09-24',count:0};
 assert.doesNotThrow(()=>startProof(state,content,'A1.7','mastery',retryDay));
 answerProof(state,retryDay);

 const retentionDay=new Date('2026-09-27T12:00:00Z');
 state.daily={date:'2026-09-27',count:0};
 assert.doesNotThrow(()=>startProof(state,content,'A1.7','retention',retentionDay));
 answerProof(state,retentionDay);
 assert.equal(state.progress['A1.7'].status,'mastered');
});

test('failed meaning proof shows full-sentence patterns and routes into finite practice',()=>{
 const {state,now}=readyState();
 startProof(state,content,'A1.7','mastery',now);
 answerProof(state,now,[0,2]);
 const recovery=masteryRecovery(state,content);
 assert.equal(recovery.failures,1);
 assert.equal(recovery.misses,2);
 assert.equal(recovery.groups.length,1);
 assert.equal(recovery.groups[0].direction,'nl-en');
 assert.equal(recovery.groups[0].count,2);
 assert.ok(recovery.groups[0].sentence);
 assert.ok(recovery.groups[0].meaning);
 assert.ok(recovery.groups[0].tip);
 const queued=state.retries.filter(retry=>retry.reason==='mastery-recovery');
 assert.equal(queued.length,1);
 assert.equal(queued[0].direction,'nl-en');
 assert.equal(state.daily.count,20,'feedback must not add daily questions');
 const nextDay=new Date('2026-09-24T12:00:00Z');
 state.daily={date:'2026-09-24',count:0};
 assert.equal(dailyProofOffer(state,content,nextDay).canStartToday,true);
 const selected=selectPractice(state,content,'A1.7','2026-09-24',false);
 assert.equal(selected.kind,'choice');
 assert.equal(selected.item.concept,'A1.7');
 assert.equal(selected.retryId,queued[0].id);
 assert.equal(state.daily.count,0,'selecting a practice target does not consume a question');
});

test('repeated production failure offers guided practice, then full retake and strict retention',()=>{
 const {state,now}=readyState();
 startProof(state,content,'A1.7','mastery',now);
 answerProof(state,now,[1,3]);
 assert.equal(masteryRecovery(state,content).groups[0].direction,'en-nl');
 const secondDay=new Date('2026-09-24T12:00:00Z');
 state.daily={date:'2026-09-24',count:0};
 startProof(state,content,'A1.7','mastery',secondDay);
 answerProof(state,secondDay,[1,3]);
 assert.equal(masteryRecovery(state,content).failures,2);
 assert.equal(state.retries.filter(retry=>retry.reason==='mastery-recovery').length,1,'old recovery targets are replaced');
 const thirdDay=new Date('2026-09-25T12:00:00Z');
 state.daily={date:'2026-09-25',count:0};
 assert.equal(dailyProofOffer(state,content,thirdDay).canStartToday,true);
 const guided=prepareQuestion(state,content,thirdDay,false);
 assert.equal(guided.kind,'wordbank');
 assert.equal(guided.phase,'practice');
 submit(state,content,guided.id,guided.answer,thirdDay);
 assert.equal(state.daily.count,1);
 assert.match(dailyProofOffer(state,content,thirdDay).reason,/next study day/);
 const fourthDay=new Date('2026-09-26T12:00:00Z');
 state.daily={date:'2026-09-26',count:0};
 startProof(state,content,'A1.7','mastery',fourthDay);
 answerProof(state,fourthDay);
 assert.equal(state.lastProof.passed,true);
 assert.equal(state.retries.some(retry=>retry.reason==='mastery-recovery'),false);
 const retentionDay=new Date('2026-09-29T12:00:00Z');
 state.daily={date:'2026-09-29',count:0};
 startProof(state,content,'A1.7','retention',retentionDay);
 answerProof(state,retentionDay);
 assert.equal(state.lastProof.correct,10);
 assert.equal(state.progress['A1.7'].status,'mastered');
});

test('recovery stays finite and older proof history never invents sentence feedback',()=>{
 const misses=['translation','word_order','verb_form','article','negation'].map((errorType,index)=>({direction:index%2?'en-nl':'nl-en',errorType}));
 assert.equal(recoveryTargets(misses).length,3);
 const {state}=readyState();
 const report={id:'old-proof',type:'mastery',concept:'A1.7',studyDate:'2026-09-23',completedAt:'2026-09-23T12:00:00Z',passed:false};
 state.progress['A1.7'].proofHistory=[report];state.lastProof=report;
 assert.deepEqual(masteryRecovery(state,content),{failures:1,misses:0,groups:[]});
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(worker,/\.\/src\/engine\/mastery-recovery\.js/);
});

test('A1.7 through A1.12 each retain at least 52 unique proof sentences',()=>{
 for(const id of ['A1.7','A1.8','A1.9','A1.10','A1.11','A1.12']){
  const proof=content.sentences.filter(sentence=>sentence.concept===id&&sentence.pool==='proof');
  assert.ok(proof.length>=52,`${id} has ${proof.length} proof sentences`);
  assert.equal(new Set(proof.map(sentence=>sentence.nl)).size,proof.length,`${id} proof sentences should be unique`);
 }
});

test('the mastery retry buffer remains in the offline build',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(sw,/a1-proof-retry-buffer\.js/);
});
