import test from 'node:test';
import assert from 'node:assert/strict';
import {searchableCards,wordBrowserSummary} from '../src/engine/word-browser.js';

const cards=[
  {id:1,dutch:'schrijven',english:'write',partofword:'verb',dutch_sentence:'Ik schrijf een brief.',image_url:null,suspended:false},
  {id:2,dutch:'hand',english:'hand',partofword:'noun, de',dutch_sentence:'Mijn hand is koud.',image_url:'https://example.test/hand.png',suspended:false},
  {id:3,dutch:'deur',english:'door',partofword:'noun, de',suspended:true},
];

test('searchableCards searches Dutch, English, type and sentence while excluding suspended cards',()=>{
  assert.deepEqual(searchableCards(cards,'write').map(x=>x.id),[1]);
  assert.deepEqual(searchableCards(cards,'schrijf').map(x=>x.id),[1]);
  assert.deepEqual(searchableCards(cards,'noun').map(x=>x.id),[2]);
  assert.deepEqual(searchableCards(cards,'deur').map(x=>x.id),[]);
});

test('wordBrowserSummary reports active sentence and image coverage',()=>{
  assert.deepEqual(wordBrowserSummary(cards),{total:3,active:2,withSentence:2,withImage:1});
});
