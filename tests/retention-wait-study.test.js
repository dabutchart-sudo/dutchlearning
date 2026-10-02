import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {activeConcept,dailyProofOffer,freshState,masteryPrerequisiteNeed,prepareQuestion,proofEligibility,releaseUnscoredPractice,startProof,submit,teachConcept,unlocked} from '../src/engine/learner.js';
import {courseOutline} from '../src/engine/course-progress.js';
import {selectPractice} from '../src/engine/scheduler.js';
import {createRepository} from '../src/engine/persistence.js';
import {applyLearningSync} from '../src/engine/learning-sync.js';
import {coursePage,testTiming,topicPage} from '../src/ui/course-overview.js';
import {seedCompletedPractice} from './helpers/practice-evidence.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const noon=day=>new Date(`${day}T12:00:00Z`);

function waiting(){
 const state=freshState(content,noon('2026-10-02'));
 seedCompletedPractice(state,content,'F1');
 Object.assign(state.progress.F1,{status:'retention-wait',taught:true,lessonAcknowledged:true,practiceAttempts:40,retentionDue:'2026-10-05',proofHistory:[{type:'mastery',passed:true,studyDate:'2026-10-02'}]});
 state.daily={date:'2026-10-02',count:20};
 return state;
}

test('each waiting day opens only the next lesson and practice while keeping retention unearned',()=>{
 const state=waiting();
 assert.equal(prepareQuestion(state,content,noon('2026-10-02')),null,'passing mastery does not create another normal session that day');
 for(const day of ['2026-10-03','2026-10-04']){
  const outline=courseOutline(state,content,{today:day});
  assert.equal(outline.current.id,'F2');
  assert.equal(outline.topics[0].status,'retention-wait');
  assert.equal(outline.retained,0);
  assert.equal(unlocked(content.conceptById.F2,state),true);
  assert.equal(unlocked(content.conceptById.F3,state),false);
  assert.equal(dailyProofOffer(state,content,noon(day)),null);
  assert.match(coursePage(state,content,{today:day}),/F1 retention is still due/);
  assert.match(topicPage(state,content,'F1',{today:day}),/Earliest 5 Oct/);
  if(day==='2026-10-03'){
   assert.deepEqual(prepareQuestion(state,content,noon(day)),{teachingConcept:'F2'});
   teachConcept(state,'F2',content);
  }
  const question=prepareQuestion(state,content,noon(day));
  assert.equal(question.concept,'F2');
  submit(state,content,question.id,question.answer,noon(day));
 }
 assert.equal(state.progress.F2.practiceAttempts,2);
 assert.equal(state.progress.F1.masteredAt,null);
 assert.equal(state.progress.F1.retentionDue,'2026-10-05');
});

test('due retention is offered ahead of new-topic practice and respects the shared daily budget',()=>{
 const state=waiting();
 state.progress.F2.taught=true;state.progress.F2.lessonAcknowledged=true;
 state.daily={date:'2026-10-04',count:1};
 const pending=prepareQuestion(state,content,noon('2026-10-04'));
 assert.equal(pending.concept,'F2');
 const due=noon('2026-10-05');
 const offer=dailyProofOffer(state,content,due);
 assert.equal(activeConcept(state,content,'2026-10-05'),'F1');
 assert.deepEqual([offer.id,offer.type,offer.needed,offer.canStartToday],['F1','retention',10,true]);
 assert.equal(prepareQuestion(state,content,due).id,pending.id,'an unanswered question survives the day boundary until the learner starts the proof');
 releaseUnscoredPractice(state);
 startProof(state,content,'F1','retention',due);
 assert.equal(state.proof.questions.length,10);
 assert.equal(state.daily.count,0);
 assert.equal(state.progress.F1.masteredAt,null);

 const another=waiting();another.daily={date:'2026-10-05',count:11};
 const blocked=dailyProofOffer(another,content,due);
 assert.equal(blocked.canStartToday,false);
 assert.match(blocked.reason,/next study day/);
 assert.equal(proofEligibility(another,content,'F1','retention',due),blocked.reason);
 assert.equal(another.daily.count,11);
});

