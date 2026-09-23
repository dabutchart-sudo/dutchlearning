import test from 'node:test';
import assert from 'node:assert/strict';
import {kinds} from '../src/engine/exercises.js';
import {CAPABILITIES,QUESTION_FORMATS,RELEASE_LEVELS,SUPPORT_LEVELS,formatKinds,questionFormat,validateQuestionFormats} from '../src/engine/question-formats.js';

test('every generated course question kind has one valid format contract',()=>{
 assert.deepEqual([...formatKinds].sort(),[...kinds].sort());
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

test('the registry describes current Core formats but cannot mutate at runtime',()=>{
 assert.ok(kinds.every(kind=>QUESTION_FORMATS[kind].releaseLevel==='core'));
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
