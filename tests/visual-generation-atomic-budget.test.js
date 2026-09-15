import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migration=await readFile(new URL('../supabase/migrations/20260911_visual_generation_atomic_budget.sql',import.meta.url),'utf8');
const fn=await readFile(new URL('../supabase/functions/generate-visual/index.ts',import.meta.url),'utf8');

test('atomic reservation serializes all visual spending for one user',()=>{
 assert.match(migration,/create or replace function public\.reserve_visual_generation/i);
 assert.match(migration,/pg_advisory_xact_lock\(hashtextextended\(p_user_id::text, 0\)\)/i);
 assert.match(migration,/daily-limit-reached/);
 assert.match(migration,/monthly-limit-reached/);
 assert.match(migration,/monthly-cost-ceiling-reached/);
 assert.match(migration,/insert into public\.visual_generation_log/i);
});

test('atomic reservation is callable only by the service role',()=>{
 assert.match(migration,/revoke all on function public\.reserve_visual_generation[\s\S]*from public/i);
 assert.match(migration,/from anon/i);
 assert.match(migration,/from authenticated/i);
 assert.match(migration,/grant execute on function public\.reserve_visual_generation[\s\S]*to service_role/i);
});

test('edge function uses the atomic database reservation before OpenAI',()=>{
 const rpc=fn.indexOf("rpc('reserve_visual_generation'");
 const openai=fn.indexOf('https://api.openai.com/v1/images/generations');
 assert.ok(rpc>=0&&openai>rpc,'atomic reservation must happen before the OpenAI request');
 assert.doesNotMatch(fn,/\.insert\(\{user_id:userData\.user\.id,card_id:cardId,model,estimated_cost_gbp:estimatedCostGbp,status:'reserved'\}\)/);
});

test('edge function maps atomic budget refusal reasons without spending',()=>{
 assert.match(fn,/active-card/);
 assert.match(fn,/daily-limit-reached/);
 assert.match(fn,/monthly-limit-reached/);
 assert.match(fn,/monthly-cost-ceiling-reached/);
 assert.match(fn,/invalid-budget-config/);
});
