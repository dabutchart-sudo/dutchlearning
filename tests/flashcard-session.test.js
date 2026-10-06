import test from 'node:test';
import assert from 'node:assert/strict';
import {inferExternalStudyDayComplete,reviewLoadAllowance,reviewLoadAtStart} from '../src/engine/flashcard-session.js';

test('does not infer completion from zero due reviews alone',()=>{
 assert.equal(inferExternalStudyDayComplete({dueReview:0,todayReviews:0,introducedToday:0,configuredMax:5,effectiveNewCap:5,reviewTarget:60}),false);
});

test('infers completion after a substantial review day even when load reduction introduced fewer new cards',()=>{
 assert.equal(inferExternalStudyDayComplete({dueReview:0,todayReviews:62,introducedToday:3,configuredMax:5,effectiveNewCap:5,reviewTarget:60}),true);
});

test('infers completion when the effective new-card allowance is satisfied',()=>{
 assert.equal(inferExternalStudyDayComplete({dueReview:0,todayReviews:12,introducedToday:5,configuredMax:5,effectiveNewCap:5,reviewTarget:60}),true);
});

test('does not infer completion while reviews remain due',()=>{
 assert.equal(inferExternalStudyDayComplete({dueReview:1,todayReviews:62,introducedToday:5,configuredMax:5,effectiveNewCap:5,reviewTarget:60}),false);
});

test('reconstructs the opening review load without counting retries or new cards',()=>{
 const today='2026-10-06';
 const reviewed=Array.from({length:47},(_,i)=>({cardid:String(i+1),review_type:'review',timestamp:`${today}T08:00:00Z`}));
 const retries=Array.from({length:5},(_,i)=>({cardid:String(i+1),review_type:'review',timestamp:`${today}T09:00:00Z`}));
 const introduced=Array.from({length:3},(_,i)=>({cardid:String(100+i),review_type:'new',timestamp:`${today}T10:00:00Z`}));
 assert.equal(reviewLoadAtStart({cards:[],history:[...reviewed,...retries,...introduced],today}),47);
});

test('keeps a reduced cross-device allowance closed after the phone finishes the batch',()=>{
 const today='2026-10-06';
 const reviewed=Array.from({length:47},(_,i)=>({cardid:String(i+1),review_type:'review',timestamp:`${today}T08:00:00Z`}));
 const retries=Array.from({length:5},(_,i)=>({cardid:String(i+1),review_type:'review',timestamp:`${today}T09:00:00Z`}));
 const introduced=Array.from({length:3},(_,i)=>({cardid:String(100+i),review_type:'new',timestamp:`${today}T10:00:00Z`}));
 const history=[...reviewed,...retries,...introduced];
 const openingLoad=reviewLoadAtStart({cards:[],history,today});
 const effectiveNewCap=reviewLoadAllowance(5,openingLoad,60);
 assert.equal(effectiveNewCap,3);
 assert.equal(inferExternalStudyDayComplete({dueReview:0,todayReviews:history.length,introducedToday:3,configuredMax:5,effectiveNewCap,reviewTarget:60}),true);
});
