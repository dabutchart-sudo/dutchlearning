import {chooseSentence} from '../engine/sentence-bank.js';
import {sentenceGenerationTargets} from '../engine/sentence-targets.js';
import {cachedSentenceBank,clearSentenceGenerationReturn,generateSentenceBanks,inspectSentenceBanks,sentenceGenerationReturnRequested,sentenceGenerationUser,signInForSentenceGeneration,signOutSentenceGeneration} from './sentence-bank-client.js';

const content=document.getElementById('content');
const recentIds=[];
let cards=null;
let currentCard=null;
let currentPair=null;
let panelBusy=false;
let panelMessage='';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const clean=s=>String(s??'').replace(/\s*\(.*?\)\s*$/,'').trim().toLocaleLowerCase('nl-NL');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const maxNewSetting=()=>{const n=parseInt(localStorage.getItem('dfc_max_new')??'',10);return Number.isFinite(n)?Math.max(0,n):5;};

async function fetchCards(){
 if(cards)return cards;
 const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js');
 const rows=[],size=1000;
 for(let from=0;;from+=size){
  const res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?select=*`,{headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`,Range:`${from}-${from+size-1}`,'Range-Unit':'items'}});
  if(!res.ok)throw new Error(`Could not read flashcards (${res.status}).`);
  const page=await res.json();rows.push(...page);if(page.length<size)break;
 }
 cards=rows.filter(x=>!x.suspended);
 return cards;
}

async function renderPanel(){
 const host=document.querySelector('.flashcards-preview');if(!host)return;
 let panel=document.getElementById('sentence-bank-panel');
 if(!panel){panel=document.createElement('article');panel.id='sentence-bank-panel';panel.className='card evidence-card sentence-bank-panel';host.append(panel);}
 try{
  const list=await fetchCards();
  const targets=sentenceGenerationTargets(list,{today:dayKey(),maxNew:maxNewSetting()});
  const [coverage,targetCoverage,user]=await Promise.all([inspectSentenceBanks(list),inspectSentenceBanks(targets),sentenceGenerationUser()]);
  panel.innerHTML=`<div class="row"><div><div class="eyebrow">Contextual sentence banks</div><h2>Today's varied examples</h2></div><span class="status">${targetCoverage.ready}/${targetCoverage.total} ready today</span></div><p class="muted">Sentence generation now focuses only on cards due or likely to appear in today's Flashcard session. It prepares up to five missing banks at a time instead of working through the whole library.</p><div class="sentence-bank-metrics"><div class="metric"><span class="eyebrow">Today's cards</span><span class="n">${targetCoverage.total}</span></div><div class="metric"><span class="eyebrow">Need examples today</span><span class="n">${targetCoverage.needsRefresh}</span></div><div class="metric"><span class="eyebrow">Library ready</span><span class="n">${coverage.ready}</span></div></div><div class="sentence-bank-actions">${user?`<button id="generate-sentence-banks" class="primary" ${panelBusy||!targetCoverage.needsRefresh?'disabled':''}>${panelBusy?'Preparing…':targetCoverage.needsRefresh?'Prepare up to 5 for today':'Today is ready'}</button><button id="sentence-bank-signout" class="text-link">Sign out</button>`:`<button id="sentence-bank-signin" class="secondary" ${panelBusy?'disabled':''}>Sign in with Google to prepare examples</button>`}</div>${panelMessage?`<p class="small ${panelMessage.startsWith('Error:')?'error-message':'muted'}">${esc(panelMessage)}</p>`:''}`;
  document.getElementById('sentence-bank-signin')?.addEventListener('click',async()=>{panelBusy=true;panelMessage='';await renderPanel();try{await signInForSentenceGeneration();}catch(e){panelBusy=false;panelMessage=`Error: ${e.message}`;await renderPanel();}});
  document.getElementById('sentence-bank-signout')?.addEventListener('click',async()=>{panelBusy=true;await renderPanel();try{await signOutSentenceGeneration();panelMessage='Signed out of sentence generation.';}catch(e){panelMessage=`Error: ${e.message}`;}panelBusy=false;await renderPanel();});
  document.getElementById('generate-sentence-banks')?.addEventListener('click',async()=>{panelBusy=true;panelMessage='';await renderPanel();try{const result=await generateSentenceBanks(targets);panelMessage=result.generated?`Prepared and verified ${result.readyAfter}/${result.requested} sentence banks for today's likely cards.`:'Today's likely cards already have complete sentence banks.';}catch(e){panelMessage=`Error: ${e.message}`;}panelBusy=false;await renderPanel();});
 }catch(e){panel.innerHTML=`<div class="eyebrow">Contextual sentence banks</div><h2>Sentence banks unavailable</h2><p class="muted">${esc(e.message)}</p>`;}
}

async function rotateReviewSentence(){
 const review=document.querySelector('.flashcard-review-card');if(!review)return;
 const word=review.querySelector('.flashcard-word');const sentence=review.querySelector('.flashcard-sentence');if(!word||!sentence)return;
 const text=clean(word.textContent),list=await fetchCards();
 const isDutch=review.querySelector('.eyebrow')?.textContent.trim().toLowerCase()==='dutch';
 if(isDutch){
  const matched=list.find(c=>clean(c.dutch)===text);if(!matched)return;
  if(!currentCard||String(currentCard.id)!==String(matched.id)){
   currentCard=matched;const bank=await cachedSentenceBank(matched);currentPair=chooseSentence(bank,{recentIds,random:Math.random});
   if(currentPair){recentIds.push(String(currentPair.id));while(recentIds.length>8)recentIds.shift();}
  }
  if(currentPair&&sentence.textContent!==currentPair.nl)sentence.textContent=currentPair.nl;
 }else{
  const matched=currentCard&&clean(currentCard.english)===text?currentCard:list.find(c=>clean(c.english)===text);
  if(matched&&currentPair&&sentence.textContent!==currentPair.en)sentence.textContent=currentPair.en;
 }
}

async function restoreAfterSentenceSignIn(){
 if(!sentenceGenerationReturnRequested())return;
 let user=null;
 for(let attempt=0;attempt<20&&!user;attempt++){
  try{user=await sentenceGenerationUser();}catch{}
  if(!user)await wait(100);
 }
 if(!user)return;
 clearSentenceGenerationReturn();
 const tab=document.getElementById('flashcards-preview-tab');
 if(!tab)return;
 tab.click();
 for(let attempt=0;attempt<30;attempt++){
  const panel=document.getElementById('sentence-bank-panel');
  if(panel){panelMessage='Signed in. Sentence generation is ready.';await renderPanel();panel.scrollIntoView({block:'nearest'});return;}
  await wait(100);
 }
}

let scheduled=false;
const refresh=()=>{if(scheduled)return;scheduled=true;queueMicrotask(async()=>{scheduled=false;try{if(document.querySelector('.flashcards-preview')&&!document.getElementById('sentence-bank-panel'))await renderPanel();if(document.querySelector('.flashcard-review-card'))await rotateReviewSentence();}catch{}});};
new MutationObserver(refresh).observe(content,{childList:true,subtree:true});
document.getElementById('flashcards-preview-tab')?.addEventListener('click',()=>setTimeout(refresh,0));
setTimeout(()=>restoreAfterSentenceSignIn().catch(()=>{}),0);
