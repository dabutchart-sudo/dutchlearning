import test from 'node:test';
import assert from 'node:assert/strict';
import {historyIdentity,isReviewHistoryPost,isSchedulingPatch,srsSnapshot} from '../src/engine/flashcard-write-safety.js';

test('detects scheduling card patches only when all SRS fields are present',()=>{
 const url='https://example.supabase.co/rest/v1/cards?id=eq.42';
 assert.equal(isSchedulingPatch(url,{method:'PATCH',body:JSON.stringify({type:'review',interval:2,ease:2.5,reps:3,lapses:0,first_seen:'2026-09-11',last_reviewed:'2026-09-11',due_date:'2026-09-13'})}),true);
 assert.equal(isSchedulingPatch(url,{method:'PATCH',body:JSON.stringify({dutch_sentence:'Hallo.'})}),false);
 assert.equal(isSchedulingPatch(url,{method:'GET'}),false);
});

test('detects reviewhistory posts',()=>{
 assert.equal(isReviewHistoryPost('https://example.supabase.co/rest/v1/reviewhistory',{method:'POST'}),true);
 assert.equal(isReviewHistoryPost('https://example.supabase.co/rest/v1/cards',{method:'POST'}),false);
});

test('creates a complete SRS rollback snapshot',()=>{
 assert.deepEqual(srsSnapshot({type:'review',interval:4,ease:2.3,reps:5,lapses:1,first_seen:'a',last_reviewed:'b',due_date:'c',dutch:'x'}),{type:'review',interval:4,ease:2.3,reps:5,lapses:1,first_seen:'a',last_reviewed:'b',due_date:'c'});
});

test('normalises review history identity',()=>{
 assert.deepEqual(historyIdentity({cardid:12,timestamp:'2026-09-11T12:34:56.000Z'}),{cardid:'12',timestamp:'2026-09-11T12:34:56.000Z'});
 assert.deepEqual(historyIdentity({card_id:7,timestamp:'x'}),{cardid:'7',timestamp:'x'});
 assert.equal(historyIdentity({cardid:7}),null);
});
