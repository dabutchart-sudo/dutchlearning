import test from 'node:test';
import assert from 'node:assert/strict';
import {sentenceGenerationTargets} from '../src/engine/sentence-targets.js';

test('targets due reviews before likely new cards and prioritises troublesome reviews',()=>{
 const cards=[
  {id:1,type:'review',due_date:'2026-09-11',lapses:1},
  {id:2,type:'review',due_date:'2026-09-10',lapses:4},
  {id:3,type:'review',due_date:'2026-09-12',lapses:9},
  {id:4,type:'new',first_seen:null},
  {id:5,type:'new',first_seen:null},
  {id:6,type:'new',first_seen:null},
  {id:7,type:'review',due_date:'2026-09-09',lapses:2,suspended:true},
 ];
 const targets=sentenceGenerationTargets(cards,{today:'2026-09-11',maxNew:2});
 assert.deepEqual(targets.map(card=>card.id),[2,1,4,5]);
});

test('excludes already introduced new cards and respects a zero new-card ceiling',()=>{
 const cards=[
  {id:1,type:'new',first_seen:'2026-09-11'},
  {id:2,type:'new',first_seen:null},
  {id:3,type:'review',due_date:'2026-09-11',lapses:0},
 ];
 assert.deepEqual(sentenceGenerationTargets(cards,{today:'2026-09-11',maxNew:0}).map(card=>card.id),[3]);
});
