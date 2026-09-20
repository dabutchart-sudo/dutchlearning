import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {makeExercise} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {freshState,prepareQuestion,skipSpeaking,submit} from '../src/engine/learner.js';
import {practiceKind} from '../src/engine/scheduler.js';
import {validateState} from '../src/engine/persistence.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-09-20T12:00:00');
const ready={recognised:4,constructed:4,weakness:0,taught:true,lessonAcknowledged:true};

test('existing learner history defaults speaking off and missing backups stay off',()=>{
 const state=freshState(content,now);
 assert.equal(state.settings.speaking,false);
 assert.equal(state.settings.listening,false);
 const restored=validateState({...state,settings:{listening:true}},content);
 assert.equal(restored.settings.listening,true);
 assert.equal(restored.settings.speaking,false);
});

test('the later practice cycle can ask for a spoken sentence without moving the correction slot',()=>{
 assert.equal(practiceKind({...ready,practiceAttempts:11},false,true),'speaking');
 assert.equal(practiceKind({...ready,practiceAttempts:11},false,false),'typed');
 assert.equal(practiceKind({...ready,practiceAttempts:14},true,true),'correction');
});

test('skipping speaking keeps the same English-to-Dutch item as a typed question',()=>{
 const state=freshState(content,now);
 Object.assign(state.progress.F1,ready,{practiceAttempts:11});
 const spoken=prepareQuestion(state,content,now,false,true);
 assert.equal(spoken.kind,'speaking');
 assert.equal(spoken.direction,'en-nl');
 const typed=skipSpeaking(state);
 assert.equal(typed.id,spoken.id);
 assert.equal(typed.kind,'typed');
 assert.equal(typed.prompt,spoken.prompt);
 assert.equal(typed.answer,spoken.answer);
 assert.equal(state.daily.count,0);
 const rec=submit(state,content,typed.id,typed.answer,now);
 assert.equal(rec.kind,'typed');
 assert.equal(state.daily.count,1);
 assert.throws(()=>skipSpeaking(state),/not a spoken question/);
});

test('spoken answers score exact, near and missed speech without counting as independent writing',()=>{
 const item=content.sentences.find(s=>s.nl==='Wij schrijven.'&&s.pool==='practice');
 const q=makeExercise(item,'speaking',content);
 const exact=assess(q,'wij schrijven');
 assert.equal(exact.grammar,true);
 assert.equal(exact.spelling,true);
 assert.equal(exact.independent,false);
 const near=assess(q,'Wij schijven.');
 assert.equal(near.grammar,true);
 assert.equal(near.spelling,false);
 const miss=assess(q,'Wij lezen.');
 assert.equal(miss.grammar,false);
 assert.equal(miss.independent,false);
});

test('the isolated preview exposes skip-to-type and skip-speaking controls',()=>{
 const html=readFileSync(new URL('../preview/listen-speak.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../preview/listen-speak.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 assert.match(html,/Skip speaking and stay with listening/);
 assert.match(js,/Skip speaking — type instead/);
 assert.match(js,/typeInstead/);
 assert.match(app,/skipSpeaking/);
 assert.match(app,/Skip speaking — type instead/);
});
