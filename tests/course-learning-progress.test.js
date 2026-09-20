import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {learningProgress} from '../src/engine/course-progress.js';

const overview=readFileSync(new URL('../src/ui/course-overview.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');

test('today’s Learning answers are counted even when they are listening or supported',()=>{
 const state={attempts:[
  {id:'1',date:'2026-09-20',kind:'listening',direction:'nl-en',assisted:false,grammar:true,spelling:null},
  {id:'2',date:'2026-09-20',kind:'choice',direction:'nl-en',assisted:false,grammar:true,spelling:null},
  {id:'3',date:'2026-09-20',kind:'typed',direction:'en-nl',assisted:false,grammar:true,spelling:true},
  {id:'4',date:'2026-09-19',kind:'typed',direction:'en-nl',assisted:false,grammar:true,spelling:true}
 ]};
 const progress=learningProgress(state,{today:'2026-09-20',days:30,cohort:'independent'});
 assert.equal(progress.todayTotal,3);
 assert.equal(progress.todaySupported,2);
 assert.equal(progress.todayIndependent,1);
});

test('Course shows answers today and can open on supported practice when that is today’s work',()=>{
 assert.match(overview,/answers today/);
 assert.match(overview,/p\.todayTotal/);
 assert.match(app,/todayIndependent===0&&preview\.todaySupported>0/);
 assert.match(app,/courseCohort='supported'/);
});
