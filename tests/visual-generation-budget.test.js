import test from 'node:test';
import assert from 'node:assert/strict';
import {visualGenerationAllowance,VISUAL_GENERATION_DAILY_LIMIT,VISUAL_GENERATION_MONTHLY_LIMIT} from '../src/engine/visual-generation-budget.js';

test('allows generation when daily and monthly budgets are unused',()=>{
 const a=visualGenerationAllowance([],{today:'2026-09-11'});
 assert.equal(a.allowed,true);
 assert.equal(a.dailyRemaining,VISUAL_GENERATION_DAILY_LIMIT);
 assert.equal(a.monthlyRemaining,VISUAL_GENERATION_MONTHLY_LIMIT);
});

test('default daily budget permits only one attempt',()=>{
 const a=visualGenerationAllowance([{created_at:'2026-09-11T08:00:00Z'}],{today:'2026-09-11'});
 assert.equal(a.allowed,false);
 assert.equal(a.usedToday,1);
 assert.equal(a.dailyRemaining,0);
});

test('monthly budget blocks generation even on a fresh day',()=>{
 const events=Array.from({length:10},(_,i)=>({createdAt:`2026-09-${String(i+1).padStart(2,'0')}T08:00:00Z`}));
 const a=visualGenerationAllowance(events,{today:'2026-09-11'});
 assert.equal(a.allowed,false);
 assert.equal(a.usedMonth,10);
 assert.equal(a.monthlyRemaining,0);
});

test('custom lower limits are respected',()=>{
 const events=[{date:'2026-09-10'},{date:'2026-09-11'}];
 const a=visualGenerationAllowance(events,{today:'2026-09-11',dailyLimit:2,monthlyLimit:3});
 assert.equal(a.allowed,true);
 assert.equal(a.remaining,1);
});
