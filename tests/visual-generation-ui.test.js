import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../src/ui/visual-generation-ui.js',import.meta.url),'utf8');
const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');

test('visual generation UI is loaded and cached for offline app code',()=>{
 assert.match(index,/visual-generation-ui\.js/);
 assert.match(sw,/\.\/src\/ui\/visual-generation-ui\.js/);
});

test('visual generation remains an explicit two-step spending action',()=>{
 assert.match(source,/prepare-visual-generation/);
 assert.match(source,/Confirm image generation/);
 assert.match(source,/Confirm generation/);
 assert.match(source,/requestGeneratedVisual\(plan\)/);
 assert.match(source,/The app will never generate it automatically/);
});

test('generation waits until semantic review is complete',()=>{
 assert.match(source,/visualSemanticReviewQueue/);
 assert.match(source,/if\(visualSemanticReviewQueue\(allCards,s,\{today\}\)\.length\)return/);
});

test('spending action is gated by a no-spend server preflight and rechecked before generation',()=>{
 assert.match(source,/visualGenerationStatus/);
 assert.match(source,/preflight\?\.ready/);
 assert.match(source,/const freshStatus=await status\(true\)/);
 assert.match(source,/if\(!freshStatus\.ready\)throw new Error/);
});

test('a generated image must be explicitly approved before it becomes a card cue',()=>{
 assert.match(source,/Check the picture before using it/);
 assert.match(source,/Use this image/);
 assert.match(source,/Reject image/);
 assert.match(source,/approveGeneratedVisual\(generated\)/);
 assert.match(source,/rejectGeneratedVisual\(generated\)/);
 const requestIndex=source.indexOf('generated=await requestGeneratedVisual(plan)');
 const attachIndex=source.indexOf('record.image_url=result.imageUrl');
 assert.ok(requestIndex>=0&&attachIndex>requestIndex);
});
