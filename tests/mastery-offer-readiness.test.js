import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {dailyProofOffer,freshState,proofEligibility,startProof} from '../src/engine/learner.js';
import {courseOutline} from '../src/engine/course-progress.js';
import {coursePage} from '../src/ui/course-overview.js';
import {normalize} from '../src/engine/util.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-10-02T12:00:00Z');
const readyStatus=()=>{
 const state=freshState(content,now);
 Object.assign(state.progress.F1,{status:'proof-ready',taught:true,lessonAcknowledged:true,practiceAttempts:12});
 return state;
};

test('an old test-ready status cannot offer or start first mastery before forty answers',()=>{
 const state=readyStatus(),offer=dailyProofOffer(state,content,now);
 assert.equal(offer.canStartToday,false);
 assert.match(offer.reason,/28 more practice answers/);
 assert.match(proofEligibility(state,content,'F1','mastery',now),/12 of 40 recorded/);
 assert.throws(()=>startProof(state,content,'F1','mastery',now),/28 more practice answers/);
 const outline=courseOutline(state,content,{today:'2026-10-02'});
 assert.match(outline.current.journey.reason,/28 more practice answers/);
 const page=coursePage(state,content,{today:'2026-10-02',offer});
 assert.match(page,/Continue learning/);
 assert.doesNotMatch(page,/Choose test or practice/);
});

test('the initial offer appears after forty recorded answers and remains a choice',()=>{
 const state=readyStatus();state.progress.F1.practiceAttempts=40;
 const offer=dailyProofOffer(state,content,now);
 assert.equal(offer.canStartToday,true);
 assert.equal(proofEligibility(state,content,'F1','mastery',now),null);
 const page=coursePage(state,content,{today:'2026-10-02',offer});
 assert.match(page,/Choose test or practice/);
 assert.match(page,/Availability does not predict a pass/);
});

test('saved failed mastery still permits the next-day full retake with an older practice count',()=>{
 const state=readyStatus();state.progress.F1.proofHistory=[{type:'mastery',passed:false,studyDate:'2026-10-01'}];
 const offer=dailyProofOffer(state,content,now);
 assert.equal(offer.canStartToday,true);
 assert.equal(proofEligibility(state,content,'F1','mastery',now),null);
});

test('a ready label cannot offer or start a test without enough unseen sentences',()=>{
 const state=readyStatus();state.progress.F1.practiceAttempts=40;
 const proof=content.sentences.filter(item=>item.concept==='F1'&&item.pool==='proof');
 state.exposures=proof.slice(0,-19).map(item=>({nl:normalize(item.nl)}));
 const offer=dailyProofOffer(state,content,now);
 assert.equal(offer.canStartToday,false);
 assert.match(offer.reason,/More fresh test sentences/);
 assert.match(proofEligibility(state,content,'F1','mastery',now),/More fresh test sentences/);
 assert.throws(()=>startProof(state,content,'F1','mastery',now),/More fresh test sentences/);
});
