import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css=await readFile(new URL('../src/ui/flashcards-preview.css',import.meta.url),'utf8');
const preview=await readFile(new URL('../src/ui/flashcards-preview.js',import.meta.url),'utf8');
const sandbox=await readFile(new URL('../src/ui/flashcard-sandbox.js',import.meta.url),'utf8');
const markers=await readFile(new URL('../src/ui/flashcard-language-markers.js',import.meta.url),'utf8');

test('review cards keep both faces and flip horizontally on click',()=>{
 assert.match(css,/\.flashcard-review-card\.is-flipped\{transform:rotateY\(180deg\)\}/);
 assert.match(css,/\.flashcard-face-back\{transform:rotateY\(180deg\)\}/);
 assert.match(css,/\.flashcard-rating-grid\[hidden\]\{display:none\}/);
 assert.match(preview,/bindCardFlip\(card,session,'speak-card'\)/);
 assert.match(preview,/class="flashcard-face flashcard-face-front"/);
 assert.match(preview,/class="flashcard-face flashcard-face-back"/);
 assert.doesNotMatch(preview,/session\.flipped=flipped;renderCard\(\)/);
});

test('sandbox review cards use the same horizontal flip',()=>{
 assert.match(sandbox,/bindCardFlip\(card,sandbox,'sandbox-speak'\)/);
 assert.match(sandbox,/class="flashcard-face flashcard-face-front"/);
 assert.match(sandbox,/class="flashcard-face flashcard-face-back"/);
 assert.doesNotMatch(sandbox,/sandbox\.flipped=flipped;renderSandboxCard\(\)/);
});

test('language markers still apply after both faces stay in the DOM',()=>{
 assert.match(markers,/querySelectorAll\('\.flashcard-review-card \.eyebrow'\)/);
});
