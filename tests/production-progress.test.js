import test from 'node:test';
import assert from 'node:assert/strict';
import {productionProgress} from '../src/engine/production-progress.js';
import {PRODUCTION_STAGE} from '../src/engine/flashcards.js';

const attempt=(overrides={})=>({cardId:'1',date:'2026-09-11',stage:PRODUCTION_STAGE.GUIDED,meaningful:true,correct:true,prompt:'to write',expected:'schrijven',...overrides});

test('summarises meaningful production attempts inside the requested window',()=>{const state={flashcardProduction:{attempts:[attempt(),attempt({cardId:'2',correct:false}),attempt({cardId:'3',date:'2026-08-01'}),attempt({cardId:'4',meaningful:false})]}};const p=productionProgress(state,{today:'2026-09-11',days:14});assert.equal(p.total,2);assert.equal(p.correct,1);assert.equal(p.rate,.5);assert.equal(p.byStage[PRODUCTION_STAGE.GUIDED].total,2);assert.equal(p.byStage[PRODUCTION_STAGE.GUIDED].correct,1);});

test('keeps stage measures separate',()=>{const state={flashcardProduction:{attempts:[attempt({stage:PRODUCTION_STAGE.SUPPORTED}),attempt({cardId:'2',stage:PRODUCTION_STAGE.INDEPENDENT,correct:false})]}};const p=productionProgress(state,{today:'2026-09-11'});assert.equal(p.byStage[PRODUCTION_STAGE.SUPPORTED].rate,1);assert.equal(p.byStage[PRODUCTION_STAGE.INDEPENDENT].rate,0);assert.equal(p.byStage[PRODUCTION_STAGE.GUIDED].rate,null);});

test('recent misses are unique by word and retain the latest miss',()=>{const state={flashcardProduction:{attempts:[attempt({cardId:'1',date:'2026-09-09',correct:false,prompt:'old'}),attempt({cardId:'1',date:'2026-09-11',correct:false,prompt:'latest'}),attempt({cardId:'2',date:'2026-09-10',correct:false})]}};const p=productionProgress(state,{today:'2026-09-11'});assert.equal(p.recentMisses.length,2);assert.equal(p.recentMisses[0].cardId,'1');assert.equal(p.recentMisses[0].prompt,'latest');});

test('returns a fixed seven-day evidence series including quiet days',()=>{const state={flashcardProduction:{attempts:[attempt({date:'2026-09-05'}),attempt({cardId:'2',date:'2026-09-09',correct:false}),attempt({cardId:'3',date:'2026-09-09'}),attempt({cardId:'4',date:'2026-09-11'})]}};const p=productionProgress(state,{today:'2026-09-11',days:14});assert.equal(p.daily.length,7);assert.equal(p.daily[0].date,'2026-09-05');assert.deepEqual(p.daily.find(d=>d.date==='2026-09-09'),{date:'2026-09-09',total:2,correct:1,rate:.5});assert.deepEqual(p.daily.find(d=>d.date==='2026-09-10'),{date:'2026-09-10',total:0,correct:0,rate:null});});
