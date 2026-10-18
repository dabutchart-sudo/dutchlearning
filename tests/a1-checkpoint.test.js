import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {normalize,tokens,displayTokens} from '../src/engine/util.js';
import {freshState,teachConcept,startProof,unlocked} from '../src/engine/learner.js';
import {a1CheckpointReadiness} from '../src/engine/a1-checkpoint.js';
import {courseOutline} from '../src/engine/course-progress.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';
import {lessonMaterial} from '../src/ui/teaching-support.js';
const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const today='2026-10-03';
const concept=id=>({id,title:id,level:'A1',prerequisites:[]});
function fixture(ids,retained=[]){
 const concepts=ids.map(concept);
 const progress=Object.fromEntries(ids.map(id=>[id,{masteredAt:retained.includes(id)?'2026-10-01':null}]));
 return {state:{progress},content:{concepts,conceptById:Object.fromEntries(concepts.map(item=>[item.id,item]))}};
}

test('the live course keeps the A1 checkpoint closed until retention and the unseen check exist',()=>{
 const state=freshState(content,new Date(today+'T12:00:00'));
 const before=JSON.stringify(state);
 const readiness=a1CheckpointReadiness(state,content);
 assert.equal(readiness.open,false);
 assert.equal(readiness.officialQualification,false);
 assert.equal(readiness.singleScore,false);
 assert.equal(readiness.stage,'waiting-for-retention');
 assert.deepEqual(readiness.missingTopics,[]);
 assert.ok(readiness.notRetained.includes('A1.25'));
 assert.equal(readiness.notRetained.includes('A2.1'),false);
 assert.match(readiness.summary,/delayed retention check/);
 assert.match(readiness.summary,/not an official certificate/);
 assert.equal(JSON.stringify(state),before);
 const outline=courseOutline(state,content,{today});
 assert.equal(outline.total,36);
 assert.equal(outline.planned.find(topic=>topic.id==='A1.26'),undefined);
 const topic=outline.topics.find(item=>item.id==='A1.26');
 assert.equal(topic.available,false);
 assert.equal(topic.lockReason,'Every earlier topic still needs its retention check.');
 assert.equal(topic.nextStep,readiness.summary);
 const html=coursePage(state,content,{today,pane:'path'});
 assert.match(html,/A1\.26/);
 assert.match(html,/Every earlier topic still needs its retention check/);
 assert.match(html,/not an official certificate/);
 assert.match(html,/data-course-concept="A1\.26"/);
 assert.doesNotMatch(html,/data-course-start="A1\.26"/);
 assert.match(worker,/a1-checkpoint\.js/);
});

test('the checkpoint names only the topics that are still missing',()=>{
 const none=fixture(['F1']);
 const waiting=a1CheckpointReadiness(none.state,none.content);
 assert.deepEqual(waiting.missingTopics,['A1.23','A1.24','A1.25']);
 assert.match(waiting.summary,/requests and service Dutch, connecting ideas, and daily-life consolidation/);
 assert.equal(waiting.open,false);
 const some=fixture(['F1','A1.23'],['F1','A1.23']);
 const partial=a1CheckpointReadiness(some.state,some.content);
 assert.deepEqual(partial.missingTopics,['A1.24','A1.25']);
 assert.match(partial.summary,/connecting ideas and daily-life consolidation/);
 assert.equal(partial.open,false);
 const one=fixture(['F1','A1.23','A1.24'],['F1','A1.23','A1.24']);
 const left=a1CheckpointReadiness(one.state,one.content);
 assert.deepEqual(left.missingTopics,['A1.25']);
 assert.match(left.summary,/daily-life consolidation is in the course/);
 assert.equal(left.open,false);
});

