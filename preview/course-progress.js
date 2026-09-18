import {registerPacks} from '../src/content/registry.js';
import {freshState,markWordsTaught} from '../src/engine/learner.js';
import {makeExercise} from '../src/engine/exercises.js';
import {dayKey,addDays} from '../src/engine/util.js';
import {STORAGE_KEY} from '../src/engine/persistence.js';

// Local-only, synthetic demonstration. Do not load authentication, Flashcards,
// reporting connectors, or any remote integrations in this preview entry point.
if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('This demo is local-only.');
if(localStorage.getItem(STORAGE_KEY)&&localStorage.getItem('zin-course-demo')!=='sample-data-only')throw Error('Existing learner data found on this origin. Use a new local port for this preview.');
const pack=await (await fetch('../src/content/foundation-a1.json')).json(),content=registerPacks([pack]);
const scenario=new URLSearchParams(location.search).get('scenario')||'progress';
const date=dayKey(),state=freshState(content),recent=addDays(date,-1);
function retain(id,when){Object.assign(state.progress[id],{taught:true,lessonAcknowledged:true,practiceAttempts:40,recognised:10,constructed:12,independent:16,status:'mastered',masteredAt:when,nextMaintenance:addDays(date,7)});}
if(scenario==='progress'||scenario==='retention'){
 if(scenario==='progress'){
  retain('F1',addDays(date,-7));retain('F2',addDays(date,-3));
  Object.assign(state.progress.F3,{taught:true,lessonAcknowledged:true,practiceAttempts:24,recognised:8,constructed:8,independent:8});
 }else Object.assign(state.progress.F1,{taught:true,lessonAcknowledged:true,practiceAttempts:40,status:'retention-wait',retentionDue:date});
 for(let day=13;day>=0;day--){
  if(day===9||day===4)continue;
  for(let i=0;i<12;i++){
   const independent=i<7,assisted=i===7,concept=day>7?'F1':day>3?'F2':'F3';
   state.attempts.push({id:`demo-${day}-${i}`,date:addDays(date,-day),occurredAt:addDays(date,-day)+`T12:${String(i).padStart(2,'0')}:00Z`,concept:scenario==='retention'?'F1':concept,phase:'practice',kind:independent||assisted?'typed':i%2?'wordbank':'gap',direction:'en-nl',assisted,grammar:i>=(day>7?3:day>3?2:1),spelling:i%2===1?null:i>=(day>7?4:2),independent:independent&&i>2});
  }
 }
 state.daily={date,count:12};
}
if(scenario==='complete')for(const [i,c] of content.concepts.entries())retain(c.id,addDays(recent,-26+i));
if(scenario==='gap'){
 Object.assign(state.progress.F1,{taught:true,lessonAcknowledged:true,practiceAttempts:8,recognised:4,constructed:2});
 const item=content.sentences.find(s=>s.nl==='Zij studeert.'&&s.pool==='practice');
 markWordsTaught(state,item,date);state.pending=makeExercise(item,'gap',content);
}
localStorage.setItem('zin-course-demo','sample-data-only');localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
document.getElementById('preview-scenario').value=scenario;
document.getElementById('preview-scenario').onchange=e=>{location.search='?scenario='+encodeURIComponent(e.target.value)};
const observer=new MutationObserver(()=>{
 if(!document.querySelector('#start'))return;
 observer.disconnect();
 if(scenario==='gap')document.querySelector('#start').click();else document.querySelector('[data-view="curriculum"]').click();
});
observer.observe(document.getElementById('content'),{childList:true,subtree:true});
await import('../src/ui/app.js');
