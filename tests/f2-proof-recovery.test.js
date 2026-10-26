import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {availableProofCount} from '../src/engine/scheduler.js';
import {activeConcept,dailyProofOffer,freshState,prepareQuestion,startProof,submit} from '../src/engine/learner.js';
import {eligibleProof} from '../src/engine/proof-vocabulary.js';
import {makeExercise} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {normalize,tokens} from '../src/engine/util.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';
import {seedCompletedPractice} from './helpers/practice-evidence.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const recovery=content.sentences.filter(row=>row.id.startsWith('f2-recovery-v1-'));
const oldProof=content.sentences.filter(row=>row.concept==='F2'&&row.pool==='proof'&&!row.requiresPractice);
const today='2026-10-26',now=new Date(today+'T12:00:00Z');
const exposure=row=>({nl:normalize(row.nl),verb:row.verb,subject:row.subject,family:row.family,words:row.vocabulary.map(word=>word.id)});
function exhausted(){
 const s=freshState(content,now);
 Object.assign(s.progress.F1,{masteredAt:'2026-10-01',status:'mastered'});
 Object.assign(s.progress.F2,{status:'retention-wait',taught:true,lessonAcknowledged:true,practiceAttempts:220,retentionDue:today,
  proofHistory:[{type:'mastery',passed:true,studyDate:'2026-10-23'}]});
 Object.assign(s.progress.F3,{status:'proof-ready',taught:true,lessonAcknowledged:true,practiceAttempts:77});
 s.exposures=oldProof.map(exposure);
 seedCompletedPractice(s,content,'F2');
 return s;
}
function finish(s,type,date,miss=false,used=new Set()){
 startProof(s,content,'F2',type,date);
 const length=type==='retention'?10:20;
 for(let i=0;i<length;i++){
  const q=prepareQuestion(s,content,date),nl=normalize(content.byId[q.sourceId].nl);
  assert.ok(!used.has(nl),nl);used.add(nl);
  assert.ok(['choice','typed'].includes(q.kind));
  submit(s,content,q.id,miss&&i===0?'wrong answer':q.answer,date);
 }
 return used;
}

test('F2 reserve has distinct written questions built from existing grammar, plus four practice introductions',()=>{
 assert.equal(oldProof.length,110);
 assert.equal(recovery.length,112);
 assert.equal(recovery.filter(row=>row.pool==='proof').length,108);
 assert.equal(recovery.filter(row=>row.pool==='practice').length,4);
 assert.match(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),/\.\/src\/content\/f2-proof-recovery\.js/);
 const existing=new Set(content.sentences.filter(row=>!recovery.includes(row)).map(row=>normalize(row.nl)));
 for(const row of recovery){
  assert.ok(!existing.has(normalize(row.nl)),row.id);existing.add(normalize(row.nl));
  const base=content.sentences.find(old=>old.concept==='F2'&&old.nl===row.nl.replace(' nu ', ' '));
  assert.ok(base,row.id);assert.equal(base.verbIndex,row.verbIndex);
  assert.equal(row.requiresPractice,row.pool==='proof');
  if(row.pool==='proof')assert.deepEqual(row.suitableKinds,['choice','typed']);
  for(const kind of row.suitableKinds){const q=makeExercise(row,kind,content,{phase:row.pool==='proof'?'retention':'practice'});assert.equal(assess(q,q.answer).grammar,true,row.id);}
 }
});

test('new F2 proof needs completed word practice, without changing eligibility of the original 110 rows',()=>{
 const s=freshState(content,now);
 assert.equal(eligibleProof(s,content,'F2').length,110);
 s.exposures=oldProof.map(exposure);
 assert.equal(availableProofCount(s,content,'F2'),0);
 s.attempts=content.sentences.filter(row=>row.concept==='F2'&&row.verb==='lezen'&&row.pool==='practice'&&!recovery.includes(row)).map(row=>({phase:'practice',sourceId:row.id}));
 assert.equal(availableProofCount(s,content,'F2'),0);
 const intro=recovery.find(row=>row.pool==='practice');
 s.attempts.push({phase:'practice',sourceId:intro.id});
 const eligible=eligibleProof(s,content,'F2'),familiar=new Set(s.attempts.flatMap(a=>tokens(content.byId[a.sourceId].nl)));
 assert.ok(eligible.length>0);
 assert.ok(eligible.every(row=>tokens(row.nl).every(word=>familiar.has(word))));
 assert.ok(!eligible.some(row=>row.verb==='kopen'));
});

