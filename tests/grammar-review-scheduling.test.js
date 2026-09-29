import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,prepareQuestion,submit} from '../src/engine/learner.js';
import {grammarReviewBudget,selectPractice} from '../src/engine/scheduler.js';
import {validateState} from '../src/engine/persistence.js';
import {applyLearningSync} from '../src/engine/learning-sync.js';

function fixture(count=1,date='2026-10-01'){
 const concepts=Array.from({length:count},(_,i)=>({id:`T${i}`,prerequisites:[],minPractice:40}));
 const sentences=concepts.flatMap((c,i)=>[0,1,2].map((n)=>({id:`${c.id}-${n}`,concept:c.id,pool:'practice',nl:`Ik ben ${['hier','thuis','klaar'][n]}.`,en:`I am ${['here','at home','ready'][n]}.`,verb:'zijn',verbIndex:1,forms:['ben','bent','is'],subject:'Ik',family:`${c.id}:zijn`,vocabulary:[]})));
 const content={concepts,sentences,byId:Object.fromEntries(sentences.map(x=>[x.id,x])),conceptById:Object.fromEntries(concepts.map(x=>[x.id,x]))};
 const now=new Date(`${date}T12:00:00Z`),state=freshState(content,now);
 for(const c of concepts)Object.assign(state.progress[c.id],{status:'mastered',masteredAt:'2026-09-20',taught:true,lessonAcknowledged:true,recognised:5,constructed:5,nextMaintenance:date});
 return {content,state,now};
}

test('review intervals expand after independent typed successes, without premature repeats',()=>{
 const {content,state}=fixture();
 for(const [date,next,step] of [['2026-10-01','2026-10-08',1],['2026-10-08','2026-10-22',2],['2026-10-22','2026-11-21',3],['2026-11-21','2026-12-21',3]]){
  const now=new Date(`${date}T12:00:00Z`);
  const q=prepareQuestion(state,content,now);
  assert.equal(q.phase,'maintenance');assert.equal(q.kind,'typed');
  submit(state,content,q.id,q.answer,now);
  assert.equal(state.progress.T0.nextMaintenance,next);
  assert.equal(state.progress.T0.reviewStep,step);
  assert.equal(selectPractice(state,content,'T0',date,false).phase,'practice');
 }
});

test('a grammar miss retains proof and moves independent review to the next day',()=>{
 const {content,state,now}=fixture();
 const q=prepareQuestion(state,content,now);
 submit(state,content,q.id,'wrong answer',now);
 assert.equal(state.progress.T0.status,'reinforcement');
 assert.equal(state.progress.T0.masteredAt,'2026-09-20');
 assert.equal(state.progress.T0.nextMaintenance,'2026-10-02');
 assert.equal(state.progress.T0.reviewStep,0);
 assert.equal(selectPractice(state,content,'T0','2026-10-01',false).phase,'practice');
 assert.equal(selectPractice(state,content,'T0','2026-10-02',false).phase,'maintenance');
});

test('daily budget grows to six, orders overdue topics, and respects recorded reviews',()=>{
 const {content,state,now}=fixture(24);
 assert.equal(grammarReviewBudget(state,content,'2026-10-01'),6);
 state.progress.T0.nextMaintenance='2026-09-29';
 state.progress.T1.nextMaintenance='2026-09-28';
 assert.equal(selectPractice(state,content,'T23','2026-10-01',false).item.concept,'T1');
 for(let i=0;i<6;i++){
  const q=prepareQuestion(state,content,now);
  assert.equal(q.phase,'maintenance');
  submit(state,content,q.id,q.answer,now);
 }
 assert.equal(state.attempts.filter(a=>a.phase==='maintenance').length,6);
 assert.equal(selectPractice(state,content,'T23','2026-10-01',false).phase,'practice');
 assert.equal(new Set(state.attempts.filter(a=>a.phase==='maintenance').map(a=>a.concept)).size,6);
});

test('older V5 progress keeps its due date and begins conservatively',()=>{
 const {content,state,now}=fixture();
 delete state.progress.T0.reviewStep;
 validateState(state,content);
 assert.equal(state.progress.T0.nextMaintenance,'2026-10-01');
 const q=prepareQuestion(state,content,now);
 submit(state,content,q.id,q.answer,now);
 assert.equal(state.progress.T0.nextMaintenance,'2026-10-08');
});

test('a same-day support question uses a review slot without advancing the interval',()=>{
 const {content,state,now}=fixture(4);
 for(const c of content.concepts.slice(1))state.progress[c.id].nextMaintenance='2026-12-01';
 const first=prepareQuestion(state,content,now);
 submit(state,content,first.id,'wrong answer',now);
 for(let i=0;i<2;i++){
  const q=prepareQuestion(state,content,now);
  assert.equal(q.phase,'practice');submit(state,content,q.id,q.answer,now);
 }
 const support=prepareQuestion(state,content,now);
 assert.equal(support.phase,'maintenance');
 assert.equal(support.kind,'wordbank');
 assert.equal(support.reviewFollowUp,true);
 submit(state,content,support.id,support.answer,now);
 assert.equal(state.progress.T0.nextMaintenance,'2026-10-02');
 assert.equal(state.progress.T0.status,'reinforcement');
 assert.equal(grammarReviewBudget(state,content,'2026-10-01'),2);
 assert.equal(selectPractice(state,content,'T3','2026-10-01',false).phase,'practice');
});

test('ready proofs reserve their full share before review slots',()=>{
 const {content,state}=fixture(12);
 state.progress.T11.masteredAt=null;
 state.progress.T11.status='proof-ready';
 assert.equal(grammarReviewBudget(state,content,'2026-10-01'),0);
 state.progress.T11.status='retention-wait';
 state.progress.T11.retentionDue='2026-10-01';
 assert.equal(grammarReviewBudget(state,content,'2026-10-01'),3);
 state.attempts.push(...Array.from({length:10},(_,i)=>({id:`proof-${i}`,date:'2026-10-01',phase:'retention'})));
 assert.equal(grammarReviewBudget(state,content,'2026-10-01'),3);
});

test('skipped study days keep a review overdue instead of creating extra work',()=>{
 const {content,state}=fixture(8);
 state.progress.T0.nextMaintenance='2026-09-25';
 for(const c of content.concepts.slice(1))state.progress[c.id].nextMaintenance='2026-12-01';
 const now=new Date('2026-10-10T12:00:00Z');
 const q=prepareQuestion(state,content,now);
 assert.equal(q.phase,'maintenance');
 assert.equal(q.concept,'T0');
 assert.equal(state.daily.count,0);
 submit(state,content,q.id,q.answer,now);
 assert.equal(state.progress.T0.nextMaintenance,'2026-10-17');
 assert.ok(state.daily.count<=20);
});

test('a newer remote V5 state preserves review stage, due date, and pending question',()=>{
 const {content,state,now}=fixture();
 const q=prepareQuestion(state,content,now);
 state.progress.T0.reviewStep=2;
 state.progress.T0.nextMaintenance='2026-10-10';
 state.revision=12;
 const local=freshState(content,now);
 local.progress.T0.masteredAt='2026-09-20';
 local.revision=10;
 const result=applyLearningSync({user:{id:'learner'},local,remote:{state:structuredClone(state)},content});
 assert.equal(result.action,'download');
 assert.equal(result.writeRemote,false);
 assert.equal(result.state.progress.T0.reviewStep,2);
 assert.equal(result.state.progress.T0.nextMaintenance,'2026-10-10');
 assert.equal(result.state.pending.id,q.id);
});
