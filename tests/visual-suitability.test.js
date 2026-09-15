import test from 'node:test';
import assert from 'node:assert/strict';
import {visualSuitabilityForRecord,canRequestVisualSemanticCheck} from '../src/engine/visual-suitability.js';

test('blocks function words from automatic visual-generation review',()=>{
 for(const partofword of ['article','conjunction','preposition','pronoun','determiner']){
  const result=visualSuitabilityForRecord({dutch:'voorbeeld',partofword});
  assert.equal(result.status,'blocked');
  assert.equal(result.requiresSemanticCheck,false);
  assert.equal(canRequestVisualSemanticCheck({partofword}),false);
 }
});

test('content words are sent to semantic review rather than assumed to be image-worthy',()=>{
 for(const partofword of ['noun','verb','adjective','adverb']){
  const result=visualSuitabilityForRecord({dutch:'deur',partofword});
  assert.equal(result.status,'review');
  assert.equal(result.requiresSemanticCheck,true);
  assert.equal(canRequestVisualSemanticCheck({partofword}),true);
 }
});

test('unknown word types stay reviewable instead of being silently blocked',()=>{
 const result=visualSuitabilityForRecord({dutch:'deur'});
 assert.equal(result.status,'review');
 assert.equal(result.reason,'unknown-word-type');
});

test('explicit suitability metadata can override the conservative gate',()=>{
 assert.equal(visualSuitabilityForRecord({partofword:'preposition',visual_suitability:true}).status,'suitable');
 assert.equal(visualSuitabilityForRecord({partofword:'noun',visual_suitability:false}).status,'blocked');
});
