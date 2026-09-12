import test from 'node:test';
import assert from 'node:assert/strict';
import {inferExternalStudyDayComplete} from '../src/engine/flashcard-session.js';

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
