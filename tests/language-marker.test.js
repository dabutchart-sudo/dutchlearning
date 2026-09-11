import test from 'node:test';
import assert from 'node:assert/strict';
import {languageMarker} from '../src/engine/language-marker.js';

test('maps flashcard language labels to flag markers',()=>{
 assert.deepEqual(languageMarker('Dutch'),{language:'Dutch',marker:'🇳🇱'});
 assert.deepEqual(languageMarker('English'),{language:'English',marker:'🇬🇧'});
});

test('ignores unrelated eyebrow labels',()=>{
 assert.equal(languageMarker('Review'),null);
 assert.equal(languageMarker(''),null);
});
