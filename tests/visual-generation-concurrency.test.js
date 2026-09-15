import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const fn=await readFile(new URL('../supabase/functions/generate-visual/index.ts',import.meta.url),'utf8');
const reviewMigration=await readFile(new URL('../supabase/migrations/20260911_visual_generation_review_gate.sql',import.meta.url),'utf8');
const atomicMigration=await readFile(new URL('../supabase/migrations/20260911_visual_generation_atomic_budget.sql',import.meta.url),'utf8');

test('database allows only one active generation or review per card',()=>{
 assert.match(reviewMigration,/unique index[^\n]*visual_generation_log_one_active_card_idx/i);
 assert.match(reviewMigration,/where status in \('reserved','awaiting_review'\)/i);
});

test('generation reserves atomically before OpenAI and records terminal outcomes',()=>{
 assert.match(atomicMigration,/insert into public\.visual_generation_log/i);
 assert.match(atomicMigration,/'reserved'/);
 assert.match(fn,/status:'failed'/);
 assert.match(fn,/status:'succeeded'/);
 const reserve=fn.indexOf("rpc('reserve_visual_generation'");
 const openai=fn.indexOf('https://api.openai.com/v1/images/generations');
 assert.ok(reserve>=0&&openai>reserve,'atomic reservation must happen before the OpenAI request');
});

test('stale reservations are failed before a new atomic reservation is attempted',()=>{
 assert.match(fn,/stale-reservation/);
 assert.match(fn,/RESERVATION_STALE_MINUTES/);
 const stale=fn.indexOf('stale-reservation');
 const reserve=fn.indexOf("rpc('reserve_visual_generation'");
 assert.ok(stale>=0&&reserve>stale);
});

test('active card conflicts are reported without starting another generation',()=>{
 assert.match(atomicMigration,/active-card/);
 assert.match(fn,/already in progress or waiting for review/i);
});
