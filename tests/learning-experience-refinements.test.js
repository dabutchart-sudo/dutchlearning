import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeExercise,maskedCorrection,correctiveFeedback} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {practiceContextWeight} from '../src/engine/scheduler.js';
import {sessionVocabulary,briefingDone,rememberBriefing,BRIEFING_STORAGE_KEY} from '../src/engine/session-briefing.js';

const item={
 id:'f1-write-home',concept:'F1',pool:'practice',nl:'Zij schrijft thuis.',en:'She writes at home.',verb:'schrijven',subject:'zij',family:'present',verbIndex:1,
 forms:['schrijf','schrijft','schrijven'],alternatives:[],
 vocabulary:[{id:'schrijven',nl:'schrijven',en:'write',mature:true},{id:'thuis',nl:'thuis',en:'at home',mature:false}]
};
const content={sentences:[item,{...item,id:'f1-short',nl:'Ik hoor.',en:'I hear.',verb:'horen',subject:'ik',vocabulary:[{id:'horen',nl:'horen',en:'hear',mature:true}]},{...item,id:'proof-only',pool:'proof',vocabulary:[{id:'bewijs',nl:'bewijs',en:'proof',mature:false}]}]};

test('correction shows the exact number of missing letters and grades only those letters',()=>{
 const q=makeExercise(item,'correction',content,{phase:'practice'});
 assert.equal(maskedCorrection(item),'Zij schr____ thuis.');
 assert.equal((q.prompt.match(/_/g)||[]).length,q.correction.count);
 assert.equal(q.correction.count,4);
 assert.equal(q.answer,'ijft');
 const good=assess(q,'ijft');
 assert.equal(good.grammar,true);
 assert.equal(good.spelling,true);
 assert.equal(good.capitalization,null);
 const bad=assess(q,'ijtt');
 assert.equal(bad.grammar,false);
 assert.equal(bad.errorType,'verb_form');
});

test('correction feedback reconstructs and displays the complete sentence context',()=>{
 const q=makeExercise(item,'correction',content,{phase:'practice'});
 const result=assess(q,'ijtt');
 const feedback=correctiveFeedback(q,item,'ijtt',result);
 assert.equal(feedback.words.map(x=>x.text).join(' '),'Zij schrijft thuis');
 assert.ok(feedback.differences.some(x=>x.includes('schrijtt')&&x.includes('schrijft')));
 assert.equal(feedback.meaning,'She writes at home.');
});

test('practice ranking strongly prefers useful four-to-eight-word context over two-word fragments',()=>{
 assert.ok(practiceContextWeight({...item,nl:'Ik hoor de deur sluiten.'})>practiceContextWeight({...item,nl:'Ik hoor.'}));
 assert.ok(practiceContextWeight({...item,nl:'Wij schrijven een korte zin.'})>practiceContextWeight({...item,nl:'Wij schrijven.'}));
});

test('session briefing collects practice vocabulary once without leaking proof-only vocabulary',()=>{
 const words=sessionVocabulary(content,'F1');
 assert.deepEqual(words.map(w=>w.id),['thuis','horen','schrijven']);
 assert.ok(!words.some(w=>w.id==='bewijs'));
 const values=new Map();
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 assert.equal(briefingDone(storage,'2026-09-13','F1'),false);
 rememberBriefing(storage,'2026-09-13','F1');
 assert.equal(briefingDone(storage,'2026-09-13','F1'),true);
 assert.ok(values.has(BRIEFING_STORAGE_KEY));
});

test('V5.1.95 loads and caches the learning-session refinement module',()=>{
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/ui/learning-session-refinements.js',import.meta.url),'utf8');
 assert.match(index,/V5\.1\.95/);
 assert.match(index,/learning-session-refinements\.js\?v=5\.1\.95/);
 assert.match(sw,/\.\/src\/engine\/session-briefing\.js/);
 assert.match(sw,/\.\/src\/ui\/learning-session-refinements\.js/);
 assert.match(ui,/Words for today’s practice/);
 assert.match(ui,/Type only the missing letters/);
 assert.match(ui,/min-height:clamp/);
});
