import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGeneratedVisual,validateGeneratedVisual} from '../src/engine/visual-generation-response.js';

test('normalizes a valid generated visual response',()=>{
 const result=normalizeGeneratedVisual({cardId:12,imageUrl:'https://example.com/cue.png',alt:'Cue',model:'gpt-image-2'});
 assert.equal(result.cardId,'12');
 assert.equal(result.imageUrl,'https://example.com/cue.png');
 assert.equal(result.alt,'Cue');
 assert.equal(result.model,'gpt-image-2');
});

test('accepts snake case server fields and supplies a safe alt fallback',()=>{
 const result=normalizeGeneratedVisual({card_id:'7',image_url:'https://example.com/7.webp'});
 assert.equal(result.cardId,'7');
 assert.equal(result.alt,'Visual memory cue');
});

test('rejects missing, malformed, or non-https image URLs',()=>{
 assert.throws(()=>normalizeGeneratedVisual({cardId:1}),/invalid image URL/);
 assert.throws(()=>normalizeGeneratedVisual({cardId:1,imageUrl:'not-a-url'}),/invalid image URL/);
 assert.throws(()=>normalizeGeneratedVisual({cardId:1,imageUrl:'http://example.com/a.png'}),/must use HTTPS/);
});

test('rejects a response for the wrong card',()=>{
 assert.throws(()=>validateGeneratedVisual({cardId:2,imageUrl:'https://example.com/a.png'},1),/unexpected card id/);
});
