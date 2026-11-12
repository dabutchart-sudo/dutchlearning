import test from 'node:test';
import assert from 'node:assert/strict';
import {flashcardDailyBudget,reviewLoadAtStart,adjustedNewCardCap,inferExternalStudyDayComplete} from '../src/engine/flashcard-session.js';
import {buildFlashcardQueue,applyFlashcardRating} from '../src/engine/flashcards.js';
const today='2026-11-07',timestamp='2026-11-07T12:00:00Z';
const cards=Array.from({length:152},(_,i)=>({id:i+1,type:'review',due_date:i<80?'2026-11-01':'2026-11-06',interval:10,ease:2.5}));
const budget=history=>flashcardDailyBudget({history,today,reviewTarget:60});

test('152 overdue cards produce 60 oldest-first answers without editing unscheduled cards',()=>{
 const before=JSON.stringify(cards);
 const queue=buildFlashcardQueue([...cards].reverse(),{today,reviewLimit:budget([]).remaining});
 assert.equal(queue.length,60);
 assert.ok(queue.every(c=>c.due_date==='2026-11-01'));
 assert.equal(JSON.stringify(cards),before);
 assert.equal(adjustedNewCardCap({reviewLoad:152,reviewTarget:60,configuredMax:5}),0);
});

test('Again retries consume budget; refreshed history prevents another daily batch on a second device',()=>{
 const history=[],pool=structuredClone(cards);
 const queue=buildFlashcardQueue(pool,{today,reviewLimit:60});
 while(queue.length&&!budget(history).complete){
  const card=queue.shift(),r=applyFlashcardRating(card,history.length%3===0?'again':'good',{today,nowIso:timestamp});
  Object.assign(pool.find(c=>c.id===card.id),r.card);history.push(r.history);
  if(r.requeue)queue.splice(Math.min(3,queue.length),0,r.card);
 }
 assert.equal(history.length,60);
 assert.ok(new Set(history.map(x=>x.cardid)).size<60);
 const otherDevice=JSON.parse(JSON.stringify(history));
 assert.equal(budget(otherDevice).remaining,0);
 assert.equal(buildFlashcardQueue(pool,{today,reviewLimit:budget(otherDevice).remaining}).length,0);
 assert.equal(inferExternalStudyDayComplete({dueReview:110,todayReviews:budget(otherDevice).answers,reviewTarget:60}),true);
 assert.equal(flashcardDailyBudget({history:otherDevice,today:'2026-11-08',reviewTarget:60}).remaining,60);
 assert.equal(adjustedNewCardCap({reviewLoad:reviewLoadAtStart({cards:pool,history,today}),reviewTarget:60,configuredMax:5}),0);
});

test('partial saved history leaves only the remaining allowance; failed unsaved work consumes none',()=>{
 const history=Array.from({length:23},()=>({timestamp,review_type:'review'}));
 assert.equal(budget(history).remaining,37);
 applyFlashcardRating(cards[0],'good',{today,nowIso:timestamp});
 assert.equal(budget(history).remaining,37);
 history.push({timestamp,review_type:'new'});
 assert.equal(budget(history).remaining,36);
 assert.equal(flashcardDailyBudget({history:[{timestamp:'invalid'}],today,reviewTarget:60}).answers,0);
 assert.equal(flashcardDailyBudget({history,today,reviewTarget:0}).remaining,Infinity);
});

test('optional extra queue can contain only 20 due cards and does not introduce new cards',()=>{
 const queue=buildFlashcardQueue([...cards,{id:999,type:'new'}],{today,newLimit:0,reviewLimit:20});
 assert.equal(queue.length,20);
 assert.ok(queue.every(c=>c.type==='review'));
});

import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('an open batch from yesterday reloads before writing another rating',async()=>{
 const source=readFileSync(new URL('../src/ui/flashcards-preview.js',import.meta.url),'utf8');
 let reloads=0;
 const context={session:{day:'2026-11-06',busy:false,flipped:true},dayKey:()=>today,openPreview:async()=>{reloads++;}};
 const save=vm.runInNewContext(`(${source.slice(source.indexOf('async function saveRating('),source.indexOf('async function openPreview('))})`,context);
 await save('again');
 assert.equal(reloads,1);
});

test('dashboard clearly separates the remaining daily reviews from total backlog',()=>{
 const source=readFileSync(new URL('../src/ui/flashcards-preview.js',import.meta.url),'utf8');
 assert.match(source,/todayReviewCount=complete\?0:Math.min\(dueReview,c.budget.remaining\)/);
 assert.ok(source.includes('Today’s reviews</span><span class="n">${todayReviewCount}'));
 assert.ok(source.includes('Total backlog</span><span class="n">${dueReview}'));
 assert.ok(source.includes('Today’s allowance includes retries.'));
 assert.ok(!source.includes('>Reviews due</span>'));
});
