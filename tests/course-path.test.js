import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coursePage,topicPage} from '../src/ui/course-overview.js';
import {freshState} from '../src/engine/learner.js';

const overview=readFileSync(new URL('../src/ui/course-overview.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');

const content={
 concepts:[
  {id:'F1',title:'First sentences',level:'Foundation',prerequisites:[],minPractice:40,rule:'Start with a simple sentence.',example:'Ik ben thuis.',translation:'I am at home.'},
  {id:'A1.1',title:'Present tense',level:'A1',prerequisites:['F1'],minPractice:40,rule:'The verb is second.',example:'Ik werk vandaag.',translation:'I work today.'}
 ],
 sentences:[
  {id:'f1-p-01',concept:'F1',pool:'practice',nl:'Ik ben thuis.',en:'I am at home.'},
  {id:'a1-p-01',concept:'A1.1',pool:'practice',nl:'Ik werk vandaag.',en:'I work today.'}
 ]
};
content.conceptById=Object.fromEntries(content.concepts.map(x=>[x.id,x]));
content.byId=Object.fromEntries(content.sentences.map(x=>[x.id,x]));

test('Course opens on the path, not the evidence charts',()=>{
 const state=freshState(content,new Date('2026-09-20T12:00:00Z'));
 const html=coursePage(state,content,{today:'2026-09-20'});
 assert.match(html,/data-course-path/);
 assert.match(html,/data-course-home/);
 assert.ok(html.indexOf('data-course-focus')<html.indexOf('class="course-unit"'));
 assert.match(html,/You’re here/);
 assert.doesNotMatch(html,/Where you are|See the whole path, then start from here\./);
 assert.match(html,/<h2 class="sr-only" tabindex="-1">Course<\/h2>/);
 assert.doesNotMatch(html,/course-path-here|You’re here —/);
 assert.match(html,/data-course-start="F1"/);
 assert.equal((html.match(/data-course-start=/g)||[]).length,1);
 assert.match(html,/Retain F1 first/);
 assert.doesNotMatch(html,/required practice answers|course-method/);
 assert.match(html,/Coming later|Place and movement|A1\.21/);
 assert.doesNotMatch(html,/course-trend-chart/);
 assert.doesNotMatch(html,/data-course-pane/);
 assert.match(app,/view='curriculum'/);
 assert.match(overview,/pane='path'/);
});

test('a retained topic offers extra practice and the current topic can start from the path',()=>{
 const state=freshState(content,new Date('2026-09-20T12:00:00Z'));
 Object.assign(state.progress.F1,{status:'mastered',masteredAt:'2026-09-19',taught:true,lessonAcknowledged:true,practiceAttempts:40});
 const path=coursePage(state,content,{today:'2026-09-20'});
 assert.doesNotMatch(path,/data-course-extra="F1"/);
 assert.match(path,/data-course-start="A1.1"/);
 const retained=topicPage(state,content,'F1',{today:'2026-09-20'});
 assert.match(retained,/id="extra-course"/);
 assert.doesNotMatch(retained,/id="start-course"/);
 const current=topicPage(state,content,'A1.1',{today:'2026-09-20',dailyCount:0,dailyDone:false});
 assert.match(current,/id="start-course"/);
 assert.doesNotMatch(current,/id="extra-course"/);
 assert.ok(current.indexOf('id="start-course"')<current.indexOf('What you’ll learn'));
 assert.match(current,/<details class="course-topic-evidence">/);
 assert.match(current,/0 of 40 required practice answers/);
});

test('a finished day and a ready test are obvious on the path',()=>{
 const state=freshState(content,new Date('2026-09-20T12:00:00Z'));
 state.daily={date:'2026-09-20',count:20};
 const done=coursePage(state,content,{today:'2026-09-20'});
 assert.match(done,/Learning complete for today/);
 assert.doesNotMatch(done,/data-course-start="F1"/);
 const ready=freshState(content,new Date('2026-09-20T12:00:00Z'));
 const testHtml=coursePage(ready,content,{today:'2026-09-20',offer:{id:'F1',canStartToday:true,type:'mastery'}});
 assert.match(testHtml,/Start mastery test/);
 const stale=coursePage(state,content,{today:'2026-09-21'});
 assert.match(stale,/data-course-start="F1"/);
 assert.doesNotMatch(stale,/Learning complete for today/);
});

test('Evidence remains available and still plots a completed Learning day',()=>{
 const state={
  daily:{date:'2026-09-20',count:20},
  progress:{},
  attempts:Array.from({length:20},(_,i)=>({id:String(i+1),date:'2026-09-20',kind:i%2?'listening':'choice',direction:'nl-en',assisted:false,grammar:true,spelling:null,concept:'F1'}))
 };
 const html=coursePage(state,content,{today:'2026-09-20',pane:'progress',days:30,cohort:'all'});
 assert.match(html,/data-course-evidence/);
 assert.match(html,/answers today/);
 assert.match(html,/course-trend-chart/);
 assert.match(html,/grammar 20\/20/);
});
