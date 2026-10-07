import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {CONTROLLED_DIALOGUES} from '../src/content/controlled-dialogues.js';
import {freshState} from '../src/engine/learner.js';
import {normalize} from '../src/engine/util.js';
import {answerControlledDialogue,controlledDialogueOffer,controlledDialoguePool,controlledDialogueSummary,currentDialogueTurn,startControlledDialogue} from '../src/engine/controlled-dialogue.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';

const foundation=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-10-07T12:00:00');

function ready(id='S1'){
 const state=freshState(foundation,now);
 const index=foundation.concepts.findIndex(concept=>concept.id===id);
 for(const concept of foundation.concepts.slice(0,index))Object.assign(state.progress[concept.id],{taught:true,lessonAcknowledged:true,practiceAttempts:40,masteredAt:'2026-10-01',status:'mastered'});
 Object.assign(state.progress[id],{taught:true,lessonAcknowledged:true,practiceAttempts:4});
 return state;
}

test('the first controlled dialogue uses only familiar practice responses and no proof sentence',()=>{
 const proof=new Set(foundation.sentences.filter(item=>item.pool!=='practice').map(item=>normalize(item.nl)));
 for(const dialogue of CONTROLLED_DIALOGUES){
  assert.equal(dialogue.turns.length,1,'one learner response creates a bounded two-turn exchange');
  for(const turn of dialogue.turns){
   assert.ok(turn.accepted.length>1,'more than one reply must work');
   for(const response of turn.accepted){
    const source=foundation.byId[response.sourceId];
    assert.equal(source?.concept,dialogue.concept,response.sourceId);
    assert.equal(source?.pool,'practice',response.sourceId);
    assert.equal(normalize(source.nl),normalize(response.nl),response.sourceId);
    assert.equal(proof.has(normalize(response.nl)),false,response.nl);
   }
  }
 }
});

test('only a taught topic with dialogue content offers optional Practice',()=>{
 assert.equal(controlledDialogueOffer(freshState(foundation,now),'S1'),null);
 assert.equal(controlledDialogueOffer(ready('F2'),'F2'),null);
 assert.deepEqual(controlledDialogueOffer(ready(),'S1'),{conceptId:'S1',count:1});
 assert.equal(controlledDialoguePool(ready(),'S1').length,1);
});

test('several appropriate replies earn session-only interaction diagnostics',()=>{
 for(const reply of CONTROLLED_DIALOGUES[0].turns[0].accepted){
  const state=ready(),before=JSON.stringify(state);
  let session=startControlledDialogue(state,{conceptId:'S1'});
  assert.equal(currentDialogueTurn(session).partner.nl,'Wat is het probleem?');
  session=answerControlledDialogue(session,reply.nl.toLowerCase().replace('.',''));
  assert.equal(currentDialogueTurn(session),null);
  assert.deepEqual(session.responses[0],{
   turnIndex:0,answer:reply.nl.toLowerCase().replace('.',''),correct:true,accepted:reply.nl,
   capability:'interact',support:'independent',releaseLevel:'practice',interactionEvidence:true,
   repaired:false,firstAnswer:null,countsTowardProgress:false
  });
  assert.deepEqual(JSON.stringify(state),before);
  assert.equal(state.daily.count,0);
  assert.equal(state.attempts.length,0);
 }
});

test('clarification and phrase help make a correct response supported',()=>{
 let session=startControlledDialogue(ready(),{conceptId:'S1'});
 session=answerControlledDialogue(session,'Ik heb hulp nodig.',{usedClarify:true});
 assert.equal(session.responses[0].support,'supported');
 assert.deepEqual(controlledDialogueSummary(session),{total:1,appropriate:1,independent:0,supported:1,repaired:0,countsTowardProgress:false});

 let repaired=startControlledDialogue(ready(),{conceptId:'S1'});
 repaired=answerControlledDialogue(repaired,'Ik woon in Amsterdam.',{usedPhraseSupport:true});
 repaired=answerControlledDialogue(repaired,'Mijn telefoon werkt niet.');
 assert.equal(repaired.responses[0].support,'supported','support seen before a repair must remain visible to the evidence result');
});

test('one unsuitable reply opens one repair attempt without looping',()=>{
 let session=startControlledDialogue(ready(),{conceptId:'S1'});
 session=answerControlledDialogue(session,'Ik woon in Amsterdam.');
 assert.equal(session.turnIndex,0);
 assert.equal(session.responses.length,0);
 assert.equal(session.repair.answer,'Ik woon in Amsterdam.');
 session=answerControlledDialogue(session,'Mijn telefoon werkt niet.');
 assert.equal(session.turnIndex,1);
 assert.equal(session.responses[0].correct,true);
 assert.equal(session.responses[0].repaired,true);
 assert.equal(session.responses[0].firstAnswer,'Ik woon in Amsterdam.');
 assert.deepEqual(controlledDialogueSummary(session),{total:1,appropriate:1,independent:1,supported:0,repaired:1,countsTowardProgress:false});

 let missed=startControlledDialogue(ready(),{conceptId:'S1'});
 missed=answerControlledDialogue(missed,'Ik woon in Amsterdam.');
 missed=answerControlledDialogue(missed,'Ik lees een boek.');
 assert.equal(missed.responses[0].correct,false);
 assert.equal(currentDialogueTurn(missed),null);
});

test('Practice release has an immediate kill switch and cannot enter the daily session',()=>{
 const disabled={dialogue:{releaseLevel:'practice',enabled:false}};
 assert.equal(controlledDialogueOffer(ready(),'S1',disabled),null);
 assert.throws(()=>startControlledDialogue(ready(),{conceptId:'S1',release:disabled}),/unavailable/);
 for(const file of ['../src/engine/scheduler.js','../src/engine/exercises.js','../src/engine/learner.js']){
  assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/controlled-dialogue|startControlledDialogue/);
 }
});

test('the taught S1 topic offers dialogue Practice without adding it to Course home',()=>{
 const state=ready(),today='2026-10-07';
 const topic=topicPage(state,foundation,'S1',{today});
 assert.match(topic,/OPTIONAL PRACTICE · INTERACTION/);
 assert.match(topic,/Handle a short exchange/);
 assert.match(topic,/id="start-controlled-dialogue"/);
 assert.doesNotMatch(coursePage(state,foundation,{today}),/start-controlled-dialogue/);
 assert.doesNotMatch(topicPage(freshState(foundation,now),foundation,'S1',{today}),/start-controlled-dialogue/);
 assert.doesNotMatch(topicPage(ready('F2'),foundation,'F2',{today}),/start-controlled-dialogue/);
});

test('the phone UI exposes repeat, clarify, phrase support, one repair, and a sticky action',()=>{
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 const slice=app.slice(app.indexOf('function beginControlledDialogue'),app.indexOf('function renderSpeakingTurn'));
 assert.match(slice,/Repeat/);
 assert.match(slice,/Clarify/);
 assert.match(slice,/Phrase support/);
 assert.match(slice,/Try the repair/);
 assert.match(slice,/renderControlledDialogue\(\);notify\('That reply does not fit/);
 assert.match(slice,/More than one Dutch response can work/);
 assert.match(slice,/session-only interaction diagnostic/);
 assert.doesNotMatch(slice,/repo\.save|transaction\(|submit\(/);
 assert.match(app,/on\('start-controlled-dialogue'/);
 const styles=readFileSync(new URL('../src/ui/v51.css',import.meta.url),'utf8');
 assert.match(styles,/\.dialogue-practice-card \.actions\{position:sticky/);
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(worker,/controlled-dialogue\.js/);
 assert.match(worker,/controlled-dialogues\.js/);
});
