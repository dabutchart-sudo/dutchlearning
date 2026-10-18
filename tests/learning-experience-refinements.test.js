import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeExercise,maskedCorrection,correctiveFeedback} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {practiceContextWeight} from '../src/engine/scheduler.js';
import {sessionVocabulary,briefingDone,rememberBriefing,shouldShowSessionBriefing,BRIEFING_STORAGE_KEY} from '../src/engine/session-briefing.js';

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
 const whole=assess(q,'Schrijft');
 assert.equal(whole.grammar,true);
 assert.equal(whole.spelling,true);
 const different=assess(q,'schrijf');
 assert.equal(different.grammar,false);
});

test('a capitalised finished verb is accepted and shown without a doubled prefix',()=>{
 const find={...item,nl:'Ik vind de telefoon.',en:'I find the telephone.',verb:'vinden',verbIndex:1,forms:['vind','vindt','vinden']};
 const q=makeExercise(find,'correction',content,{phase:'practice'});
 assert.equal(q.correction.prefix,'vi');
 assert.equal(q.answer,'nd');
 const good=assess(q,'Vind');
 assert.equal(good.grammar,true);
 const feedback=correctiveFeedback(q,find,'Vind',good);
 assert.equal(feedback.words.map(part=>part.text).join(' '),'Ik vind de telefoon');
 assert.equal(feedback.differences.length,0);
 const wrong=assess(q,'Vindt');
 assert.equal(wrong.grammar,false);
 const shown=correctiveFeedback(q,find,'Vindt',wrong);
 assert.ok(shown.differences.some(line=>line.includes('Vindt')&&line.includes('vind')));
 assert.equal(shown.differences.some(line=>line.includes('viVindt')),false);
});

test('correction feedback reconstructs and displays the complete sentence context',()=>{
 const q=makeExercise(item,'correction',content,{phase:'practice'});
 const result=assess(q,'ijtt');
 const feedback=correctiveFeedback(q,item,'ijtt',result);
 assert.equal(feedback.words.map(x=>x.text).join(' '),'Zij schrijft thuis');
 assert.ok(feedback.differences.some(x=>x.includes('schrijtt')&&x.includes('schrijft')));
 assert.equal(feedback.meaning,'She writes at home.');
});

test('choosing the wrong finite form gives verb-form feedback in sentence context',()=>{
 const q=makeExercise(item,'form',content,{phase:'practice'});
 assert.ok(q.options.includes('schrijf'));
 const bad=assess(q,'schrijf');
 assert.equal(bad.grammar,false);
 assert.equal(bad.errorType,'verb_form');
 assert.match(bad.tip,/finite verb/);
 const feedback=correctiveFeedback(q,item,'schrijf',bad);
 assert.ok(feedback.differences.includes('schrijf → schrijft'));
 assert.equal(feedback.meaning,item.en);
 assert.match(feedback.explanation,/schrijven becomes schrijft/);
 const good=assess(q,q.answer);
 assert.equal(good.grammar,true);
 assert.equal(good.errorType,null);
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

test('the daily vocabulary briefing waits until practice is chosen when a test is ready',()=>{
 const base={dailyCount:0,lessonAcknowledged:true,alreadyShown:false};
 assert.equal(shouldShowSessionBriefing(base),true);
 assert.equal(shouldShowSessionBriefing({...base,proofReady:true}),false);
 assert.equal(shouldShowSessionBriefing({...base,proofReady:true,practiceChosen:true}),true);
 assert.equal(shouldShowSessionBriefing({...base,dailyCount:1,practiceChosen:true}),false);
 assert.equal(shouldShowSessionBriefing({...base,alreadyShown:true,practiceChosen:true}),false);
});

test('current build loads and caches the learning-session refinement module',()=>{
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 const ui=readFileSync(new URL('../src/ui/learning-session-refinements.js',import.meta.url),'utf8');
 const escaped=pkg.version.replaceAll('.','\\.');
 assert.match(index,new RegExp(`V${escaped}`));
 assert.match(index,new RegExp(`learning-session-refinements\\.js\\?v=${escaped}`));
 assert.match(sw,/\.\/src\/engine\/session-briefing\.js/);
 assert.match(sw,/\.\/src\/ui\/learning-session-refinements\.js/);
 assert.match(ui,/Words for today’s practice/);
 assert.match(ui,/Type only the missing letters/);
 assert.match(ui,/\.session \.question-card\{min-height:0\}/);
 assert.doesNotMatch(ui,/min-height:clamp/);
});

test('a ready test choice appears before the daily practice vocabulary briefing',()=>{
 const ui=readFileSync(new URL('../src/ui/learning-session-refinements.js',import.meta.url),'utf8');
 assert.match(ui,/activeConcept,dailyProofOffer,teachConcept,markWordsTaught/);
 assert.match(ui,/proofReady=!!dailyProofOffer\(state,content,new Date\(\)\)\?\.canStartToday/);
 assert.match(ui,/closest\?\.\('#gate-practice'\)/);
 assert.match(ui,/proofReady:true,practiceChosen:true/);
 assert.match(ui,/showBriefing\(conceptId,\{onContinue:\(\)=>practice\.click\(\)\}\)/);
});
