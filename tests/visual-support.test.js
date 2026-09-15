import test from 'node:test';
import assert from 'node:assert/strict';
import {visualCueForRecord,supportSequenceForMiss,shouldOfferVisualCue} from '../src/engine/visual-support.js';

test('accepts only safe web image URLs',()=>{
 assert.equal(visualCueForRecord({image_url:''}),null);
 assert.equal(visualCueForRecord({image_url:'javascript:alert(1)'}),null);
 assert.equal(visualCueForRecord({image_url:'not a url'}),null);
 assert.equal(visualCueForRecord({image_url:'https://images.example.com/door.jpg'}).url,'https://images.example.com/door.jpg');
});

test('recall misses use a visual cue before spelling support when an image exists',()=>{
 const record={image_url:'https://images.example.com/door.jpg'};
 assert.deepEqual(supportSequenceForMiss(record,{errorType:'recall'}),['visual','spelling']);
 assert.equal(shouldOfferVisualCue(record,{errorType:'recall'}),true);
});

test('spelling slips skip the image because the word was already recalled',()=>{
 const record={image_url:'https://images.example.com/door.jpg'};
 assert.deepEqual(supportSequenceForMiss(record,{errorType:'spelling'}),['spelling']);
 assert.equal(shouldOfferVisualCue(record,{errorType:'spelling'}),false);
});

test('recall misses fall back to spelling support when no image is available',()=>{
 assert.deepEqual(supportSequenceForMiss({}, {errorType:'recall'}),['spelling']);
});
