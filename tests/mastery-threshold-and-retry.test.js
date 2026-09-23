import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {freshState,prepareQuestion,startProof,submit} from '../src/engine/learner.js';

const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);

function readyState(concept='A1.7',date='2026-09-23'){
 const now=new Date(`${date}T12:00:00Z`),state=freshState(content,now);
 for(const item of content.concepts){
  if(item.id===concept)break;
  Object.assign(state.progress[item.id],{status:'mastered',masteredAt:'2026-09-22',taught:true,lessonAcknowledged:true,nextMaintenance:'2099-01-01'});
 }
 Object.assign(state.progress[concept],{status:'proof-ready',practiceAttempts:40,recognised:10,constructed:10,independent:20,taught:true,lessonAcknowledged:true});
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
 assert.equal(state.progress['A1.7'].remedial,8);
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

test('a failed mastery has enough unseen proof for remediation, retry and retention',()=>{
 const {state,now}=readyState();
 startProof(state,content,'A1.7','mastery',now);
 answerProof(state,now,[0,1]);

 const remediationDay=new Date('2026-09-24T12:00:00Z');
 state.daily={date:'2026-09-24',count:0};
 for(let i=0;i<8;i++){
  const question=prepareQuestion(state,content,remediationDay,false);
  submit(state,content,question.id,question.answer,remediationDay);
 }
 assert.equal(state.progress['A1.7'].remedial,0);
 assert.equal(state.progress['A1.7'].status,'proof-ready');

 const retryDay=new Date('2026-09-25T12:00:00Z');
 state.daily={date:'2026-09-25',count:0};
 assert.doesNotThrow(()=>startProof(state,content,'A1.7','mastery',retryDay));
 answerProof(state,retryDay);

 const retentionDay=new Date('2026-09-28T12:00:00Z');
 state.daily={date:'2026-09-28',count:0};
 assert.doesNotThrow(()=>startProof(state,content,'A1.7','retention',retentionDay));
 answerProof(state,retentionDay);
 assert.equal(state.progress['A1.7'].status,'mastered');
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
