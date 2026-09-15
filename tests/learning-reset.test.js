import test from 'node:test';
import assert from 'node:assert/strict';
import {createRepository,STORAGE_KEY} from '../src/engine/persistence.js';

class MemoryStorage{
 constructor(entries={}){this.map=new Map(Object.entries(entries));}
 getItem(key){return this.map.has(key)?this.map.get(key):null;}
 setItem(key,value){this.map.set(key,String(value));}
 removeItem(key){this.map.delete(key);}
 clear(){this.map.clear();}
}

const content={concepts:[{id:'F1'}],byId:{},conceptById:{F1:{id:'F1'}}};
const now=new Date('2026-09-13T12:00:00Z');

test('Learning reset returns the course to genuine Day 1 while preserving app identity and settings',()=>{
 const storage=new MemoryStorage();
 const repo=createRepository(storage,content,{now:()=>now});
 const before=repo.load();
 before.settings={listening:true,debugDate:'2026-12-31'};
 before.progress.F1={...before.progress.F1,taught:true,lessonAcknowledged:true,practiceAttempts:7,recognised:4,constructed:2,independent:1,weakness:3,remedial:2,retentionDue:'2026-09-20',proofHistory:[{passed:false}]};
 before.attempts=[{id:'attempt-1'}];
 before.exposures=[{id:'sentence-1',nl:'ik ben hier'}];
 before.words={w1:{taughtAt:'2026-09-13',weakness:4}};
 before.wordStruggles={w1:{count:2}};
 before.retries=[{id:'retry-1'}];
 before.daily={date:'2026-09-13',count:7};
 before.pending={id:'pending-1',sourceId:'unused'};
 before.proof={id:'proof-1',questions:[]};
 before.lastProof={id:'last-proof'};
 before.migration={from:'test'};
 const learnerId=before.learnerId,deviceId=before.deviceId;
 // Pending source references are validated, so clear the synthetic pending item before saving.
 before.pending=null;
 repo.save(before);

 const after=repo.resetLearning();
 assert.equal(after.learnerId,learnerId);
 assert.equal(after.deviceId,deviceId);
 assert.equal(after.settings.listening,true);
 assert.equal('debugDate' in after.settings,false);
 assert.equal(after.daily.count,0);
 assert.equal(after.daily.date,'2026-09-13');
 assert.deepEqual(after.attempts,[]);
 assert.deepEqual(after.exposures,[]);
 assert.deepEqual(after.words,{});
 assert.deepEqual(after.wordStruggles,{});
 assert.deepEqual(after.retries,[]);
 assert.equal(after.pending,null);
 assert.equal(after.proof,null);
 assert.equal(after.lastProof,null);
 assert.equal(after.migration,null);
 assert.equal(after.progress.F1.status,'learning');
 assert.equal(after.progress.F1.taught,false);
 assert.equal(after.progress.F1.lessonAcknowledged,false);
 assert.equal(after.progress.F1.practiceAttempts,0);
 assert.equal(after.progress.F1.masteredAt,null);
 assert.equal(after.progress.F1.retentionDue,null);
});

test('Learning reset writes only the Learning storage key and leaves unrelated Flashcard/Supabase data untouched',()=>{
 const flashcards='[{"id":101,"dutch":"schrijven","leitner_level":4}]';
 const supabase='{"access_token":"sentinel-session"}';
 const preferences='{"maxNew":5}';
 const storage=new MemoryStorage({
  flashcards_srs_cache:flashcards,
  supabase_auth_session:supabase,
  flashcard_settings:preferences
 });
 const repo=createRepository(storage,content,{now:()=>now});
 const state=repo.load();
 state.attempts=[{id:'development-attempt'}];
 state.daily.count=7;
 repo.save(state);

 repo.resetLearning();
 assert.ok(storage.getItem(STORAGE_KEY));
 assert.equal(storage.getItem('flashcards_srs_cache'),flashcards);
 assert.equal(storage.getItem('supabase_auth_session'),supabase);
 assert.equal(storage.getItem('flashcard_settings'),preferences);
});
