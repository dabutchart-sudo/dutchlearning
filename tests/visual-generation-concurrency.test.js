import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const fn=await readFile(new URL('../supabase/functions/generate-visual/index.ts',import.meta.url),'utf8');
const migration=await readFile(new URL('../supabase/migrations/20260911_visual_generation_attempt_state.sql',import.meta.url),'utf8');

test('database allows only one active generation reservation per card',()=>{
 assert.match(migration,/unique index[^\n]*visual_generation_log_one_reserved_card_idx/i);
 assert.match(migration,/where status = 'reserved'/i);
});

test('generation reserves before OpenAI and records terminal outcomes',()=>{
 assert.match(fn,/status:'reserved'/);
 assert.match(fn,/status:'failed'/);
 assert.match(fn,/status:'succeeded'/);
 const reserve=fn.indexOf("status:'reserved'");
 const openai=fn.indexOf("https:\/\/api.openai.com\/v1\/images\/generations");
 assert.ok(reserve>=0&&openai>reserve,'reservation must happen before the OpenAI request');
});

test('stale reservations are failed before a new reservation is attempted',()=>{
 assert.match(fn,/stale-reservation/);
 assert.match(fn,/RESERVATION_STALE_MINUTES/);
});

test('concurrent reservation conflicts are reported without starting another generation',()=>{
 assert.match(fn,/23505/);
 assert.match(fn,/already in progress or waiting for review/i);
});
