import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {
  activeConcept,
  freshState,
  prepareQuestion,
  proofEligibility,
  startProof,
  submit,
  teachConcept
} from '../src/engine/learner.js';

const pack=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([pack]);

function answerCurrentProofPerfectly(state,now){
  while(state.proof){
    const question=prepareQuestion(state,content,now,false);
    assert.ok(question?.id,'proof should supply the next question');
    submit(state,content,question.id,question.answer,now);
  }
}

test('real Foundation course can progress from F1 practice through mastery, retention and into F2',()=>{
  const day1=new Date('2026-09-14T12:00:00Z');
  const state=freshState(content,day1);

  assert.equal(activeConcept(state,content),'F1');
  assert.deepEqual(prepareQuestion(state,content,day1,false),{teachingConcept:'F1'});

  teachConcept(state,'F1',content);
  const progress=state.progress.F1;

  // Represent two completed 20-question practice days. The detailed daily-session
  // behaviour is covered separately; this regression protects the real curriculum
  // boundary from practice into certification and the next concept.
  progress.practiceAttempts=40;
  progress.recognised=4;
  progress.constructed=4;
  progress.independent=12;
  progress.status='proof-ready';
  state.pending=null;
  state.daily={date:'2026-09-14',count:0};

  assert.equal(proofEligibility(state,content,'F1','mastery',day1),null);
  startProof(state,content,'F1','mastery',day1);
  assert.equal(state.proof.questions.length,20);
  answerCurrentProofPerfectly(state,day1);

  assert.equal(state.progress.F1.status,'retention-wait');
  assert.equal(state.progress.F1.retentionDue,'2026-09-17');
  assert.equal(state.progress.F1.masteredAt,null);
  assert.equal(activeConcept(state,content),'F1','F2 must stay locked until retention is proven');

  const retentionDay=new Date('2026-09-17T12:00:00Z');
  state.daily={date:'2026-09-17',count:0};
  assert.equal(proofEligibility(state,content,'F1','retention',retentionDay),null);
  startProof(state,content,'F1','retention',retentionDay);
  assert.equal(state.proof.questions.length,10);
  answerCurrentProofPerfectly(state,retentionDay);

  assert.equal(state.progress.F1.status,'mastered');
  assert.equal(state.progress.F1.masteredAt,'2026-09-17');
  assert.equal(activeConcept(state,content),'F2');
  assert.deepEqual(prepareQuestion(state,content,retentionDay,false),{teachingConcept:'F2'});
});
