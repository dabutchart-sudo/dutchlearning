import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const ui=await readFile(new URL('../src/ui/visual-semantic-review-ui.js',import.meta.url),'utf8');

test('visual semantic review UI is loaded and cached for offline use',()=>{
 assert.match(index,/visual-semantic-review-ui\.js/);
 assert.match(sw,/\.\/src\/ui\/visual-semantic-review-ui\.js/);
});

test('semantic review UI only records a decision and does not invoke image generation',()=>{
 assert.match(ui,/recordVisualSemanticDecision/);
 assert.doesNotMatch(ui,/generateVisual|generate-visual|visualGenerationClient/);
 assert.match(ui,/does not generate an image or spend API credit/);
});