test('exhausted F2 retention is available, preserves F3, and returns to F3 within the same daily allowance',()=>{
 const s=exhausted(),f3=JSON.stringify(s.progress.F3);
 assert.equal(dailyProofOffer(s,content,now).canStartToday,true);
 assert.equal(activeConcept(s,content,today),'F2');
 finish(s,'retention',now);
 assert.equal(s.lastProof.passed,true);assert.equal(s.daily.count,10);
 assert.equal(activeConcept(s,content,today),'F3');
 assert.equal(JSON.stringify(s.progress.F3),f3);
 assert.equal(s.progress.F2.masteredAt,today);
});

test('missing recovery vocabulary is practised before F2 proof and uses the same daily allowance',()=>{
 const s=exhausted();
 s.attempts=s.attempts.filter(a=>!tokens(content.byId[a.sourceId]?.nl||'').includes('nu'));
 assert.equal(availableProofCount(s,content,'F2'),0);
 assert.equal(dailyProofOffer(s,content,now).canStartToday,false);
 const q=prepareQuestion(s,content,now);
 assert.equal(q.phase,'practice');assert.ok(tokens(content.byId[q.sourceId].nl).includes('nu'));
 submit(s,content,q.id,q.answer,now);
 assert.equal(s.daily.count,1);
 assert.equal(dailyProofOffer(s,content,now).canStartToday,true);
});

test('failed retention, eight recovery answers, full mastery and delayed retention never reuse proof wording',()=>{
 const s=exhausted(),used=new Set(oldProof.map(row=>normalize(row.nl)));
 finish(s,'retention',now,true,used);
 assert.equal(s.lastProof.passed,false);assert.equal(s.progress.F2.remedial,8);
 for(let i=0;i<8;i++){const q=prepareQuestion(s,content,now);submit(s,content,q.id,q.answer,now);}
 const retake=new Date('2026-10-27T12:00:00Z');
 assert.equal(dailyProofOffer(s,content,retake).canStartToday,true);
 finish(s,'mastery',retake,false,used);assert.equal(s.lastProof.passed,true);
 const delayed=new Date('2026-10-30T12:00:00Z');
 assert.equal(dailyProofOffer(s,content,delayed).canStartToday,true);
 finish(s,'retention',delayed,false,used);
 assert.equal(s.lastProof.passed,true);assert.equal(s.progress.F3.practiceAttempts,77);
});

test('Course and topic explain the due earlier check, saved later practice, budget and continuation without writing state',()=>{
 const s=exhausted(),before=JSON.stringify(s),offer=dailyProofOffer(s,content,now);
 for(const html of [coursePage(s,content,{today,offer}),topicPage(s,content,'F2',{today,offer})]){
  assert.match(html,/WHY F2 TODAY/);assert.match(html,/passed F2 mastery and could study F3 during the three-day wait/);
  assert.match(html,/due from 26 Oct/);assert.match(html,/comes before F3 practice/);
  assert.match(html,/77 F3 practice answers are saved/);assert.match(html,/10 of today’s 20/);
  assert.match(html,/After passing, you can continue F3/);
 }
 assert.equal(JSON.stringify(s),before);
 const waiting=coursePage(s,content,{today:'2026-10-25'});assert.doesNotMatch(waiting,/WHY F2 TODAY/);
 s.daily.count=20;assert.doesNotMatch(coursePage(s,content,{today,offer}),/WHY F2 TODAY/);
 s.daily.count=0;
 s.exposures.push(...recovery.map(exposure));
 const blocked=dailyProofOffer(s,content,now);
 assert.match(coursePage(s,content,{today,offer:blocked}),/Practice is still available, but it cannot restore used test questions/);
});
