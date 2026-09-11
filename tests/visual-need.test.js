import test from 'node:test';
import assert from 'node:assert/strict';
import {visualNeedForRecord,visualNeedSummary,VISUAL_NEED_RECALL_DAYS} from '../src/engine/visual-need.js';
import {PRODUCTION_STAGE} from '../src/engine/flashcards.js';

const record=(id=1,overrides={})=>({id,dutch:'deur',english:'door',image_url:'',...overrides});
const miss=(date,errorType='recall')=>({cardId:'1',date,stage:PRODUCTION_STAGE.INDEPENDENT,meaningful:true,correct:false,errorType,expected:'deur',answer:errorType==='spelling'?'duer':'tafel'});
const success=date=>({cardId:'1',date,stage:PRODUCTION_STAGE.INDEPENDENT,meaningful:true,correct:true,errorType:'none',expected:'deur',answer:'deur'});

test('requires unresolved recall misses on at least two different days before flagging visual need',()=>{
 const state={flashcardProduction:{attempts:[miss('2026-09-09'),miss('2026-09-10')]}};
 const need=visualNeedForRecord(record(),state,{today:'2026-09-11'});
 assert.equal(VISUAL_NEED_RECALL_DAYS,2);
 assert.equal(need.needed,true);
 assert.equal(need.recallMissDays,2);
 assert.equal(need.requiresSuitabilityCheck,true);
});

test('multiple recall misses on one day are not enough to trigger image generation review',()=>{
 const state={flashcardProduction:{attempts:[miss('2026-09-10'),miss('2026-09-10')]}};
 assert.equal(visualNeedForRecord(record(),state,{today:'2026-09-11'}).needed,false);
});

test('spelling slips do not create visual-support demand',()=>{
 const state={flashcardProduction:{attempts:[miss('2026-09-09','spelling'),miss('2026-09-10','spelling')]}};
 assert.equal(visualNeedForRecord(record(),state,{today:'2026-09-11'}).needed,false);
});

test('a later successful independent recall clears unresolved visual need',()=>{
 const state={flashcardProduction:{attempts:[miss('2026-09-08'),miss('2026-09-09'),success('2026-09-10')]}};
 const need=visualNeedForRecord(record(),state,{today:'2026-09-11'});
 assert.equal(need.needed,false);
 assert.equal(need.reason,'recovered');
});

test('cards that already have a valid image are never queued for generation review',()=>{
 const state={flashcardProduction:{attempts:[miss('2026-09-09'),miss('2026-09-10')]}};
 const need=visualNeedForRecord(record(1,{image_url:'https://images.example.com/door.jpg'}),state,{today:'2026-09-11'});
 assert.equal(need.needed,false);
 assert.equal(need.reason,'image-available');
});

test('summary exposes only genuine unresolved candidates and counts existing images',()=>{
 const state={flashcardProduction:{attempts:[miss('2026-09-09'),miss('2026-09-10')]}};
 const summary=visualNeedSummary([record(),record(2,{dutch:'huis',image_url:'https://images.example.com/house.jpg'})],state,{today:'2026-09-11'});
 assert.equal(summary.candidates,1);
 assert.equal(summary.withImages,1);
 assert.equal(summary.candidateRecords[0].record.dutch,'deur');
});
