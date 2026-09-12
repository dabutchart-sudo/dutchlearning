import test from 'node:test';
import assert from 'node:assert/strict';
import {contextualMaintenanceStatus,contextualRecallCandidates,contextualProofSummary,CONTEXTUAL_MAINTENANCE_DAYS} from '../src/engine/contextual-recall.js';
import {PRODUCTION_STAGE} from '../src/engine/flashcards.js';

const card=(id)=>({id,dutch:`woord${id}`,english:`word ${id}`,partofword:'noun',type:'review',interval:120,ease:2.5,reps:12,lapses:0,first_seen:'2026-06-01',last_reviewed:'2026-09-01',due_date:'2026-12-01',suspended:false,dutch_sentence:`Ik gebruik woord${id} vandaag.`,english_sentence:`I use word ${id} today.`});
const readyWords=(ids)=>Object.fromEntries(ids.map(id=>[`card:${id}`,{guidedSuccesses:2,independentSuccesses:5,weakness:0}]));
const ctx=(cardId,date,expected)=>({cardId:String(cardId),date,stage:PRODUCTION_STAGE.CONTEXTUAL,meaningful:true,correct:true,expected});
const course=(cardId,date,correctSentence)=>({words:[`card:${cardId}`],date,occurredAt:`${date}T08:00:00Z`,direction:'en-nl',independent:true,grammar:true,spelling:true,assisted:false,correctSentence});

function provenState(lastDate='2026-09-10'){
 return {words:readyWords([1]),flashcardProduction:{attempts:[ctx(1,'2026-09-01','Ik gebruik woord1 vandaag.'),ctx(1,lastDate,'Morgen gebruik ik woord1 opnieuw.')]},attempts:[]};
}

test('proven contextual words rest until the maintenance interval is due',()=>{
 assert.equal(CONTEXTUAL_MAINTENANCE_DAYS,14);
 const s=provenState('2026-09-10');
 const early=contextualMaintenanceStatus(s,1,'2026-09-20');
 assert.equal(early.evidence.proven,true);
 assert.equal(early.due,false);
 assert.equal(early.nextDue,'2026-09-24');
 assert.equal(contextualRecallCandidates([card(1)],s,{today:'2026-09-20'}).length,0);
 const due=contextualMaintenanceStatus(s,1,'2026-09-24');
 assert.equal(due.due,true);
 assert.equal(due.daysSince,14);
 assert.equal(contextualRecallCandidates([card(1)],s,{today:'2026-09-24'}).length,1);
});

test('developing contextual words remain available without waiting for maintenance',()=>{
 const s={words:readyWords([1]),flashcardProduction:{attempts:[ctx(1,'2026-09-10','Ik gebruik woord1 vandaag.')]},attempts:[]};
 assert.equal(contextualMaintenanceStatus(s,1,'2026-09-11').evidence.proven,false);
 assert.equal(contextualRecallCandidates([card(1)],s,{today:'2026-09-11'}).length,1);
});

test('qualifying Course evidence today prevents duplicate same-day contextual practice',()=>{
 const s={words:readyWords([1]),flashcardProduction:{attempts:[]},attempts:[course(1,'2026-09-11','Ik gebruik woord1 in de les.')]};
 assert.equal(contextualRecallCandidates([card(1)],s,{today:'2026-09-11'}).length,0);
});

test('Course evidence resets the maintenance clock for a proven word',()=>{
 const s=provenState('2026-09-10');
 s.attempts.push(course(1,'2026-09-20','In de les gebruik ik woord1 vaak.'));
 const status=contextualMaintenanceStatus(s,1,'2026-09-25');
 assert.equal(status.evidence.proven,true);
 assert.equal(status.evidence.lastSource,'course');
 assert.equal(status.due,false);
 assert.equal(status.nextDue,'2026-10-04');
});

test('proof summary separates proven words resting from maintenance-due words',()=>{
 const s={words:readyWords([1,2]),flashcardProduction:{attempts:[ctx(1,'2026-09-01','Ik gebruik woord1 vandaag.'),ctx(1,'2026-09-02','Morgen gebruik ik woord1 opnieuw.'),ctx(2,'2026-09-15','Ik gebruik woord2 vandaag.'),ctx(2,'2026-09-16','Morgen gebruik ik woord2 opnieuw.')]},attempts:[]};
 const summary=contextualProofSummary([card(1),card(2)],s,{today:'2026-09-20'});
 assert.equal(summary.proven,2);
 assert.equal(summary.maintenanceDue,1);
 assert.equal(summary.resting,1);
});
