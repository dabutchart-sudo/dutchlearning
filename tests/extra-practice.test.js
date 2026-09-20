import test from 'node:test';
import assert from 'node:assert/strict';
import {createRepository} from '../src/engine/persistence.js';
import {freshState,prepareQuestion,prepareExtraQuestion,startExtraPractice,extraPracticeEligibility,releaseExtraPractice,submit,EXTRA_PRACTICE_SIZE,DAY_SIZE} from '../src/engine/learner.js';
import {learningProgress} from '../src/engine/course-progress.js';

const item=(id,nl,en)=>({id,concept:'T1',pool:'practice',nl,en,verb:'zijn',verbIndex:1,verbSlots:[1],forms:['ben','bent','is','zijn'],subject:'Ik',family:'T1:zijn',vocabulary:[{id:'t1:zijn',nl:'zijn',en:'be',mature:false}]});
const content={
 concepts:[{id:'T1',title:'Test',level:'A1',prerequisites:[],minPractice:40,rule:'Test',example:'Ik ben thuis.',translation:'I am at home.'}],
 sentences:[item('t1-p-01','Ik ben thuis.','I am at home.'),item('t1-p-02','Ik ben moe.','I am tired.'),item('t1-p-03','Ik ben klaar.','I am ready.'),item('t1-p-04','Ik ben hier.','I am here.'),item('t1-p-05','Ik ben vroeg.','I am early.'),item('t1-p-06','Ik ben laat.','I am late.')],
};
content.byId=Object.fromEntries(content.sentences.map(x=>[x.id,x]));
content.conceptById=Object.fromEntries(content.concepts.map(x=>[x.id,x]));

function retained(now=new Date('2026-09-20T12:00:00Z')){
 const s=freshState(content,now);
 Object.assign(s.progress.T1,{status:'mastered',masteredAt:'2026-09-19',taught:true,lessonAcknowledged:true,practiceAttempts:40,nextMaintenance:'2099-01-01'});
 return {s,now};
}

test('extra practice is only for retained topics and is blocked by a daily pending question',()=>{
 const {s}=retained();
 s.progress.T1.masteredAt=null;s.progress.T1.status='learning';
 assert.match(extraPracticeEligibility(s,'T1'),/retained/);
 const ready=retained().s;
 ready.pending={id:'daily',phase:'practice',sourceId:'t1-p-01'};
 assert.match(extraPracticeEligibility(ready,'T1'),/current question/);
 ready.pending=null;ready.proof={id:'p'};
 assert.match(extraPracticeEligibility(ready,'T1'),/test already in progress/);
});

test('a finished extra batch does not use the daily 20 or change mastery',()=>{
 const {s,now}=retained();
 startExtraPractice(s,'T1',now);
 assert.equal(s.extra.remaining,EXTRA_PRACTICE_SIZE);
 const before=s.progress.T1.practiceAttempts,retries=s.retries.length;
 for(let i=0;i<EXTRA_PRACTICE_SIZE;i++){
  const q=prepareExtraQuestion(s,content,now,false);
  assert.equal(q.phase,'extra');
  submit(s,content,q.id,q.answer,now);
 }
 assert.equal(s.daily.count,0);
 assert.equal(s.extra,null);
 assert.equal(s.progress.T1.practiceAttempts,before);
 assert.equal(s.progress.T1.masteredAt,'2026-09-19');
 assert.equal(s.retries.length,retries);
 assert.equal(s.attempts.filter(a=>a.phase==='extra').length,EXTRA_PRACTICE_SIZE);
 assert.equal(prepareExtraQuestion(s,content,now,false),null);
});

test('daily prepare stays finished at 20 even after extra practice that day',()=>{
 const {s,now}=retained();
 s.daily.count=DAY_SIZE;
 startExtraPractice(s,'T1',now);
 const q=prepareExtraQuestion(s,content,now,false);
 submit(s,content,q.id,q.answer,now);
 assert.equal(s.daily.count,DAY_SIZE);
 assert.equal(prepareQuestion(s,content,now,false),null);
});

test('extra attempts do not refill daily count when a save is restored',()=>{
 const {s,now}=retained();
 startExtraPractice(s,'T1',now);
 const q=prepareExtraQuestion(s,content,now,false);
 submit(s,content,q.id,q.answer,now);
 const storage=new Map();
 const repo=createRepository({getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},content,{key:'extra-practice-test',now:()=>now});
 repo.save(s);
 const loaded=repo.load();
 assert.equal(loaded.daily.count,0);
 assert.equal(loaded.attempts.filter(a=>a.phase==='extra').length,1);
});

test('extra answers stay out of Course evidence totals',()=>{
 const {s,now}=retained();
 startExtraPractice(s,'T1',now);
 const q=prepareExtraQuestion(s,content,now,false);
 submit(s,content,q.id,q.answer,now);
 const progress=learningProgress(s,{today:'2026-09-20',days:30,cohort:'all'});
 assert.equal(progress.todayTotal,0);
 assert.equal(progress.total,0);
});

test('leaving extra practice clears the extra pending question',()=>{
 const {s,now}=retained();
 startExtraPractice(s,'T1',now);
 prepareExtraQuestion(s,content,now,false);
 releaseExtraPractice(s);
 assert.equal(s.extra,null);
 assert.equal(s.pending,null);
});
