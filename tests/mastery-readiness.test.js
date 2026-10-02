import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {firstMasteryReadiness,firstMasteryReadinessNeed} from '../src/engine/mastery-readiness.js';
import {dailyProofOffer,freshState,prepareQuestion,proofEligibility,startProof,submit,teachConcept} from '../src/engine/learner.js';
import {courseOutline} from '../src/engine/course-progress.js';
import {coursePage} from '../src/ui/course-overview.js';
import {mapTrainerAttempt} from '../src/engine/learning-sync.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-10-02T12:00:00Z');
function readyState(){
 const state=freshState(content,now);
 Object.assign(state.progress.F1,{status:'proof-ready',taught:true,lessonAcknowledged:true,practiceAttempts:40});
 return state;
}
function typed(index,{date=index<5?'2026-10-01':'2026-10-02',grammar=true,assisted=false,spelling=true}={}){
 return {id:`typed-${index}`,concept:'F1',phase:'practice',kind:'typed',direction:'en-nl',assisted,grammar,spelling,date,
  occurredAt:`${date}T12:${String(index).padStart(2,'0')}:00Z`};
}

test('first mastery needs ten recent unaided typed answers, 80% grammar, and two study days',()=>{
 const state=readyState();
 state.attempts=Array.from({length:10},(_,index)=>typed(index,{grammar:index<8}));
 assert.equal(firstMasteryReadiness(state,'F1',now).ready,true);
 assert.equal(dailyProofOffer(state,content,now).canStartToday,true);
 assert.equal(proofEligibility(state,content,'F1','mastery',now),null);
 assert.equal(courseOutline(state,content,{today:'2026-10-02'}).current.label,'Test ready');
 assert.match(coursePage(state,content,{today:'2026-10-02',offer:dailyProofOffer(state,content,now)}),/Choose test or practice/);
});

test('forty ordinary F1 practice answers can build readiness without extra questions',()=>{
 const firstDay=new Date('2026-09-28T12:00:00Z'),state=freshState(content,firstDay);
 teachConcept(state,'F1',content);
 for(const day of [firstDay,new Date('2026-09-29T12:00:00Z')]){
  for(let index=0;index<20;index++){
   const question=prepareQuestion(state,content,day,false,false);
   assert.ok(question?.id);
   submit(state,content,question.id,question.answer,day);
  }
 }
 const nextDay=new Date('2026-09-30T12:00:00Z');
 assert.equal(state.progress.F1.practiceAttempts,40);
 assert.equal(firstMasteryReadiness(state,'F1',nextDay).ready,true);
 assert.equal(dailyProofOffer(state,content,nextDay).canStartToday,true);
});

test('weak writing cannot open mastery even after forty practice answers',()=>{
 const state=readyState();state.attempts=Array.from({length:10},(_,index)=>typed(index,{grammar:index<7}));
 assert.match(firstMasteryReadinessNeed(state,'F1',now),/7 of 10/);
 assert.equal(dailyProofOffer(state,content,now).canStartToday,false);
 assert.match(proofEligibility(state,content,'F1','mastery',now),/80%/);
 assert.throws(()=>startProof(state,content,'F1','mastery',now),/80%/);
 const topic=courseOutline(state,content,{today:'2026-10-02'}).current;
 assert.equal(topic.label,'More practice');assert.match(topic.nextStep,/80%/);
});

test('one-day bursts, assisted answers and recognition cannot fill the independent writing sample',()=>{
 const state=readyState();state.attempts=Array.from({length:10},(_,index)=>typed(index,{date:'2026-10-02'}));
 assert.match(firstMasteryReadinessNeed(state,'F1',now),/another study day/);
 state.attempts.push(typed(10,{date:'2026-10-01',assisted:true}),typed(11,{date:'2026-10-01'}));
 state.attempts.push({...typed(12,{date:'2026-10-01'}),kind:'choice'});
 assert.match(firstMasteryReadinessNeed(state,'F1',now),/another study day/);
 state.attempts.push(typed(13,{date:'2026-10-01'}));
 assert.equal(firstMasteryReadiness(state,'F1',now).ready,true);
});

test('spelling-only slips count for grammar, but unknown help, result, date and duplicate IDs do not',()=>{
 const state=readyState();state.attempts=Array.from({length:10},(_,index)=>typed(index,{grammar:index<8,spelling:false}));
 assert.equal(firstMasteryReadiness(state,'F1',now).ready,true);
 for(const field of ['assisted','grammar','date']){
  const altered=structuredClone(state);delete altered.attempts[0][field];
  assert.equal(firstMasteryReadiness(altered,'F1',now).ready,false,field);
 }
 state.attempts.push({...state.attempts[0]});
 assert.equal(firstMasteryReadiness(state,'F1',now).selected,10);
 const legacy=mapTrainerAttempt({id:'legacy',day:'2026-10-01',concept_id:'F1',exercise_type:'typed',direction:'en-nl',phase:'practice',grammar_correct:true});
 assert.equal(legacy.assisted,null);
});

test('the latest twelve replace old misses, but evidence expires after fourteen calendar days',()=>{
 const state=readyState();
 state.attempts=[...Array.from({length:8},(_,index)=>typed(index,{date:'2026-09-28',grammar:false})),
  ...Array.from({length:12},(_,index)=>typed(index+8,{date:index<6?'2026-10-01':'2026-10-02',grammar:index<10}))];
 assert.equal(firstMasteryReadiness(state,'F1',now).selected,12);
 assert.equal(firstMasteryReadiness(state,'F1',now).ready,true);
 assert.equal(firstMasteryReadiness(state,'F1',new Date('2026-10-17T12:00:00Z')).selected,0);
 assert.equal(firstMasteryReadiness(state,'F1',new Date('2026-10-17T12:00:00Z')).ready,false);
});

test('older unverified ready states need new evidence, while recorded mastery retakes stay eligible',()=>{
 const state=readyState();state.progress.F1.independent=20;
 state.attempts=[{id:'old',concept:'F1',phase:'practice',kind:'typed',direction:'en-nl',grammar:true,date:'2026-10-01'}];
 assert.match(firstMasteryReadinessNeed(state,'F1',now),/Older answers/);
 assert.equal(dailyProofOffer(state,content,now).canStartToday,false);
 state.progress.F1.proofHistory=[{type:'mastery',passed:false,studyDate:'2026-10-01'}];
 assert.equal(firstMasteryReadinessNeed(state,'F1',now),null);
 assert.equal(dailyProofOffer(state,content,now).canStartToday,true);
 assert.equal(proofEligibility(state,content,'F1','mastery',now),null);
});

test('a ready learner with fewer than twenty questions left waits until the next study day',()=>{
 const state=readyState();state.attempts=Array.from({length:10},(_,index)=>typed(index));
 state.daily.count=1;
 assert.match(dailyProofOffer(state,content,now).reason,/next study day/);
 assert.match(proofEligibility(state,content,'F1','mastery',now),/next study day/);
});
