import {registerPacks} from '../content/registry.js';
import {activeConcept,teachConcept,markWordsTaught} from '../engine/learner.js';
import {createRepository} from '../engine/persistence.js';
import {dayKey} from '../engine/util.js';
import {sessionVocabulary,briefingDone,rememberBriefing} from '../engine/session-briefing.js';

let content=null,repo=null,bypassStart=false,autoSkipping=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inSandbox=()=>!!document.querySelector('.debug-banner');

function installLayoutRules(){
 const style=document.createElement('style');
 style.textContent=`
  .session .question-card{min-height:clamp(520px,calc(100dvh - 180px),680px)}
  .session-briefing .vocabulary-list{max-height:360px}
  .correction-instruction{margin:-10px 0 4px;color:var(--muted);font-size:.9rem}
  @media(max-width:520px){.session .question-card{min-height:calc(100dvh - 220px)}}
 `;
 document.head.appendChild(style);
}

async function loadContent(){
 const manifestURL=new URL('../content/packs.json',import.meta.url);
 const response=await fetch(manifestURL);if(!response.ok)throw Error('Course content unavailable');
 const manifest=await response.json();
 const packs=await Promise.all(manifest.packs.map(async path=>{const r=await fetch(new URL(path,manifestURL));if(!r.ok)throw Error('Course pack unavailable');return r.json()}));
 return registerPacks(packs);
}

function vocabularyHTML(words){return `<div class="vocabulary-list">${words.map(w=>`<div class="row"><strong lang="nl">${esc(w.nl)}</strong><span>${esc(w.en)}${w.mature?' <span class="pill">Mature card</span>':''}</span></div>`).join('')}</div>`;}

function restoreTodayAndStart(){
 bypassStart=true;
 document.querySelector('[data-view="curriculum"]')?.click();
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  document.querySelector('[data-course-start], #start-course')?.click();
  bypassStart=false;
 }));
}

function showBriefing(conceptId){
 const words=sessionVocabulary(content,conceptId),date=dayKey(new Date());
 document.body.classList.add('session-active');
 document.querySelector('footer')?.setAttribute('aria-hidden','true');
 const host=document.getElementById('content');if(!host)return;
 host.innerHTML=`<section class="session stack"><article class="card question-card session-briefing"><span class="direction">Vocabulary briefing · not scored</span><h2>Words for today’s practice</h2><p>Review these once now. Their translations will not be shown immediately before individual questions.</p>${vocabularyHTML(words)}<div class="actions"><button id="session-briefing-continue" class="primary">Start practice</button></div></article></section>`;
 document.getElementById('session-briefing-continue')?.addEventListener('click',()=>{
  const state=repo.load();
  markWordsTaught(state,{vocabulary:words},date);
  repo.save(state);
  rememberBriefing(localStorage,date,conceptId);
  restoreTodayAndStart();
 });
}

function currentState(){try{return repo?.load()||null}catch{return null}}

function adjustCorrectionScreen(){
 const qType=document.querySelector('.q-type');
 if(!qType||!['Correct the Dutch sentence','Type the missing letters'].includes(qType.textContent.trim()))return;
 // This function runs from a child-list MutationObserver. Replacing an already-correct
 // label would create another child-list mutation and recursively trigger the observer.
 if(qType.textContent.trim()!=='Type the missing letters')qType.textContent='Type the missing letters';
 const prompt=document.querySelector('.question-card .prompt');
 if(prompt&&!prompt.dataset.separatedBlanks){
  prompt.textContent=prompt.textContent.replace(/_+/g,run=>run.split('').join(' '));
  prompt.dataset.separatedBlanks='true';
 }
 const input=document.getElementById('typed-answer');
 if(input){input.placeholder='Missing letters only';input.setAttribute('aria-label','Missing letters only');}
 if(!document.querySelector('.correction-instruction'))prompt?.insertAdjacentHTML('afterend','<p class="correction-instruction">Type only the missing letters — one letter for each blank.</p>');
}

function skipMidSessionReminder(){
 if(autoSkipping||inSandbox())return;
 const direction=document.querySelector('.question-card .direction');
 const button=document.getElementById('words-learned');
 if(!direction||!button||!direction.textContent.includes('Vocabulary reminder'))return;
 const state=currentState();
 if(!state||state.daily.count===0)return;
 autoSkipping=true;
 requestAnimationFrame(()=>{button.click();setTimeout(()=>{autoSkipping=false},0)});
}

function observe(){
 const observer=new MutationObserver(()=>{adjustCorrectionScreen();skipMidSessionReminder();});
 observer.observe(document.getElementById('content'),{subtree:true,childList:true});
 adjustCorrectionScreen();
}

function interceptClicks(){
 document.addEventListener('click',event=>{
  if(inSandbox())return;
  const start=event.target.closest?.('#start,#start-course,[data-course-start]');
  if(start&&!bypassStart){
   const state=currentState();if(!state)return;
   const conceptId=activeConcept(state,content),date=dayKey(new Date());
   if(state.daily.count===0&&state.progress[conceptId]?.lessonAcknowledged&&!briefingDone(localStorage,date,conceptId)){
    event.preventDefault();event.stopImmediatePropagation();showBriefing(conceptId);
   }
   return;
  }
  const learned=event.target.closest?.('#learned');
  if(learned&&/let.?s practise/i.test(learned.textContent)){
   const state=currentState();if(!state)return;
   const conceptId=activeConcept(state,content),date=dayKey(new Date());
   if(briefingDone(localStorage,date,conceptId))return;
   event.preventDefault();event.stopImmediatePropagation();
   teachConcept(state,conceptId,content,{acknowledge:true});repo.save(state);showBriefing(conceptId);
  }
 },true);
}

async function init(){
 try{
  installLayoutRules();
  content=await loadContent();repo=createRepository(localStorage,content);
  interceptClicks();observe();
 }catch(error){console.warn('Learning session refinements unavailable',error);}
}

init();
