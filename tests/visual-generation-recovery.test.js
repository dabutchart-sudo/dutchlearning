import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const fn=await readFile(new URL('../supabase/functions/generate-visual/index.ts',import.meta.url),'utf8');
const client=await readFile(new URL('../src/ui/visual-generation-client.js',import.meta.url),'utf8');
const ui=await readFile(new URL('../src/ui/visual-generation-ui.js',import.meta.url),'utf8');

test('server exposes authenticated pending review recovery without generating again',()=>{
 assert.match(fn,/action==='pending-review'/);
 assert.match(fn,/eq\('status','awaiting_review'\)/);
 assert.match(fn,/pending:true/);
 const pending=fn.indexOf("action==='pending-review'");
 const openai=fn.indexOf('https://api.openai.com/v1/images/generations');
 assert.ok(pending>=0&&openai>pending,'pending review lookup must happen before any generation path');
});

test('stale pending reviews are cleaned up centrally',()=>{
 assert.match(fn,/expireStaleReviews/);
 assert.match(fn,/REVIEW_STALE_HOURS=24/);
 assert.match(fn,/failure_reason:'stale-review'/);
});

test('client and UI restore staged review after refresh or another signed-in device',()=>{
 assert.match(client,/export async function pendingGeneratedVisual/);
 assert.match(client,/action:'pending-review'/);
 assert.match(ui,/pendingGeneratedVisual/);
 assert.match(ui,/await recoverPending\(\)/);
 assert.match(ui,/This review survives a refresh or another signed-in device/);
});
