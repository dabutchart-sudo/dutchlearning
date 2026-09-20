import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const preview=readFileSync(new URL('../src/ui/flashcards-preview.js',import.meta.url),'utf8');
const sandbox=readFileSync(new URL('../src/ui/flashcard-sandbox.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/ui/flashcards-preview.css',import.meta.url),'utf8');
const polish=readFileSync(new URL('../src/ui/mobile-polish.css',import.meta.url),'utf8');
const refinements=readFileSync(new URL('../src/ui/mobile-flashcard-refinements.js',import.meta.url),'utf8');
const markers=readFileSync(new URL('../src/ui/flashcard-language-markers.js',import.meta.url),'utf8');

test('review cards keep both faces and flip horizontally in place',()=>{
 assert.match(preview,/class="flashcard-flip"/);
 assert.match(preview,/flashcard-face-front/);
 assert.match(preview,/flashcard-face-back/);
 assert.match(preview,/function flipCard\(/);
 assert.match(preview,/classList\.toggle\('is-flipped'/);
 assert.doesNotMatch(preview,/setSide\(!session\.flipped\)/);
 assert.match(css,/\.flashcard-flip-inner\.is-flipped\{transform:rotateY\(180deg\)\}/);
 assert.match(css,/backface-visibility:hidden/);
 assert.match(css,/\.flashcard-face\.flashcard-review-card\{position:absolute;inset:0/);
});

test('flipped cards do not steal taps meant for Again Hard Good Easy',()=>{
 assert.doesNotMatch(preview,/ratingUnderCard/);
 assert.doesNotMatch(preview,/elementFromPoint/);
 assert.doesNotMatch(preview,/getBoundingClientRect\(\)/);
 assert.match(preview,/id="flip-card"/);
 assert.match(preview,/class="flashcard-flip-hit"/);
 assert.match(preview,/getElementById\('flip-card'\)\?\.addEventListener\('click',flipCard\)/);
 assert.doesNotMatch(sandbox,/ratingUnderCard/);
 assert.match(sandbox,/id="sandbox-flip-card"/);
 assert.match(css,/\.flashcard-flip\{[^}]*pointer-events:none/);
 assert.match(css,/\.flashcard-flip-inner\{[^}]*pointer-events:none/);
 assert.match(css,/\.flashcard-face\{[^}]*pointer-events:none/);
 assert.match(css,/\.flashcard-flip-hit\{/);
 assert.match(css,/\.flashcard-rating-grid\{[^}]*z-index:5/);
});

test('a hung rating save cannot leave Again Hard Good Easy frozen',()=>{
 assert.match(preview,/new AbortController\(\)/);
 assert.match(preview,/ctrl\.abort\(\)/);
 assert.match(preview,/finally\{if\(session\)session\.busy=false;\}/);
});

test('Listen, Flag and Edit sit on the card stage so they stay tappable',()=>{
 assert.match(preview,/function cardToolRow\(/);
 assert.match(preview,/cardToolRow\(flagged\)/);
 assert.doesNotMatch(preview,/cardToolRow\(flagged,'-back'\)/);
 assert.match(preview,/id="speak-card\$\{suffix\}"/);
 assert.match(preview,/id="flag-sentence\$\{suffix\}"/);
 assert.match(preview,/id="edit-card\$\{suffix\}"/);
 assert.match(css,/\.flashcard-stage>\.flashcard-tool-row/);
 assert.match(polish,/\.flashcard-stage>\.flashcard-tool-row/);
});

test('sandbox review cards use the same horizontal flip and on-card tools',()=>{
 assert.match(sandbox,/class="flashcard-flip"/);
 assert.match(sandbox,/function flipSandboxCard\(/);
 assert.match(sandbox,/sandboxToolRow\(flagged\)/);
 assert.doesNotMatch(sandbox,/sandboxToolRow\(flagged,'-back'\)/);
});

test('card tool refinements decorate both faces',()=>{
 assert.match(refinements,/#speak-card,#speak-card-back/);
 assert.match(refinements,/#flag-sentence,#flag-sentence-back/);
 assert.match(refinements,/#edit-card,#edit-card-back/);
 assert.match(markers,/\.flashcard-face > \.eyebrow/);
});
