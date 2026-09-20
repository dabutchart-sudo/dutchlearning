import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshState} from '../src/engine/learner.js';
import {applyLearningSync,isPopulatedLearningState,mapTrainerAttempt,mergeRemoteAttempts} from '../src/engine/learning-sync.js';

function contentFixture(){
 const concept={id:'A1.TEST',level:'A1',title:'Test concept',rule:'A simple rule.',example:'Ik werk.',translation:'I work.',exampleId:'p1',prerequisites:[],minPractice:40};
 const item={id:'p1',concept:'A1.TEST',pool:'practice',nl:'Ik werk.',en:'I work.',alternatives:[],verb:'werken',subject:'ik',family:'present',verbIndex:1,verbSlots:[1],forms:['werk','werkt','werken'],vocabulary:[{id:'w1',nl:'werken',en:'to work',mature:false}]};
 return {concepts:[concept],sentences:[item],conceptById:{'A1.TEST':concept},byId:{p1:item}};
}

const content=contentFixture();
const now=new Date('2026-09-18T12:00:00');
const user={id:'user-1'};
const empty=()=>{const s=freshState(content,now);s.revision=0;return s;};
const populated=(revision=50)=>{
 const s=empty();
 s.revision=revision;
 s.attempts=[{id:'11111111-1111-1111-1111-111111111111',date:'2026-09-10',concept:'A1.TEST'}];
 s.progress['A1.TEST'].practiceAttempts=12;
 return s;
};
const apply=(local,remote,opts={})=>applyLearningSync({user:opts.user===undefined?user:opts.user,local,remote,content:opts.content===undefined?content:opts.content});

test('empty local revision 0 downloads populated remote revision 50 and does not upload',()=>{
 const result=apply(empty(),{state:populated(50),updated_at:'2026-09-10T12:00:00.000Z'});
 assert.equal(result.action,'download');
 assert.equal(result.writeLocal,true);
 assert.equal(result.writeRemote,false);
 assert.equal(result.pushAttempts,false);
 assert.equal(result.state.revision,50);
 assert.equal(result.state.attempts.length,1);
});

test('empty local downloads populated remote with missing revision instead of treating local 0 as newer',()=>{
 const remoteState=populated(50);delete remoteState.revision;
 const result=apply(empty(),{state:remoteState,updated_at:'2026-09-10T12:00:00.000Z'});
 assert.equal(result.action,'download');
 assert.equal(result.writeRemote,false);
 assert.equal(isPopulatedLearningState(result.state),true);
});

test('empty local with a higher revision still loses to populated remote with a lower revision',()=>{
 const local=empty();local.revision=9;
 const result=apply(local,{state:populated(1),updated_at:'2026-09-10T12:00:00.000Z'});
 assert.equal(result.action,'download');
 assert.equal(result.writeRemote,false);
 assert.equal(result.state.revision,1);
});

test('empty local with no remote row is not uploaded because the app opened',()=>{
 assert.deepEqual(apply(empty(),null),{action:'none',reason:'empty-local-no-remote',writeLocal:false,writeRemote:false,pushAttempts:false});
 assert.deepEqual(apply(null,null),{action:'none',reason:'empty-local-no-remote',writeLocal:false,writeRemote:false,pushAttempts:false});
});

test('populated local with no remote row is uploaded',()=>{
 const local=populated(12);
 const result=apply(local,null);
 assert.equal(result.action,'upload');
 assert.equal(result.writeLocal,false);
 assert.equal(result.writeRemote,true);
 assert.equal(result.pushAttempts,true);
 assert.equal(result.state,local);
});

test('both populated uses remote revision when it is higher',()=>{
 const result=apply(populated(10),{state:populated(40),updated_at:'2026-09-10T12:00:00.000Z'});
 assert.equal(result.action,'download');
 assert.equal(result.writeRemote,false);
 assert.equal(result.state.revision,40);
});

test('signed-out getUser null never writes local or remote state',()=>{
 const result=apply(empty(),{state:populated(50)},{user:null});
 assert.equal(result.action,'none');
 assert.equal(result.reason,'signed-out');
 assert.equal(result.writeLocal,false);
 assert.equal(result.writeRemote,false);
 assert.equal(result.pushAttempts,false);
});

test('invalid populated remote is not applied locally and is not uploaded over',()=>{
 const remoteState=populated(50);
 remoteState.schemaVersion=4;
 const local=empty();
 const result=apply(local,{state:remoteState,updated_at:'2026-09-10T12:00:00.000Z'});
 assert.equal(result.action,'none');
 assert.equal(result.reason,'invalid-remote');
 assert.equal(result.writeLocal,false);
 assert.equal(result.writeRemote,false);
 assert.equal(result.pushAttempts,false);
});

test('both populated with a higher local revision still uploads',()=>{
 const result=apply(populated(20),{state:populated(4),updated_at:'2026-09-01T12:00:00.000Z'});
 assert.equal(result.action,'upload');
 assert.equal(result.writeRemote,true);
 assert.equal(result.writeLocal,false);
});

test('equal populated revisions only push attempts',()=>{
 const result=apply(populated(8),{state:populated(8),updated_at:'2026-09-10T12:00:00.000Z'});
 assert.equal(result.action,'push-attempts');
 assert.equal(result.writeLocal,false);
 assert.equal(result.writeRemote,false);
 assert.equal(result.pushAttempts,true);
});

test('remote trainer_attempts rows are mapped and merged into local Learning history',()=>{
 const local=populated(8);
 const row={id:'22222222-2222-2222-2222-222222222222',day:'2026-09-20',attempted_at:'2026-09-20T16:00:00.000Z',concept_id:'A1.TEST',exercise_type:'listening',direction:'nl-en',phase:'practice',source_id:'p1',answer:'I work.',correct_answer:'I work.',grammar_correct:true,spelling_correct:null,used_help:false};
 assert.deepEqual(mapTrainerAttempt(row),{id:row.id,date:'2026-09-20',occurredAt:row.attempted_at,concept:'A1.TEST',kind:'listening',direction:'nl-en',phase:'practice',sourceId:'p1',answer:'I work.',expected:'I work.',grammar:true,spelling:null,assisted:false});
 const merged=mergeRemoteAttempts(local,[row,{id:local.attempts[0].id,day:'2026-09-10'}]);
 assert.equal(merged.added,1);
 assert.equal(merged.state.attempts.length,2);
 assert.equal(merged.state.attempts.at(-1).kind,'listening');
 assert.equal(mergeRemoteAttempts(null,[row]).added,0);
});

test('v51 uses the Learning sync safety policy and no longer returns before a download',()=>{
 const source=readFileSync(new URL('../src/ui/v51.js',import.meta.url),'utf8');
 assert.match(source,/applyLearningSync/);
 assert.match(source,/mergeRemoteAttempts/);
 assert.match(source,/from\('trainer_attempts'\)\.select\(/);
 assert.doesNotMatch(source,/const local=localState\(\);if\(!local\)return/);
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(sw,/src\/engine\/learning-sync\.js/);
});
