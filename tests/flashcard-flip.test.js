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

test('after the flip the 3D card is replaced by a flat English card',()=>{
 assert.match(preview,/function settleReviewCard\(/);
 assert.match(preview,/class="flashcard-settled"/);
 assert.match(preview,/function flippingReviewCard\(/);
 assert.match(preview,/id="flashcard-stage"/);
 assert.match(css,/\.flashcard-settled\{/);
 assert.match(css,/\.flashcard-settled \.flashcard-face\{[^}]*transform:none/);
 assert.doesNotMatch(preview,/function settleFlip\(/);
 assert.doesNotMatch(preview,/is-flat/);
 assert.doesNotMatch(preview,/ratingUnderCard/);
 assert.doesNotMatch(css,/is-flat/);
 assert.doesNotMatch(css,/scaleX\(-1\)/);
 assert.doesNotMatch(css,/\.flashcard-flip-hit\{/);
});

test('Again Hard Good Easy live on a dock that is never 3D',()=>{
 assert.match(preview,/flashcard-rating-dock/);
 assert.match(preview,/if\(ratings\)ratings\.hidden=true/);
 assert.match(css,/\.flashcard-rating-dock\{[^}]*z-index:20/);
 assert.match(css,/\.flashcard-rating-dock\{[^}]*pointer-events:auto/);
 assert.match(css,/\.flashcard-rating-dock\{[^}]*transform:none/);
 assert.match(css,/\.flashcard-rating-dock\[hidden\]\{display:none!important\}/);
 assert.doesNotMatch(preview,/elementFromPoint/);
});

test('a hung rating save cannot leave Again Hard Good Easy frozen',()=>{
 assert.match(preview,/new AbortController\(\)/);
 assert.match(preview,/ctrl\.abort\(\)/);
 assert.match(preview,/finally\{if\(session\)session\.busy=false;\}/);
});

test('Listen, Flag and Edit sit on each face so they rotate with the card',()=>{
 assert.match(preview,/function cardToolRow\(/);
 assert.match(preview,/cardToolRow\(flagged\)/);
 assert.match(preview,/cardToolRow\(flagged,'-back'\)/);
 assert.match(preview,/id="speak-card\$\{suffix\}"/);
 assert.match(preview,/id="flag-sentence\$\{suffix\}"/);
 assert.match(preview,/id="edit-card\$\{suffix\}"/);
 assert.match(preview,/data-dutch=/);
 assert.match(css,/\.flashcard-face \.flashcard-tool-row/);
 assert.match(polish,/\.flashcard-face \.flashcard-tool-row/);
 assert.match(refinements,/host\?\.dataset\?\.dutch/);
});

test('sandbox review cards use the same horizontal flip and rating dock',()=>{
 assert.match(sandbox,/class="flashcard-flip"/);
 assert.match(sandbox,/function flipSandboxCard\(/);
 assert.match(sandbox,/function settleSandboxCard\(/);
 assert.match(sandbox,/class="flashcard-settled"/);
 assert.match(sandbox,/flashcard-rating-dock/);
 assert.match(sandbox,/sandboxToolRow\(flagged,'-back'\)/);
 assert.doesNotMatch(sandbox,/ratingUnderCard/);
 assert.doesNotMatch(sandbox,/is-flat/);
});

test('card tool refinements decorate both faces',()=>{
 assert.match(refinements,/#speak-card,#speak-card-back/);
 assert.match(refinements,/#flag-sentence,#flag-sentence-back/);
 assert.match(refinements,/#edit-card,#edit-card-back/);
 assert.match(markers,/\.flashcard-face > \.eyebrow/);
});
