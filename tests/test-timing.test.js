import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {dailyProofOffer,freshState} from '../src/engine/learner.js';
import {courseOutline} from '../src/engine/course-progress.js';
import {normalize} from '../src/engine/util.js';
import {testTiming,topicPage} from '../src/ui/course-overview.js';
import {seedCompletedPractice} from './helpers/practice-evidence.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const today='2026-10-02',now=new Date(`${today}T12:00:00`);
function ready(){
 const state=freshState(content,now);
 Object.assign(state.progress.F1,{status:'proof-ready',taught:true,lessonAcknowledged:true,practiceAttempts:40});
 seedCompletedPractice(state,content,'F1');
 return state;
}

test('a blocked mastery retake gives no false date and explains when retention follows',()=>{
 const state=ready();
 state.progress.F1.proofHistory=[{type:'mastery',passed:true,studyDate:'2026-09-27'},{type:'retention',passed:false,studyDate:'2026-10-01'}];
 state.exposures=content.sentences.filter(item=>item.concept==='F1'&&item.pool==='proof'&&!item.requiresPractice)
  .map(item=>({nl:normalize(item.nl)}));
 state.attempts=state.attempts.filter(attempt=>!attempt.correctSentence);
 state.pending={id:'open-question',concept:'F1',phase:'practice'};
 const offer=dailyProofOffer(state,content,now);
 assert.equal(offer.canStartToday,false);
 const timing=testTiming(state,content,'F1',today,offer);
 assert.equal(timing.mastery.name,'Mastery retake');
 assert.equal(timing.mastery.when,'No date yet');
 assert.match(timing.mastery.detail,/0 of 30 fresh test sentences/);
 assert.equal(timing.retention.when,'After the next mastery pass');
 assert.equal(courseOutline(state,content,{today}).current.label,'More practice');
 const html=topicPage(state,content,'F1',{today,offer,proofHTML:'<div class="rule">test format</div>'});
 assert.ok(html.indexOf('When can I take a test?')<html.indexOf('Continue current question'));
 assert.match(html,/No date yet/);
 assert.match(html,/Review this topic’s mastery and retention timing before you answer it/);
});

test('a passed mastery gives the retention opening date, then a clear daily-budget date',()=>{
 const state=ready();
 Object.assign(state.progress.F1,{status:'retention-wait',retentionDue:'2026-10-05',proofHistory:[{type:'mastery',passed:true,studyDate:'2026-10-02'}]});
 let timing=testTiming(state,content,'F1',today);
 assert.equal(timing.mastery.when,'Passed');
 assert.equal(timing.retention.when,'Earliest 5 Oct');
 state.progress.F1.retentionDue=today;state.daily.count=11;
 timing=testTiming(state,content,'F1',today);
 assert.equal(timing.retention.when,'From 3 Oct, on a study day');
 state.daily.count=0;
 timing=testTiming(state,content,'F1',today);
 assert.equal(timing.retention.when,'Available today');
});

test('failed retention shows the recovery step without promising a test date',()=>{
 const state=ready();
 Object.assign(state.progress.F1,{status:'learning',remedial:8,proofHistory:[{type:'mastery',passed:true,studyDate:'2026-09-25'},{type:'retention',passed:false,studyDate:'2026-09-28'}]});
 const timing=testTiming(state,content,'F1',today);
 assert.equal(timing.mastery.when,'No date yet');
 assert.match(timing.mastery.detail,/8 successful practice answers/);
 assert.equal(timing.retention.when,'After the next mastery pass');
});

test('retention timing does not promise its due date after the fresh pool is exhausted',()=>{
 const state=ready();
 Object.assign(state.progress.F1,{status:'retention-wait',retentionDue:'2026-10-05',proofHistory:[{type:'mastery',passed:true,studyDate:today}]});
 state.exposures=content.sentences.filter(item=>item.concept==='F1'&&item.pool==='proof').map(item=>({nl:normalize(item.nl)}));
 const timing=testTiming(state,content,'F1',today);
 assert.equal(timing.retention.when,'No date yet');
 assert.match(timing.retention.detail,/three-day wait ends 5 Oct/);
});

test('first mastery states an unmet writing rule, then the next test date when ready',()=>{
 const state=ready();state.attempts=state.attempts.filter(attempt=>!attempt.id.startsWith('fixture-typed:'));
 let timing=testTiming(state,content,'F1',today);
 assert.equal(timing.mastery.when,'No date yet');
 assert.match(timing.mastery.detail,/0 of 10 recent typed answers/);
 seedCompletedPractice(state,content,'F1');
 timing=testTiming(state,content,'F1',today);
 assert.equal(timing.mastery.when,'Available today');
 assert.equal(timing.retention.when,'After mastery passes');
 state.daily.count=1;
 timing=testTiming(state,content,'F1',today);
 assert.equal(timing.mastery.when,'From 3 Oct, on a study day');
});

test('a failed mastery retake starts no earlier than the next study day',()=>{
 const state=ready();state.progress.F1.status='learning';
 state.progress.F1.proofHistory=[{type:'mastery',passed:false,studyDate:today}];
 const timing=testTiming(state,content,'F1',today);
 assert.equal(timing.mastery.when,'From 3 Oct, on a study day');
});

test('an earlier mastery pass does not hide the need for a new retake',()=>{
 const state=ready();state.progress.F1.status='learning';
 state.progress.F1.proofHistory=[{type:'mastery',passed:true,studyDate:'2026-09-20'},{type:'retention',passed:false,studyDate:'2026-09-24'},{type:'mastery',passed:false,studyDate:today}];
 const timing=testTiming(state,content,'F1',today);
 assert.equal(timing.mastery.name,'Mastery retake');
 assert.equal(timing.mastery.when,'From 3 Oct, on a study day');
 assert.equal(timing.retention.when,'After the next mastery pass');
});
