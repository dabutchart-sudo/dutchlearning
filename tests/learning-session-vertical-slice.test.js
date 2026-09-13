import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,prepareQuestion,teachConcept,markWordsTaught} from '../src/engine/learner.js';

function sentence(id,nl,en,subject='ik'){
  return {
    id,
    concept:'A1.TEST',
    pool:'practice',
    nl,
    en,
    verb:'werken',
    subject,
    family:'present',
    verbIndex:1,
    forms:['werk','werkt','werken'],
    alternatives:[],
    vocabulary:[
      {id:`${id}:subject`,nl:subject,en:subject==='ik'?'I':subject,mature:false},
      {id:`${id}:verb`,nl:nl.split(' ')[1],en:'work',mature:false}
    ]
  };
}

function fixture(){
  const sentences=[
    sentence('s1','Ik werk vandaag.','I work today.'),
    sentence('s2','Jij werkt vandaag.','You work today.','jij'),
    sentence('s3','Wij werken samen.','We work together.','wij'),
    sentence('s4','Zij werkt thuis.','She works at home.','zij')
  ];
  const concept={
    id:'A1.TEST',
    level:'A1',
    title:'Present tense',
    rule:'Use the present tense for what happens now.',
    example:'Ik werk vandaag.',
    translation:'I work today.',
    exampleId:'s1',
    prerequisites:[],
    minPractice:40
  };
  return {
    concepts:[concept],
    sentences,
    conceptById:{'A1.TEST':concept},
    byId:Object.fromEntries(sentences.map(item=>[item.id,item]))
  };
}

const today=new Date('2026-09-13T12:00:00Z');

test('a new concept begins with an explicit unscored teaching step',()=>{
  const content=fixture();
  const state=freshState(content,today);
  const next=prepareQuestion(state,content,today,false);

  assert.deepEqual(next,{teachingConcept:'A1.TEST'});
  assert.equal(state.progress['A1.TEST'].taught,false);
  assert.equal(state.progress['A1.TEST'].lessonAcknowledged,false);
  assert.equal(state.pending,null);
  assert.equal(state.daily.count,0);
});

test('legacy automatic taught state with zero practice still opens the guided lesson',()=>{
  const content=fixture();
  const state=freshState(content,today);
  const progress=state.progress['A1.TEST'];

  // This mirrors progress written by older builds: taught was set automatically,
  // but the learner had not completed a scored question or explicitly seen the new lesson flow.
  progress.taught=true;
  delete progress.lessonAcknowledged;
  progress.practiceAttempts=0;

  const next=prepareQuestion(state,content,today,false);
  assert.deepEqual(next,{teachingConcept:'A1.TEST'});
  assert.equal(state.pending,null);
  assert.equal(state.daily.count,0);
});

test('acknowledging the lesson advances to recognition without silently teaching vocabulary',()=>{
  const content=fixture();
  const state=freshState(content,today);
  teachConcept(state,'A1.TEST',content);

  assert.equal(state.progress['A1.TEST'].lessonAcknowledged,true);
  const question=prepareQuestion(state,content,today,false);

  assert.equal(question.phase,'practice');
  assert.equal(question.kind,'choice');
  assert.equal(question.direction,'nl-en');
  assert.equal(Object.keys(state.words).length,0);

  const item=content.byId[question.sourceId];
  markWordsTaught(state,item,'2026-09-13');
  assert.ok(item.vocabulary.every(word=>state.words[word.id].taughtAt==='2026-09-13'));
});

test('the existing scheduler then moves from recognition to construction and production',()=>{
  const content=fixture();
  const state=freshState(content,today);
  const progress=state.progress['A1.TEST'];
  teachConcept(state,'A1.TEST',content);

  progress.recognised=4;
  progress.practiceAttempts=4;
  let question=prepareQuestion(state,content,today,false);
  assert.ok(['wordbank','gap','form'].includes(question.kind));

  state.pending=null;
  progress.constructed=4;
  progress.practiceAttempts=10;
  question=prepareQuestion(state,content,today,false);
  assert.equal(question.kind,'typed');
  assert.equal(question.direction,'en-nl');
});
