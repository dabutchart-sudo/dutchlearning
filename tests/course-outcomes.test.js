import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {freshState} from '../src/engine/learner.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const today='2026-10-04';
const outcomes=[
 ['A1.22','Lets you give a simple direction and say where a place is.'],
 ['A1.23','Lets you order politely, ask a price, and ask for help or a repetition.'],
 ['A1.24','Lets you join two short ideas, give a reason, and say what comes first and next.'],
 ['A1.25','Lets you talk about home, work, food, travel, an appointment, or free time.'],
 ['S1','Lets you say what is wrong and ask for help.'],
 ['S2','Lets you say your name, where you come from, and where you live, and ask a name politely.'],
 ['S3','Lets you name an appointment, say the time, and say that you are coming.']
];

test('the course path states what each finished communicative block is for',()=>{
 const state=freshState(content,new Date(today+'T12:00:00'));
 const before=JSON.stringify(state);
 const html=coursePage(state,content,{today,pane:'path'});
 assert.equal(JSON.stringify(state),before);
 for(const [id,line] of outcomes){
  const start=html.indexOf(`<span class="course-topic-code">${id}`);
  assert.ok(start>0,id);
  const card=html.slice(start,html.indexOf('</li>',start));
  assert.match(card,new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 }
 assert.equal((html.match(/Lets you/g)||[]).length,outcomes.length);
 const foundation=html.slice(html.indexOf('<span class="course-topic-code">F1'),html.indexOf('<span class="course-topic-code">F2'));
 assert.doesNotMatch(foundation,/Lets you/);
 const planned=html.slice(html.indexOf('Still to come'));
 assert.match(planned,/A1\.26/);
 assert.match(planned,/Not open yet/);
 assert.doesNotMatch(planned,/Lets you/);
 assert.doesNotMatch(html,/data-course-concept="A1\.26"/);
});

test('a topic page states the outcome and leaves earlier blocks and evidence unchanged',()=>{
 const state=freshState(content,new Date(today+'T12:00:00'));
 const plans=topicPage(state,content,'S3',{today});
 assert.match(plans,/What you can do/);
 assert.match(plans,/Lets you name an appointment, say the time, and say that you are coming\./);
 assert.match(plans,/What you’ll learn/);
 assert.ok(plans.indexOf('What you can do')<plans.indexOf('What you’ll learn'));
 const earlier=topicPage(state,content,'A1.21',{today});
 assert.doesNotMatch(earlier,/What you can do|Lets you/);
 const evidence=coursePage(state,content,{today,pane:'progress'});
 assert.doesNotMatch(evidence,/Lets you|What you can do/);
 assert.match(evidence,/not a combined ability score/);
});
