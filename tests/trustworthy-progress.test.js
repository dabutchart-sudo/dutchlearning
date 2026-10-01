import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {freshState} from '../src/engine/learner.js';
import {courseOutline} from '../src/engine/course-progress.js';
import {capabilityProfile} from '../src/engine/capability-progress.js';
import {coursePage} from '../src/ui/course-overview.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const today='2026-10-01';
const fresh=()=>freshState(content,new Date(`${today}T12:00:00Z`));
const attempt=(id,kind,direction,grammar,extra={})=>({id,date:today,concept:'F1',phase:'practice',kind,direction,grammar,assisted:false,...extra});

test('capability areas use only matching recorded evidence, without manufacturing speech or interaction',()=>{
 const state=fresh();state.attempts=[
  attempt('read','choice','nl-en',true),
  attempt('listen','listening','nl-en',true),
  attempt('fallback','choice','nl-en',false),
  attempt('guided','wordbank','en-nl',true),
  attempt('write','typed','en-nl',true,{wordEvidence:{successful:['fiets','huis']}}),
  attempt('typed-fallback','typed','en-nl',false),
  attempt('help','typed','en-nl',true,{assisted:true,wordEvidence:{successful:['boek']}}),
  attempt('spoken','speaking','en-nl',false),
  attempt('write','typed','en-nl',true),
  attempt('future','speaking','en-nl',true,{date:'2026-10-02'})
 ];
 const before=JSON.stringify(state),byId=Object.fromEntries(capabilityProfile(state,{today}).map(x=>[x.id,x]));
 assert.deepEqual([byId.reading.correct,byId.reading.total],[1,2]);
 assert.deepEqual([byId.listening.correct,byId.listening.total],[1,1]);
 assert.deepEqual([byId.writing.correct,byId.writing.total],[1,2]);
 assert.deepEqual([byId.speaking.correct,byId.speaking.total],[0,1]);
 assert.deepEqual([byId.construction.correct,byId.construction.total],[1,1]);
 assert.deepEqual([byId.recall.correct,byId.recall.total],[2,2]);
 assert.match(byId.recall.detail,/2 distinct Dutch words/);
 assert.equal(byId.interaction.total,0);
 assert.equal(JSON.stringify(state),before);
});

test('journey state explains saved learning, failed mastery, passed mastery and delayed retention',()=>{
 const state=fresh();let topic=courseOutline(state,content,{today}).current;
 assert.equal(topic.journey.label,'Not started');
 Object.assign(state.progress.F1,{lessonAcknowledged:true,taught:true});
 topic=courseOutline(state,content,{today}).current;assert.equal(topic.journey.label,'Learning');
 Object.assign(state.progress.F1,{lessonAcknowledged:true,taught:true,practiceAttempts:8});
 topic=courseOutline(state,content,{today}).current;assert.equal(topic.journey.label,'Practising');
 state.progress.F1.proofHistory=[{type:'mastery',passed:false,studyDate:'2026-09-30'}];
 topic=courseOutline(state,content,{today}).current;assert.equal(topic.journey.label,'Needs attention');
 state.progress.F1.proofHistory.push({type:'mastery',passed:true,studyDate:today});state.progress.F1.retentionDue='2026-10-04';
 topic=courseOutline(state,content,{today}).current;assert.equal(topic.journey.label,'Proven');
 state.progress.F1.retentionDue=null;state.progress.F1.masteredAt=today;state.progress.F1.status='mastered';
 topic=courseOutline(state,content,{today}).topics[0];assert.equal(topic.journey.label,'Retaining');
 state.progress.F1.status='reinforcement';topic=courseOutline(state,content,{today}).topics[0];assert.equal(topic.journey.label,'Needs attention');assert.equal(topic.retained,true);
 state.progress.F1.masteredAt=null;state.progress.F1.status='learning';state.progress.F1.proofHistory.push({type:'retention',passed:false,studyDate:today});
 topic=courseOutline(state,content,{today}).topics[0];assert.match(topic.journey.reason,/retention test was not passed/);
});

test('Course explains distinct capabilities and keeps Flashcard reporting separate',()=>{
 const state=fresh();state.attempts=[attempt('write','typed','en-nl',false)];
 const html=coursePage(state,content,{today,pane:'progress'});
 for(const label of ['Capability profile','Vocabulary / recall','Grammar / construction','Reading','Listening','Writing / production','Speaking','Interaction'])assert.match(html,new RegExp(label.replace('/','\\/')));
 assert.match(html,/No recorded multi-turn exchange yet/);
 assert.match(html,/Flashcard Report remains separate/);
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert.match(sw,/capability-progress\.js/);
});
