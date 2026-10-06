import {inferExternalStudyDayComplete,reviewLoadAllowance,reviewLoadAtStart} from '../engine/flashcard-session.js';
import {paintDailyChrome} from './daily-chrome.js';

const tab=document.getElementById('flashcards-preview-tab');
const content=document.getElementById('content');
let busy=false;

const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const numberSetting=(key,fallback)=>{const n=parseInt(localStorage.getItem(key)??'',10);return Number.isFinite(n)?n:fallback;};

async function fetchAll(base,key,table){
 const rows=[],size=1000;
 for(let from=0;;from+=size){
  const res=await fetch(`${base}/rest/v1/${table}?select=*`,{headers:{apikey:key,Authorization:`Bearer ${key}`,Range:`${from}-${from+size-1}`,'Range-Unit':'items'}});
  if(!res.ok)throw new Error(`Could not read ${table} (${res.status}).`);
  const page=await res.json();rows.push(...page);if(page.length<size)break;
 }
 return rows;
}

async function reconcile(){
 if(busy||!document.querySelector('.flashcard-hero'))return;
 busy=true;
 try{
  const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js');
  const today=dayKey(),lockKey=`dutch_flashcards_completed_v1:${c.SUPABASE_URL}:${today}`;
  if(localStorage.getItem(lockKey)==='complete')return;
  const [cards,history]=await Promise.all([fetchAll(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,'cards'),fetchAll(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,'reviewhistory')]);
  const configuredMax=numberSetting('dfc_max_new',5),reviewTarget=numberSetting('dutch_flashcards_review_target',60);
  const dueReview=cards.filter(card=>!card.suspended&&card.type!=='new'&&card.due_date&&String(card.due_date).slice(0,10)<=today).length;
  const introducedToday=cards.filter(card=>!card.suspended&&card.first_seen&&String(card.first_seen).slice(0,10)===today).length;
  const todayReviews=history.filter(row=>row.timestamp&&String(row.timestamp).slice(0,10)===today).length;
  // Reconstruct the workload seen when today's batch began. Using only the
  // remaining due count would restore capacity after another device cleared it.
  const startingReviewLoad=reviewLoadAtStart({cards,history,today});
  const effectiveNewCap=reviewLoadAllowance(configuredMax,startingReviewLoad,reviewTarget);
  const complete=inferExternalStudyDayComplete({dueReview,todayReviews,introducedToday,configuredMax,effectiveNewCap,reviewTarget});
  if(!complete)return;
  localStorage.setItem(lockKey,'complete');
  const hero=document.querySelector('.flashcard-hero');
  if(!hero)return;
  const heading=hero.querySelector('h2');if(heading)heading.textContent='Flashcards complete for today';
  const metrics=[...hero.querySelectorAll('.metric')];
  const newMetric=metrics.find(m=>m.querySelector('.eyebrow')?.textContent.trim().toLowerCase()==='new available');if(newMetric)newMetric.querySelector('.n').textContent='0';
  const button=hero.querySelector('#start-flashcard-review');if(button){button.disabled=true;button.textContent='Done for today';}
  const allowance=hero.querySelector('.flashcard-allowance-note');if(allowance)allowance.textContent='Your Flashcard session is complete, so no more new cards can be introduced today.';
  paintDailyChrome({flashcards:'done'});
  hero.insertAdjacentHTML('beforeend','<p class="muted small" data-external-complete>Completion detected from shared Flashcard review history.</p>');
 }catch(error){console.warn('Flashcard completion sync skipped:',error);}
 finally{busy=false;}
}

let scheduled=false;
const schedule=()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;reconcile();},0);};
new MutationObserver(schedule).observe(content,{childList:true,subtree:true});
tab?.addEventListener('click',schedule);
