import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {learningProgress} from '../src/engine/course-progress.js';
import {coursePage} from '../src/ui/course-overview.js';

const overview=readFileSync(new URL('../src/ui/course-overview.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');

const todayListening={
 attempts:Array.from({length:20},(_,i)=>({id:String(i+1),date:'2026-09-20',kind:i%2?'listening':'choice',direction:'nl-en',assisted:false,grammar:true,spelling:null,concept:'A1.1'}))
};
const emptyContent={concepts:[],sentences:[],conceptById:{}};

test('today’s Learning answers are counted even when they are listening or supported',()=>{
 const state={attempts:[
  {id:'1',date:'2026-09-20',kind:'listening',direction:'nl-en',assisted:false,grammar:true,spelling:null},
  {id:'2',date:'2026-09-20',kind:'choice',direction:'nl-en',assisted:false,grammar:true,spelling:null},
  {id:'3',date:'2026-09-20',kind:'typed',direction:'en-nl',assisted:false,grammar:true,spelling:true},
  {id:'4',date:'2026-09-19',kind:'typed',direction:'en-nl',assisted:false,grammar:true,spelling:true}
 ]};
 const progress=learningProgress(state,{today:'2026-09-20',days:30,cohort:'all'});
 assert.equal(progress.todayTotal,3);
 assert.equal(progress.todaySupported,2);
 assert.equal(progress.todayIndependent,1);
 assert.equal(progress.daily.at(-1).date,'2026-09-20');
 assert.equal(progress.daily.at(-1).total,3);
});

test('one completed Learning day is enough to populate the Course chart',()=>{
 const progress=learningProgress(todayListening,{today:'2026-09-20',days:30,cohort:'all'});
 assert.equal(progress.todayTotal,20);
 assert.equal(progress.selected.total,20);
 const html=coursePage(todayListening,emptyContent,{today:'2026-09-20',pane:'progress',days:30,cohort:'all'});
 assert.match(html,/answers today/);
 assert.match(html,/>20</);
 assert.match(html,/course-trend-chart/);
 assert.match(html,/grammar 20\/20/);
});

test('Course defaults to all practice so today’s session is not hidden',()=>{
 assert.match(overview,/All practice/);
 assert.match(overview,/data-course-cohort="\$\{id\}"/);
 assert.match(app,/courseCohort='all'/);
 assert.doesNotMatch(app,/todayIndependent===0&&preview\.todaySupported>0/);
});
