import {chooseSentence} from '../engine/sentence-bank.js';
import {cachedSentenceBank,generateSentenceBanks,inspectSentenceBanks,sentenceGenerationUser,signInForSentenceGeneration,signOutSentenceGeneration} from './sentence-bank-client.js';

const content=document.getElementById('content');
const recentIds=[];
let cards=null;
let currentCard=null;
let currentPair=null;
let panelBusy=false;
let panelMessage='';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s??'').replace(/\s*\(.*?\)\s*$/,'').trim().toLocaleLowerCase('nl-NL');

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
  const list=await fetchCards(),[coverage,user]=await Promise.all([inspectSentenceBanks(list),sentenceGenerationUser()]);
  panel.innerHTML=`<div class="row"><div><div class="eyebrow">Contextual sentence banks</div><h2>Varied examples</h2></div><span class="status">${coverage.ready}/${coverage.total} ready</span></div><p class="muted">The app can keep up to 10 varied examples for each word and rotate them during Flashcard review. Generation is manual, cached, and limited to five words per request.</p><div class="sentence-bank-metrics"><div class="metric"><span class="eyebrow">Ready</span><span class="n">${coverage.ready}</span></div><div class="metric"><span class="eyebrow">Need examples</span><span class="n">${coverage.needsRefresh}</span></div></div><div class="sentence-bank-actions">${user?`<button id="generate-sentence-banks" class="primary" ${panelBusy||!coverage.needsRefresh?'disabled':''}>${panelBusy?'Generating…':coverage.needsRefresh?'Generate next 5 words':'All banks ready'}</button><button id="sentence-bank-signout" class="text-link">Sign out</button>`:`<button id="sentence-bank-signin" class="secondary" ${panelBusy?'disabled':''}>Sign in with Google to generate</button>`}</div>${panelMessage?`<p class="small ${panelMessage.startsWith('Error:')?'error-message':'muted'}">${esc(panelMessage)}</p>`:''}`;
  document.getElementById('sentence-bank-signin')?.addEventListener('click',async()=>{panelBusy=true;panelMessage='';await renderPanel();try{await signInForSentenceGeneration();}catch(e){panelBusy=false;panelMessage=`Error: ${e.message}`;await renderPanel();}});
  document.getElementById('sentence-bank-signout')?.addEventListener('click',async()=>{panelBusy=true;await renderPanel();try{await signOutSentenceGeneration();panelMessage='Signed out of sentence generation.';}catch(e){panelMessage=`Error: ${e.message}`;}panelBusy=false;await renderPanel();});
  document.getElementById('generate-sentence-banks')?.addEventListener('click',async()=>{panelBusy=true;panelMessage='';await renderPanel();try{const result=await generateSentenceBanks(list);panelMessage=result.generated?`Generated and cached sentence banks for ${result.generated} word${result.generated===1?'':'s'}.`:'No sentence banks needed generation.';}catch(e){panelMessage=`Error: ${e.message}`;}panelBusy=false;await renderPanel();});
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
  if(currentPair)sentence.textContent=currentPair.nl;
 }else{
  const matched=currentCard&&clean(currentCard.english)===text?currentCard:list.find(c=>clean(c.english)===text);
  if(matched&&currentPair)sentence.textContent=currentPair.en;
 }
}

let scheduled=false;
const refresh=()=>{if(scheduled)return;scheduled=true;queueMicrotask(async()=>{scheduled=false;try{if(document.querySelector('.flashcards-preview'))await renderPanel();if(document.querySelector('.flashcard-review-card'))await rotateReviewSentence();}catch{}});};
new MutationObserver(refresh).observe(content,{childList:true,subtree:true});
document.getElementById('flashcards-preview-tab')?.addEventListener('click',()=>setTimeout(refresh,0));
