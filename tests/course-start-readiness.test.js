import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {freshState,activeConcept,prepareQuestion,teachConcept,submit,DAY_SIZE} from '../src/engine/learner.js';
import {createRepository} from '../src/engine/persistence.js';

const base=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url),'utf8'));
const content=registerPacks([base]);

function memoryStorage(){
 const values=new Map();
 return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
}

test('a real fresh learner can complete Day 1 and remains finished after reopening',()=>{
 const now=new Date('2026-09-14T12:00:00Z');
 const storage=memoryStorage();
 const repo=createRepository(storage,content,{key:'course-start-readiness',now:()=>now});
 const state=freshState(content,now);
 assert.equal(activeConcept(state,content),'F1');
 assert.deepEqual(prepareQuestion(state,content,now,false),{teachingConcept:'F1'});
 teachConcept(state,'F1',content);
 for(let i=0;i<DAY_SIZE;i++){
  const question=prepareQuestion(state,content,now,false);
  assert.ok(question?.id,`Day 1 question ${i+1} should exist`);
  submit(state,content,question.id,question.answer,now);
 }
 assert.equal(state.daily.count,DAY_SIZE);
 assert.equal(prepareQuestion(state,content,now,false),null,'Day 1 must finish decisively at 20 scored questions');
 repo.save(state);
 const reopened=repo.load();
 assert.equal(reopened.daily.count,DAY_SIZE);
 assert.equal(reopened.attempts.length,DAY_SIZE);
 assert.equal(prepareQuestion(reopened,content,now,false),null,'reopening on the same day must not create extra work');
});

test('course-start content stays within the grammar scope taught so far',()=>{
 const a120=content.sentences.filter(x=>x.concept==='A1.20');
 assert.ok(a120.length>=50);
 assert.ok(!a120.some(x=>/\bwas\b|\bwaren\b/i.test(x.nl)),'A1.20 should not silently introduce past tense');
 const inversion=a120.find(x=>x.nl==='Morgen heb ik vrij.');
 assert.equal(inversion?.subject,'Ik','time-first inversion should still identify the grammatical subject');
});

test('the current installable build includes the course-start curriculum offline',()=>{
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(index,/manifest\.webmanifest/);
 assert.match(sw,/a1-capability-expansion-1\.js/);
 assert.match(sw,/a1-capability-expansion-2\.js/);
});
