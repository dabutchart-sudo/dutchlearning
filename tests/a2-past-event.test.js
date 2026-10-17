import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {normalize,tokens,displayTokens} from '../src/engine/util.js';
import {freshState,unlocked} from '../src/engine/learner.js';
import {courseOutline} from '../src/engine/course-progress.js';
import {lessonMaterial} from '../src/ui/teaching-support.js';
import {coursePage} from '../src/ui/course-overview.js';

const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);

test('A2.1 follows S3 and stays closed until the A1 checkpoint is passed',()=>{
 const concept=content.conceptById['A2.1'];
 assert.equal(concept.level,'A2');
 assert.deepEqual(concept.prerequisites,['S3']);
 assert.equal(concept.requiresA1Checkpoint,true);
 assert.equal(concept.minPractice,40);
 const state=freshState(content);
 for(const item of content.concepts){
  if(item.id==='A2.1')continue;
  state.progress[item.id].masteredAt='2026-10-01';
  state.progress[item.id].retentionDue='2026-10-04';
 }
 assert.equal(unlocked(concept,state),false);
 const outline=courseOutline(state,content,{today:'2026-10-16'});
 const topic=outline.topics.find(item=>item.id==='A2.1');
 assert.equal(topic.available,false);
 assert.equal(topic.lockReason,'Pass the A1 checkpoint first');
 assert.match(topic.nextStep,/A1 checkpoint/);
 state.progress['A1.26']={masteredAt:'2026-10-16'};
 assert.equal(unlocked(concept,state),true);
});

test('A2.1 has twenty practice contexts and ninety unseen practised proof sentences',()=>{
 const rows=content.sentences.filter(item=>item.concept==='A2.1');
 const practice=rows.filter(item=>item.pool==='practice');
 const proof=rows.filter(item=>item.pool==='proof');
 assert.ok(practice.length>=20);
 assert.ok(proof.length>=90);
 const dutch=rows.map(item=>normalize(item.nl));
 assert.equal(new Set(dutch).size,dutch.length);
 const earlier=new Set(content.sentences.filter(item=>item.concept!=='A2.1').map(item=>normalize(item.nl)));
 const familiar=new Set(content.sentences.filter(item=>item.concept!=='A2.1'&&item.pool==='practice').flatMap(item=>tokens(item.nl)));
 for(const item of practice)for(const word of tokens(item.nl))familiar.add(word);
 for(const item of rows){
  assert.equal(earlier.has(normalize(item.nl)),false,item.nl);
  assert.ok(item.vocabulary.length,item.id);
  const parts=displayTokens(item.nl);
  assert.ok(item.forms.map(normalize).includes(normalize(parts[item.verbIndex])),item.nl);
 }
 const missing=[];
 for(const item of proof){
  if(practice.some(row=>normalize(row.nl)===normalize(item.nl)))missing.push(item.id);
  if(tokens(item.nl).some(word=>!familiar.has(word)))missing.push(item.nl);
 }
 assert.deepEqual(missing,[]);
});

test('A2.1 lesson uses two practice examples and teaches the past-tense choice',()=>{
 const lesson=lessonMaterial(content,'A2.1');
 assert.ok(lesson.focus.length>=2);
 assert.match(lesson.focus.join(' '),/kofschip/);
 assert.match(lesson.focus.join(' '),/finished event/);
 assert.match(lesson.focus.join(' '),/short story/);
 assert.match(content.conceptById['A2.1'].rule,/short story/);
 const spoken=content.sentences.filter(item=>item.concept==='A2.1');
 assert.equal(spoken.some(item=>/\book\b/i.test(item.nl)),false);
 assert.equal(spoken.some(item=>/\bgekomen\b/i.test(item.nl)),false);
 assert.equal(spoken.some(item=>/\bhad(?:den)?\b[^.]*\bkoffie\b/i.test(item.nl)),false);
 assert.ok(spoken.some(item=>item.nl==='Hij is gisteren naar school gegaan.'));
 assert.ok(lesson.examples.length>=2);
 const proof=new Set(content.sentences.filter(item=>item.concept==='A2.1'&&item.pool==='proof').map(item=>item.nl));
 for(const example of lesson.examples){
  assert.equal(proof.has(example.nl),false,example.nl);
  assert.ok(content.sentences.some(item=>item.concept==='A2.1'&&item.pool==='practice'&&item.nl===example.nl));
 }
 const html=coursePage(freshState(content),content,{today:'2026-10-16'});
 assert.match(html,/A2\.1/);
 assert.match(html,/Pass the A1 checkpoint first/);
 assert.match(html,/A2 · Beyond the basics/);
});

test('A2.1 content ships in the offline build',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(sw,/a2-past-event\.js/);
});
