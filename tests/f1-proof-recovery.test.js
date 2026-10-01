import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {availableProofCount,selectPractice} from '../src/engine/scheduler.js';
import {dailyProofOffer,freshState,prepareQuestion,startProof,submit} from '../src/engine/learner.js';
import {makeExercise} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {normalize,tokens} from '../src/engine/util.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const recovery=content.sentences.filter(item=>item.id.startsWith('f1-recovery-v1-'));
const oldProof=content.sentences.filter(item=>item.concept==='F1'&&item.pool==='proof'&&!item.requiresPractice);
const oldPractice=content.sentences.filter(item=>item.concept==='F1'&&item.pool==='practice'&&!item.id.startsWith('f1-recovery-v1-'));

function exhaustedState(){
 const state=freshState(content,new Date('2026-10-01T12:00:00Z'));
 Object.assign(state.progress.F1,{status:'proof-ready',taught:true,lessonAcknowledged:true,practiceAttempts:100,
  proofHistory:[{type:'mastery',passed:false,studyDate:'2026-09-30'}]});
 state.exposures=oldProof.map(item=>({nl:normalize(item.nl),verb:item.verb,subject:item.subject,family:item.family,words:item.vocabulary.map(word=>word.id)}));
 state.attempts=oldPractice.map((item,i)=>({id:`practice-${i}`,sourceId:item.id,phase:'practice',date:'2026-09-30'}));
 return state;
}

test('F1 recovery adds distinct, valid sentences and keeps all proof questions written',()=>{
 assert.match(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),/\.\/src\/content\/f1-proof-recovery\.js/);
 assert.equal(recovery.length,160);
 assert.equal(recovery.filter(item=>item.pool==='practice').length,8);
 assert.equal(recovery.filter(item=>item.pool==='proof').length,152);
 const original=new Set(content.sentences.filter(item=>!item.id.startsWith('f1-recovery-v1-')).map(item=>normalize(item.nl)));
 const added=new Set();
 for(const item of recovery){
  const sentence=normalize(item.nl);
  assert.ok(!original.has(sentence),item.id);
  assert.ok(!added.has(sentence),item.id);added.add(sentence);
  assert.equal(item.concept,'F1');
  assert.equal(item.requiresPractice,item.pool==='proof');
  assert.ok(item.vocabulary.some(word=>word.id==='word:nu'&&word.en==='now'),item.id);
  assert.equal(tokens(item.nl).at(-1),'nu',item.id);
  if(item.pool==='proof')assert.deepEqual(item.suitableKinds,['choice','typed']);
  for(const kind of item.suitableKinds){
   const q=makeExercise(item,kind,content,{phase:item.pool==='proof'?'mastery':'practice'});
   assert.equal(assess(q,q.answer).grammar,true,`${item.id}: ${kind}`);
  }
 }
});

test('an exhausted learner gets a taught recovery context before another 20-question mastery and 10-question retention',()=>{
 const state=exhaustedState(),day=new Date('2026-10-01T12:00:00Z');
 assert.equal(availableProofCount(state,content,'F1'),0);
 assert.match(dailyProofOffer(state,content,day).reason,/Practise more/);
 const selected=selectPractice(state,content,'F1','2026-10-01',false);
 assert.match(selected.item.id,/^f1-recovery-v1-/);
 assert.equal(selected.item.pool,'practice');
 const intro=prepareQuestion(state,content,day);
 assert.match(intro.sourceId,/^f1-recovery-v1-/);
 submit(state,content,intro.id,intro.answer,day);
 assert.ok(availableProofCount(state,content,'F1')>=90);
 assert.match(dailyProofOffer(state,content,day).reason,/next study day/);

 const used=new Set(oldProof.map(item=>normalize(item.nl)));
 for(let attempt=0;attempt<4;attempt++){
  const date=new Date(`2026-10-${String(attempt+2).padStart(2,'0')}T12:00:00Z`);
  assert.equal(dailyProofOffer(state,content,date).canStartToday,true);
  startProof(state,content,'F1','mastery',date);
  for(let i=0;i<20;i++){
   const q=prepareQuestion(state,content,date);
   const sentence=normalize(content.byId[q.sourceId].nl);
   assert.ok(!used.has(sentence),sentence);used.add(sentence);
   submit(state,content,q.id,attempt<3&&i<2?'wrong answer':q.answer,date);
  }
  assert.equal(state.lastProof.passed,attempt===3);
 }
 const retention=new Date('2026-10-08T12:00:00Z');
 assert.equal(dailyProofOffer(state,content,retention).canStartToday,true);
 startProof(state,content,'F1','retention',retention);
 for(let i=0;i<10;i++){
  const q=prepareQuestion(state,content,retention);
  const sentence=normalize(content.byId[q.sourceId].nl);
  assert.ok(!used.has(sentence),sentence);used.add(sentence);
  submit(state,content,q.id,q.answer,retention);
 }
 assert.equal(state.lastProof.passed,true);
 assert.equal(state.progress.F1.status,'mastered');
});
