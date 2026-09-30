import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyRecap,guidanceFor,lessonMaterial,patternTipFor} from '../src/ui/teaching-support.js';
import {coursePage} from '../src/ui/course-overview.js';
import {freshState,useHelp} from '../src/engine/learner.js';
import {readFileSync} from 'node:fs';

const concept={id:'A1.7',title:'Negation with niet',level:'A1',rule:'Use niet to negate a description.',example:'Het huis is niet groot.',translation:'The house is not big.',prerequisites:[],minPractice:40};
const sentences=[
 {id:'one',concept:'A1.7',pool:'practice',nl:'Het huis is niet groot.',en:'The house is not big.',verb:'zijn'},
 {id:'two',concept:'A1.7',pool:'practice',nl:'Ik werk vandaag niet.',en:'I do not work today.',verb:'werken'},
 {id:'three',concept:'A1.7',pool:'practice',nl:'Zij woont niet in Utrecht.',en:'She does not live in Utrecht.',verb:'wonen'},
 {id:'proof',concept:'A1.7',pool:'proof',nl:'Wij komen niet.',en:'We are not coming.',verb:'komen'}
];
const content={concepts:[concept],conceptById:{'A1.7':concept},sentences,byId:Object.fromEntries(sentences.map(x=>[x.id,x]))};

test('lesson expands the teaching pattern with practice examples only',()=>{
 const material=lessonMaterial(content,'A1.7');
 assert.equal(material.focus.length,2);
 assert.match(material.examples[0].nl,/niet/);
 assert.ok(material.examples.length>=1);
 assert.ok(!material.examples.some(x=>x.nl===sentences[3].nl));
});

test('guidance fades with practice and is never shown in proof',()=>{
 const question={id:'q',concept:'A1.7',phase:'practice'};
 assert.equal(guidanceFor(question,{practiceAttempts:0},concept,sentences[1]).prominent,true);
 assert.equal(guidanceFor(question,{practiceAttempts:8},concept,sentences[1]).prominent,false);
 assert.equal(guidanceFor({...question,phase:'mastery'},{practiceAttempts:0},concept,sentences[1]),null);
 assert.match(patternTipFor('A1.15','Zij koopt vandaag niets.',concept),/Niets/);
 const state={pending:{id:'q',phase:'practice'},revision:0};useHelp(state);
 assert.equal(state.pending.assisted,true);
});

test('daily recap uses only completed daily answers and has no stored side effects',()=>{
 const today='2026-09-30',state=freshState(content,new Date(today+'T12:00:00Z'));
 state.daily.count=20;
 state.attempts=[{date:'2026-09-29',phase:'practice',grammar:false},...Array.from({length:20},(_,i)=>({date:today,phase:'practice',concept:'A1.7',sourceId:'two',grammar:i===19?false:true,spelling:true,independent:i<8,assisted:i===19,correctSentence:'Ik werk vandaag niet.',englishMeaning:'I do not work today.'}))];
 const before=JSON.stringify(state),recap=dailyRecap(state,content,today);
 assert.equal(recap.answered,20);assert.equal(recap.independent,8);assert.equal(recap.supported,1);assert.equal(recap.revisit.length,1);
 const html=coursePage(state,content,{today});assert.match(html,/Your daily recap/);assert.match(html,/Ik werk vandaag niet/);
 assert.equal(JSON.stringify(state),before);
 assert.equal(dailyRecap(state,content,'2026-10-01'),null);
 state.daily.count=19;assert.equal(dailyRecap(state,content,today),null);
});

test('the teaching helper is precached for the installed app',()=>{
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(worker,/ASSETS\.push\('\.\/src\/ui\/teaching-support\.js'\)/);
});
