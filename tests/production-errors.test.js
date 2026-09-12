import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyProductionError} from '../src/engine/production-errors.js';

test('classifies exact answers as no error',()=>{assert.equal(classifyProductionError('schrijven','Schrijven.'),'none');});
test('classifies small same-shape mistakes as spelling',()=>{assert.equal(classifyProductionError('schrijven','schrjven'),'spelling');assert.equal(classifyProductionError('de man','de mn'),'spelling');assert.equal(classifyProductionError('huis','huus'),'spelling');});
test('short different words are recall rather than spelling',()=>{assert.equal(classifyProductionError('man','kan'),'recall');assert.equal(classifyProductionError('kat','mat'),'recall');});
test('classifies missing or substantially different answers as recall',()=>{assert.equal(classifyProductionError('schrijven',''),'recall');assert.equal(classifyProductionError('schrijven','lezen'),'recall');assert.equal(classifyProductionError('ik schrijf','schrijf'),'recall');});