test('the checkpoint stays closed until every earlier topic is retained',()=>{
 const ids=['F1','A1.22','A1.23','A1.24','A1.25'];
 const waiting=a1CheckpointReadiness(fixture(ids,['F1']).state,fixture(ids,['F1']).content);
 assert.equal(waiting.stage,'waiting-for-retention');
 assert.equal(waiting.open,false);
 assert.deepEqual(waiting.missingTopics,[]);
 assert.ok(waiting.notRetained.includes('A1.23'));
 assert.equal(waiting.notRetained.includes('F1'),false);
});

test('retained earlier topics still do not open a checkpoint that has no unseen check',()=>{
 const ids=['F1','A1.22','A1.23','A1.24','A1.25'];
 const ready=fixture(ids,ids);
 const readiness=a1CheckpointReadiness(ready.state,ready.content);
 assert.equal(readiness.stage,'waiting-for-material');
 assert.equal(readiness.open,false);
 assert.deepEqual(readiness.missingTopics,[]);
 assert.deepEqual(readiness.notRetained,[]);
 assert.equal(readiness.officialQualification,false);
});

test('the unseen check opens only after every earlier topic is retained',()=>{
 const state=freshState(content,new Date(today+'T12:00:00'));
 for(const item of content.concepts){
  if(item.requiresA1Checkpoint||item.id==='A1.26')continue;
  state.progress[item.id].masteredAt='2026-10-01';
 }
 const readiness=a1CheckpointReadiness(state,content);
 assert.equal(readiness.open,true);
 assert.equal(readiness.stage,'ready');
 assert.equal(readiness.officialQualification,false);
 assert.equal(readiness.singleScore,false);
 assert.equal(unlocked(content.conceptById['A1.26'],state,content),true);
 assert.equal(unlocked(content.conceptById['A2.1'],state,content),false);
 teachConcept(state,'A1.26',content);
 assert.equal(state.progress['A1.26'].status,'proof-ready');
 assert.equal(state.progress['A1.26'].practiceAttempts,0);
 const proof=startProof(state,content,'A1.26','mastery',new Date(today+'T12:00:00'));
 assert.equal(proof.questions.length,20);
 assert.equal(proof.questions.filter(question=>question.direction==='nl-en').length,10);
 assert.equal(proof.questions.filter(question=>question.direction==='en-nl').length,10);
 const page=topicPage(state,content,'A1.26',{today});
 assert.match(page,/About this check/);
 assert.match(page,/not an official certificate/);
 assert.doesNotMatch(page,/required practice answers/);
});

test('checkpoint sentences stay unseen, familiar, and spread across everyday situations',()=>{
 const rows=content.sentences.filter(item=>item.concept==='A1.26');
 const practice=rows.filter(item=>item.pool==='practice');
 const proof=rows.filter(item=>item.pool==='proof');
 assert.ok(practice.length>=20);
 assert.ok(proof.length>=90);
 const dutch=rows.map(item=>normalize(item.nl));
 assert.equal(new Set(dutch).size,dutch.length);
 const earlier=new Set(content.sentences.filter(item=>item.concept!=='A1.26').map(item=>normalize(item.nl)));
 const familiar=new Set(content.sentences.filter(item=>item.concept!=='A1.26'&&item.pool==='practice').flatMap(item=>tokens(item.nl)));
 for(const item of practice)for(const word of tokens(item.nl))familiar.add(word);
 const domains=new Set();
 for(const item of rows){
  assert.equal(earlier.has(normalize(item.nl)),false,item.nl);
  domains.add(item.expectedStructure);
  const parts=displayTokens(item.nl);
  assert.ok(item.forms.map(normalize).includes(normalize(parts[item.verbIndex])),item.nl);
 }
 for(const item of proof)assert.equal(tokens(item.nl).some(word=>!familiar.has(word)),false,item.nl);
 assert.ok(domains.size>=6);
 const lesson=lessonMaterial(content,'A1.26');
 assert.match(lesson.focus.join(' '),/does not teach a new rule/);
 const proofText=new Set(proof.map(item=>item.nl));
 assert.equal(proofText.has(content.conceptById['A1.26'].example),false);
 for(const example of lesson.examples)assert.equal(proofText.has(example.nl),false);
});
