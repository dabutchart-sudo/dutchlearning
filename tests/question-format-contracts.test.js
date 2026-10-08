import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {kinds,makeExercise,correctiveFeedback} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {registerPacks} from '../src/content/registry.js';
import {CAPABILITIES,QUESTION_FORMATS,RELEASE_LEVELS,SUPPORT_LEVELS,formatKinds,questionFormat,validateQuestionFormats} from '../src/engine/question-formats.js';

test('every generated course question kind has one valid format contract',()=>{
 for(const kind of kinds)assert.ok(formatKinds.includes(kind));
 assert.deepEqual(validateQuestionFormats(),[]);
 for(const kind of kinds)assert.equal(questionFormat(kind),QUESTION_FORMATS[kind]);
 assert.equal(questionFormat('unknown'),null);
});

test('the shared evidence and release vocabularies are complete and stable',()=>{
 assert.deepEqual(CAPABILITIES,['recognise','recall','construct','produce','listen','speak','interact','retain']);
 assert.deepEqual(SUPPORT_LEVELS,['independent','supported','revealed']);
 assert.deepEqual(RELEASE_LEVELS,['experimental','practice','trial','core']);
});

test('listening and speaking declare safe fallbacks without overstating their evidence',()=>{
 assert.deepEqual(QUESTION_FORMATS.listening,{...QUESTION_FORMATS.listening,capability:'listen',fallback:'convert-to-choice'});
 assert.deepEqual(QUESTION_FORMATS.speaking,{...QUESTION_FORMATS.speaking,capability:'speak',fallback:'convert-to-typed'});
 assert.match(QUESTION_FORMATS.speaking.notes,/not pronunciation assessment/);
});

test('controlled dialogue is a Practice-only interaction format',()=>{
 assert.deepEqual(QUESTION_FORMATS.dialogue,{...QUESTION_FORMATS.dialogue,capability:'interact',response:'type-contextual-reply',releaseLevel:'practice'});
 assert.deepEqual(QUESTION_FORMATS.dialogue.support,['independent','supported']);
 assert.match(QUESTION_FORMATS.dialogue.notes,/Session-only interaction diagnostics/);
});

test('the registry describes current Core formats but cannot mutate at runtime',()=>{
 assert.ok(kinds.every(kind=>QUESTION_FORMATS[kind].releaseLevel==='core'));
 assert.equal(QUESTION_FORMATS.dialogue.releaseLevel,'practice');
 assert.throws(()=>{QUESTION_FORMATS.choice.releaseLevel='experimental';},TypeError);
 assert.throws(()=>{QUESTION_FORMATS.choice.support.push('revealed');},TypeError);
});

test('invalid contracts fail validation with actionable format names',()=>{
 const invalid={sample:{capability:'guess',releaseLevel:'beta',response:'',roles:[],support:['magic'],fallback:'',attemptEvidence:[]}};
 assert.deepEqual(validateQuestionFormats(invalid),[
  'sample: invalid capability',
  'sample: invalid release level',
  'sample: response is required',
  'sample: at least one role is required',
  'sample: invalid support levels',
  'sample: fallback is required',
  'sample: attempt evidence is required'
 ]);
});

test('sentence-choice distractors are genuinely wrong and explain form or order',()=>{
 const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
 for(const row of content.sentences.filter(item=>item.suitableKinds.includes('correct-sentence'))){
  const q=makeExercise(row,'correct-sentence',content,{seed:row.id});
  assert.equal(q.options.length,3,`${row.id}: sentence choice needs three distinct options`);
  for(const option of q.options.filter(option=>option!==q.answer)){
   assert.notEqual(assess({...q,kind:'typed'},option).grammar,true,`${row.id}: valid Dutch used as a distractor`);
   assert.ok(['verb_form','word_order'].includes(assess(q,option).errorType),`${row.id}: unhelpful distractor feedback`);
  }
 }
 const modal=content.byId['F6-890fef0336ea'];
 const q=makeExercise(modal,'correct-sentence',content,{seed:modal.id});
 assert.ok(!q.options.some(option=>option.includes('Jij kunt')));
 assert.equal(assess(q,'Jij kunt de deur openen.').grammar,true,'a saved older question must accept valid Dutch');
 const wrongForm=q.options.find(option=>assess(q,option).errorType==='verb_form');
 const feedback=correctiveFeedback(q,modal,wrongForm,assess(q,wrongForm));
 assert.match(feedback.explanation,/modal/);
 assert.equal(feedback.meaning,modal.en);
});
