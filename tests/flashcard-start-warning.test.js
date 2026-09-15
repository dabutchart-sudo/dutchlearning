import test from 'node:test';
import assert from 'node:assert/strict';
import {SENTENCE_QUEUE_KEY,outstandingFlagIds,flaggedWordsWarning,allowFlashcardStart} from '../src/ui/flashcard-start-warning.js';

function storage(value){return{getItem:key=>key===SENTENCE_QUEUE_KEY?value:null};}

test('no warning is needed when the flagged sentence queue is empty',()=>{
 let confirmations=0;
 assert.equal(allowFlashcardStart(storage('[]'),()=>{confirmations++;return false;}),true);
 assert.equal(confirmations,0);
});

test('outstanding flagged words are counted once and produce a warning',()=>{
 const s=storage('[12,"12",27]');
 assert.deepEqual(outstandingFlagIds(s),[12,27]);
 const text=flaggedWordsWarning(2);
 assert.match(text,/2 flagged words/);
 assert.match(text,/OK to continue/);
 assert.match(text,/Cancel/);
});

test('user may continue into flashcards despite outstanding flagged words',()=>{
 let shown='';
 const allowed=allowFlashcardStart(storage('[9]'),message=>{shown=message;return true;});
 assert.equal(allowed,true);
 assert.match(shown,/1 flagged word/);
});

test('cancelling the warning blocks the flashcard start',()=>{
 assert.equal(allowFlashcardStart(storage('[9,10]'),()=>false),false);
});

test('malformed queue data does not block flashcards',()=>{
 assert.deepEqual(outstandingFlagIds(storage('{broken')),[]);
 assert.equal(allowFlashcardStart(storage('{broken'),()=>false),true);
});
