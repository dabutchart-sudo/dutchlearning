import test from 'node:test';
import assert from 'node:assert/strict';
import {applySupportTracking} from '../src/engine/support-tracking.js';

test('showing then completing visual support counts one visual support and one encounter',()=>{
 const word={supportedEncounters:0};
 applySupportTracking(word,'visual',{shown:true});
 applySupportTracking(word,'visual',{completed:true});
 assert.equal(word.visualSupports,1);
 assert.equal(word.supportedEncounters,1);
});

test('showing then completing spelling support counts one spelling support and one encounter',()=>{
 const word={supportedEncounters:0};
 applySupportTracking(word,'spelling',{shown:true});
 applySupportTracking(word,'spelling',{completed:true});
 assert.equal(word.spellingSupports,1);
 assert.equal(word.supportedEncounters,1);
});

test('completion does not increment the support-type counter a second time',()=>{
 const word={visualSupports:2,spellingSupports:3,supportedEncounters:4};
 applySupportTracking(word,'visual',{completed:true});
 assert.deepEqual(word,{visualSupports:2,spellingSupports:3,supportedEncounters:5});
});
