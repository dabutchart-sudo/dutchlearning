import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {dailyProofOffer,freshState,prepareQuestion,proofEligibility,startProof,submit,teachConcept} from '../src/engine/learner.js';
import {eligibleProof,practiceVocabularyGain,proofVocabularyNeed} from '../src/engine/proof-vocabulary.js';
import {selectProof} from '../src/engine/scheduler.js';
import {normalize,tokens} from '../src/engine/util.js';

const pack=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([pack]);
const now=new Date('2026-09-28T12:00:00Z');
const stateFor=concept=>{
 const state=freshState(content,now);
 for(const row of content.concepts){
  if(row.id===concept)break;
  Object.assign(state.progress[row.id],{masteredAt:'2026-09-27',status:'mastered'});
 }
 Object.assign(state.progress[concept],{status:'proof-ready',practiceAttempts:40,taught:true,lessonAcknowledged:true});
 return state;
};
const completePractice=(state,concept)=>{
 for(const item of content.sentences.filter(row=>row.concept===concept&&row.pool==='practice'))
  state.attempts.push({id:`done:${item.id}`,sourceId:item.id,phase:'practice',correctSentence:item.nl});
};
const completeThrough=(state,concept)=>{
 for(const row of content.concepts){completePractice(state,row.id);if(row.id===concept)break;}
};

test('a test waits for completed practice rather than a lesson reveal or an unanswered question',()=>{
 const state=stateFor('A1.7');
 assert.match(proofEligibility(state,content,'A1.7','mastery',now),/Practise more/);
 assert.equal(dailyProofOffer(state,content,now).canStartToday,false);
 assert.throws(()=>startProof(state,content,'A1.7','mastery',now),/Practise more/);
 const first=content.sentences.find(row=>row.concept==='A1.7'&&row.pool==='practice');
 state.exposures.push({nl:normalize(first.nl),reason:'teaching'});
 state.pending={id:'pending',sourceId:first.id,phase:'practice'};
 assert.equal(proofVocabularyNeed(state,content,'A1.7','mastery').available,0);
});

test('completed practice opens a 20-question proof with ten suitable unseen items reserved',()=>{
 const state=stateFor('A1.7');
 completeThrough(state,'A1.7');
 const need=proofVocabularyNeed(state,content,'A1.7','mastery');
 assert.ok(need.available>=30);
 assert.equal(proofEligibility(state,content,'A1.7','mastery',now),null);
 const familiar=new Set(state.attempts.flatMap(attempt=>tokens(attempt.correctSentence)));
 for(const item of selectProof(state,content,'A1.7',20))
  assert.ok(tokens(item.nl).every(word=>familiar.has(word)),`${item.id}: unseen vocabulary`);
 startProof(state,content,'A1.7','mastery',now);
 assert.equal(state.proof.questions.length,20);
 const resumed=JSON.parse(JSON.stringify(state));
 assert.equal(resumed.proof.questions.length,20);
});

test('practice selection values a sentence that makes proof vocabulary available',()=>{
 const state=stateFor('A1.7');
 const context=content.byId['A1.7-fair-p-01'];
 assert.ok(practiceVocabularyGain(context,state,content,'A1.7')>0);
 completeThrough(state,'A1.7');
 assert.equal(practiceVocabularyGain(context,state,content,'A1.7'),0);
});

test('forty ordinary A1.7 answers can reach vocabulary-ready mastery without extra daily questions',()=>{
 const state=stateFor('A1.7');
 for(const row of content.concepts){
  if(row.id==='A1.7')break;
  state.progress[row.id].nextMaintenance='2099-01-01';
  completePractice(state,row.id);
 }
 Object.assign(state.progress['A1.7'],{status:'learning',practiceAttempts:0});
 teachConcept(state,'A1.7',content);
 let day=now;
 for(let index=0;index<40;index++){
  if(index===20){day=new Date('2026-09-29T12:00:00Z');state.daily={date:'2026-09-29',count:0};}
  const question=prepareQuestion(state,content,day,false);
  assert.equal(question.phase,'practice');
  submit(state,content,question.id,question.answer,day);
 }
 assert.equal(state.progress['A1.7'].practiceAttempts,40);
 assert.equal(state.daily.count,20);
 assert.ok(proofVocabularyNeed(state,content,'A1.7','mastery').available>=30);
 const nextDay=new Date('2026-09-30T12:00:00Z');
 assert.equal(dailyProofOffer(state,content,nextDay).canStartToday,true);
});

test('insufficient fresh proof content has an explicit safe explanation',()=>{
 const state=stateFor('A1.13');
 completePractice(state,'A1.13');
 const available=content.sentences.filter(row=>row.concept==='A1.13'&&row.pool==='proof');
 const exposed=available.slice(0,available.length-29);
 for(const item of exposed)state.exposures.push({nl:normalize(item.nl),reason:'proof'});
 const offer=dailyProofOffer(state,content,now);
 assert.equal(offer.canStartToday,false);
 assert.match(offer.reason,/More fresh test sentences/);
});

test('the personal-vocabulary rule is available offline',()=>{
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(worker,/\.\/src\/engine\/proof-vocabulary\.js/);
});
