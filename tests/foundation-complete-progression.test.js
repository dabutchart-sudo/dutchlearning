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

function answerProofPerfectly(state,now){
  const sourceIds=[];
  while(state.proof){
    const question=prepareQuestion(state,content,now,false);
    assert.ok(question?.id,'proof should supply the next question');
    sourceIds.push(question.sourceId);
    submit(state,content,question.id,question.answer,now);
  }
  return sourceIds;
}

function noon(date){return new Date(`${date}T12:00:00Z`);}

test('every Foundation concept can progress through real mastery and retention material',()=>{
  let now=new Date('2026-09-14T12:00:00Z');
  const state=freshState(content,now);
  assert.ok(content.concepts.length>1,'Foundation should contain a multi-concept course');

  for(let index=0;index<content.concepts.length;index++){
    const concept=content.concepts[index];
    assert.equal(activeConcept(state,content),concept.id,`${concept.id} should become the active concept in sequence`);
    assert.deepEqual(prepareQuestion(state,content,now,false),{teachingConcept:concept.id},`${concept.id} should begin with teaching`);
    teachConcept(state,concept.id,content);

    const progress=state.progress[concept.id];
    progress.practiceAttempts=40;
    progress.recognised=4;
    progress.constructed=4;
    progress.independent=12;
    progress.status='proof-ready';
    state.pending=null;
    state.daily={date:now.toISOString().slice(0,10),count:0};

    assert.equal(proofEligibility(state,content,concept.id,'mastery',now),null,`${concept.id} should have enough real mastery material`);
    startProof(state,content,concept.id,'mastery',now);
    assert.equal(state.proof.questions.length,20,`${concept.id} mastery proof should contain 20 questions`);
    const masterySources=answerProofPerfectly(state,now);
    assert.equal(new Set(masterySources).size,masterySources.length,`${concept.id} mastery proof should not repeat a source sentence`);

    assert.equal(state.progress[concept.id].status,'retention-wait',`${concept.id} should wait for retention after mastery`);
    assert.equal(state.progress[concept.id].masteredAt,null,`${concept.id} must not unlock the next concept before retention`);
    assert.equal(activeConcept(state,content),concept.id,`${concept.id} should remain active during retention wait`);

    const retentionDate=state.progress[concept.id].retentionDue;
    now=noon(retentionDate);
    state.daily={date:retentionDate,count:0};
    state.pending=null;
    assert.equal(proofEligibility(state,content,concept.id,'retention',now),null,`${concept.id} should have enough real retention material`);
    startProof(state,content,concept.id,'retention',now);
    assert.equal(state.proof.questions.length,10,`${concept.id} retention proof should contain 10 questions`);
    const retentionSources=answerProofPerfectly(state,now);
    assert.equal(new Set(retentionSources).size,retentionSources.length,`${concept.id} retention proof should not repeat a source sentence`);

    assert.equal(state.progress[concept.id].status,'mastered',`${concept.id} should be retained after a perfect retention proof`);
    assert.ok(state.progress[concept.id].masteredAt,`${concept.id} should record a mastery date`);

    const next=content.concepts[index+1];
    if(next){
      assert.equal(activeConcept(state,content),next.id,`${next.id} should unlock after ${concept.id} retention`);
      assert.deepEqual(prepareQuestion(state,content,now,false),{teachingConcept:next.id},`${next.id} should return to teaching before scored work`);
      state.pending=null;
    }
  }
});
