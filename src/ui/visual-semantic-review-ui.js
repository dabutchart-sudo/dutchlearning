import {STORAGE_KEY} from '../engine/persistence.js';
import {visualSemanticReviewQueue,recordVisualSemanticDecision} from '../engine/visual-semantic-review.js';

const content=document.getElementById('content');
const tab=document.getElementById('flashcards-preview-tab');
let cardsCache=null,scheduled=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function state(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return{};}}
function save(value){localStorage.setItem(STORAGE_KEY,JSON.stringify(value));}
async function cards(){
 if(cardsCache)return cardsCache;
 const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js'),rows=[],size=1000;
 for(let from=0;;from+=size){
  const res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?select=id,dutch,english,partofword,image_url`,{headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`,Range:`${from}-${from+size-1}`,'Range-Unit':'items'}});
  if(!res.ok)throw new Error(`Could not read visual-review cards (${res.status}).`);
  const page=await res.json();rows.push(...page);if(page.length<size)break;
 }
 cardsCache=rows;return rows;
}

function removePanel(){document.getElementById('visual-semantic-review-panel')?.remove();}

async function render(){
 const anchor=document.getElementById('production-progress-panel');
 if(!anchor){removePanel();return;}
 const allCards=await cards(),s=state(),today=dayKey(),queue=visualSemanticReviewQueue(allCards,s,{today});
 removePanel();
 if(!queue.length)return;
 const item=queue[0],record=item.record,remaining=queue.length;
 const panel=document.createElement('article');
 panel.id='visual-semantic-review-panel';
 panel.className='card evidence-card';
 panel.setAttribute('aria-live','polite');
 panel.innerHTML=`<div class="eyebrow">VISUAL MEMORY REVIEW</div><h2>Would a picture genuinely help?</h2><p class="muted small">This word has had unresolved recall misses on ${item.need.recallMissDays} different days. Only approve an image when a clear picture could communicate the meaning without written text.</p><div class="rule"><strong lang="nl">${esc(record.dutch)}</strong><br><span>${esc(record.english)}</span>${record.partofword?`<br><span class="muted small">${esc(record.partofword)}</span>`:''}</div><div class="actions"><button class="primary" type="button" data-visual-decision="suitable">Image would help</button><button class="secondary" type="button" data-visual-decision="unsuitable">Not useful</button></div><p class="muted small">${remaining} visual review${remaining===1?'':'s'} waiting. This decision does not generate an image or spend API credit.</p>`;
 anchor.insertAdjacentElement('afterend',panel);
 panel.addEventListener('click',event=>{
  const button=event.target.closest('[data-visual-decision]');
  if(!button)return;
  const latest=state();
  recordVisualSemanticDecision(latest,record,button.dataset.visualDecision,{today,reason:'learner-semantic-review'});
  save(latest);
  render().catch(()=>{});
 });
}

function refresh(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render().catch(()=>{});});}
if(content)new MutationObserver(()=>{
 const anchor=document.getElementById('production-progress-panel');
 const panel=document.getElementById('visual-semantic-review-panel');
 if(anchor&&!panel)refresh();
 else if(!anchor&&panel)removePanel();
}).observe(content,{childList:true,subtree:true});
tab?.addEventListener('click',()=>setTimeout(refresh,0));
refresh();