test('successor mastery waits for earlier retention even if its own practice is complete',()=>{
 const state=waiting();
 Object.assign(state.progress.F2,{status:'proof-ready',taught:true,lessonAcknowledged:true,practiceAttempts:40});
 const reason=masteryPrerequisiteNeed(state,content,'F2');
 assert.match(reason,/Pass F1's delayed retention/);
 assert.equal(proofEligibility(state,content,'F2','mastery',noon('2026-10-04')),reason);
 const offer=dailyProofOffer(state,content,noon('2026-10-04'));
 assert.equal(offer.id,'F2');assert.equal(offer.canStartToday,false);assert.equal(offer.reason,reason);
 const timing=testTiming(state,content,'F2','2026-10-04',offer);
 assert.equal(timing.mastery.when,'No date yet');assert.match(timing.mastery.detail,/F1's delayed retention/);
 assert.equal(unlocked(content.conceptById.F3,state),false);
});

test('failed retention pauses successor without losing its earlier practice',()=>{
 const state=waiting(),due=noon('2026-10-05');
 Object.assign(state.progress.F2,{status:'learning',taught:true,lessonAcknowledged:true,practiceAttempts:6});
 state.daily={date:'2026-10-05',count:0};
 startProof(state,content,'F1','retention',due);
 let index=0;
 while(state.proof){
  const question=prepareQuestion(state,content,due);
  const answer=index++===0?'wrong answer':question.answer;
  submit(state,content,question.id,answer,due);
 }
 assert.equal(state.progress.F1.proofHistory.at(-1).passed,false);
 assert.equal(state.progress.F1.retentionDue,null);
 assert.equal(state.progress.F1.masteredAt,null);
 assert.equal(activeConcept(state,content,'2026-10-06'),'F1');
 assert.equal(unlocked(content.conceptById.F2,state),false);
 assert.equal(state.progress.F2.practiceAttempts,6);
 assert.match(courseOutline(state,content,{today:'2026-10-06'}).topics[1].journey.reason,/recorded practice is preserved/);
 state.progress.F1.retentionDue='2026-10-09';state.progress.F1.status='retention-wait';
 assert.equal(activeConcept(state,content,'2026-10-07'),'F2');
 assert.equal(state.progress.F2.practiceAttempts,6);
});

test('offline resume and remote download preserve a waiting proof and next-topic question',()=>{
 const state=waiting();state.progress.F2.taught=true;state.progress.F2.lessonAcknowledged=true;
 const day=noon('2026-10-03');
 const pending=prepareQuestion(state,content,day);
 const values=new Map();const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
 const repo=createRepository(storage,content,{key:'retention-wait-test',now:()=>day});repo.save(state);
 const reopened=repo.load();
 assert.equal(prepareQuestion(reopened,content,day).id,pending.id);
 assert.equal(reopened.progress.F1.retentionDue,'2026-10-05');
 assert.equal(reopened.progress.F1.masteredAt,null);
 reopened.revision=12;
 const sync=applyLearningSync({user:{id:'learner'},local:freshState(content,day),remote:{state:reopened},content});
 assert.equal(sync.action,'download');
 assert.equal(sync.state.pending.id,pending.id);
 assert.equal(activeConcept(sync.state,content,'2026-10-04'),'F2');
 assert.equal(dailyProofOffer(sync.state,content,noon('2026-10-05')).id,'F1');
});

test('older retained topics still receive normal maintenance during the wait',()=>{
 const state=waiting();
 Object.assign(state.progress.F1,{status:'mastered',masteredAt:'2026-09-30',retentionDue:null,nextMaintenance:'2026-10-03'});
 Object.assign(state.progress.F2,{status:'retention-wait',taught:true,lessonAcknowledged:true,practiceAttempts:40,retentionDue:'2026-10-06'});
 Object.assign(state.progress.F3,{status:'learning',taught:true,lessonAcknowledged:true});
 state.daily={date:'2026-10-04',count:19};
 const selection=selectPractice(state,content,'F3','2026-10-04',false,false);
 assert.equal(selection.item.concept,'F1');
 assert.equal(selection.phase,'maintenance');
});
