import test from 'node:test';
import assert from 'node:assert/strict';
import {spreadPracticePool} from '../src/engine/scheduler.js';

const item=(id,nl,verb)=>({id,nl,verb});
const exposure=(nl,verb)=>({nl,verb,subject:null,family:null,words:[]});

test('normal practice avoids immediately repeating the same sentence or verb when alternatives exist',()=>{
  const pool=[
    item('write-1','Wij schrijven.','schrijven'),
    item('write-2','Zij schrijven.','schrijven'),
    item('read-1','Ik lees.','lezen')
  ];
  const state={exposures:[exposure('wij schrijven','schrijven'),exposure('zij schrijven','schrijven')]};
  assert.deepEqual(spreadPracticePool(pool,state).map(x=>x.id),['read-1']);
});

test('variation never removes the only usable grammar target',()=>{
  const pool=[item('write-1','Wij schrijven.','schrijven'),item('write-2','Zij schrijven.','schrijven')];
  const state={exposures:[exposure('wij schrijven','schrijven'),exposure('zij schrijven','schrijven')]};
  assert.deepEqual(spreadPracticePool(pool,state).map(x=>x.id),['write-1']);
});

test('focused retry may keep the same verb but still changes the sentence',()=>{
  const pool=[
    item('write-1','Wij schrijven.','schrijven'),
    item('write-2','Zij schrijven.','schrijven'),
    item('read-1','Ik lees.','lezen')
  ];
  const state={exposures:[exposure('wij schrijven','schrijven')]};
  assert.deepEqual(spreadPracticePool(pool,state,{keepVerb:true}).map(x=>x.id),['write-2','read-1']);
});
