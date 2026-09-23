import test from 'node:test';
import assert from 'node:assert/strict';
import {QUESTION_FORMATS} from '../src/engine/question-formats.js';
import {FORMAT_CONTEXTS,formatAvailable,formatRelease,setFormatEnabled,transitionFormatRelease} from '../src/engine/format-release.js';

test('current Core formats remain available in every release context by default',()=>{
 assert.deepEqual(FORMAT_CONTEXTS,['experimental','practice','trial','core']);
 for(const context of FORMAT_CONTEXTS)assert.equal(formatAvailable('choice',context),true);
});

test('a Practice format stays optional and cannot enter Trial or Core scheduling',()=>{
 const overrides={listening:{releaseLevel:'practice'}};
 assert.equal(formatAvailable('listening','experimental',overrides),true);
 assert.equal(formatAvailable('listening','practice',overrides),true);
 assert.equal(formatAvailable('listening','trial',overrides),false);
 assert.equal(formatAvailable('listening','core',overrides),false);
 assert.equal(QUESTION_FORMATS.listening.releaseLevel,'core');
});

test('the kill switch disables a format in every context without mutating its contract',()=>{
 const overrides={listening:{releaseLevel:'practice',enabled:false}};
 for(const context of FORMAT_CONTEXTS)assert.equal(formatAvailable('listening',context,overrides),false);
 assert.equal(QUESTION_FORMATS.listening.releaseLevel,'core');
});

test('promotion is sequential and requires owner acceptance while rollback is immediate',()=>{
 const experimental=formatRelease('listening',{listening:{releaseLevel:'experimental'}});
 assert.throws(()=>transitionFormatRelease(experimental,'practice'),/owner acceptance/);
 const practice=transitionFormatRelease(experimental,'practice',{ownerAccepted:true});
 assert.equal(practice.releaseLevel,'practice');
 assert.throws(()=>transitionFormatRelease(practice,'core',{ownerAccepted:true}),/one release level/);
 const trial=transitionFormatRelease(practice,'trial',{ownerAccepted:true});
 const rolledBack=transitionFormatRelease(trial,'experimental');
 assert.equal(rolledBack.releaseLevel,'experimental');
});

test('release controls reject unknown formats, levels, contexts and invalid switches',()=>{
 assert.throws(()=>formatRelease('imaginary'),/Unknown question format/);
 assert.throws(()=>formatRelease('choice',{choice:{releaseLevel:'beta'}}),/Unknown format release level/);
 assert.throws(()=>formatAvailable('choice','daily'),/Unknown format context/);
 assert.throws(()=>setFormatEnabled(formatRelease('choice'),'yes'),/true or false/);
});
