import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {freshState} from '../src/engine/learner.js';
import {a1CheckpointReadiness} from '../src/engine/a1-checkpoint.js';
import {courseOutline} from '../src/engine/course-progress.js';
import {coursePage} from '../src/ui/course-overview.js';
const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const today='2026-10-03';
const concept=id=>({id,title:id,level:'A1',prerequisites:[]});
function fixture(ids,retained=[]){
 const concepts=ids.map(concept);
 const progress=Object.fromEntries(ids.map(id=>[id,{masteredAt:retained.includes(id)?'2026-10-01':null}]));
 return {state:{progress},content:{concepts,conceptById:Object.fromEntries(concepts.map(item=>[item.id,item]))}};
}

test('the live course keeps the A1 checkpoint closed because later topics are not in the course',()=>{
 const state=freshState(content,new Date(today+'T12:00:00'));
 const before=JSON.stringify(state);
 const readiness=a1CheckpointReadiness(state,content);
 assert.equal(readiness.open,false);
 assert.equal(readiness.officialQualification,false);
 assert.equal(readiness.singleScore,false);
 assert.equal(readiness.stage,'waiting-for-topics');
 assert.deepEqual(readiness.missingTopics,['A1.25']);
 assert.match(readiness.summary,/daily-life consolidation is in the course/);
 assert.match(readiness.summary,/not an official certificate/);
 assert.equal(JSON.stringify(state),before);
 const outline=courseOutline(state,content,{today});
 assert.equal(outline.total,30);
 assert.equal(outline.planned.find(topic=>topic.id==='A1.26').note,readiness.summary);
 const html=coursePage(state,content,{today,pane:'path'});
 assert.match(html,/A1\.26/);
 assert.match(html,/Not open yet/);
 assert.match(html,/not an official certificate/);
 assert.match(html,/Coming later/);
 assert.doesNotMatch(html,/data-course-concept="A1\.26"/);
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
