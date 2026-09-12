import {searchableCards,wordBrowserSummary,WORD_BROWSER_LIMIT} from '../engine/word-browser.js';
import {clearSentenceGenerationReturn,generateSentenceBanks,sentenceGenerationReturnTarget,sentenceGenerationUser,signInForSentenceGeneration} from './sentence-bank-client.js';

const tab=document.getElementById('words-tab');
const content=document.getElementById('content');
let cache=null,busy=false,lastQuery='';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function config(){return import('https://dabutchart-sudo.github.io/flashcards/constants.js');}
async function fetchCards(){
  if(cache)return cache;
  const c=await config();
  const rows=[],size=1000;
  for(let from=0;;from+=size){
    const res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?select=*`,{headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`,Range:`${from}-${from+size-1}`,'Range-Unit':'items'}});
    if(!res.ok)throw new Error(`Could not read words (${res.status}).`);
    const page=await res.json();rows.push(...page);if(page.length<size)break;
  }
  cache=rows;return rows;
}
function activateTab(){document.querySelectorAll('.tab').forEach(node=>node.classList.toggle('active',node===tab));}
function row(card){
  const sentence=card.dutch_sentence||card.english_sentence||'';
  return `<article class="word-browser-row">${card.image_url?`<img src="${esc(card.image_url)}" alt="" loading="lazy">`:''}<div class="word-browser-copy"><div class="word-browser-title"><strong lang="nl">${esc(card.dutch)}</strong>${card.partofword?`<span class="pill">${esc(card.partofword)}</span>`:''}</div><div class="word-browser-english">${esc(card.english)}</div>${sentence?`<div class="word-browser-sentence" lang="nl">${esc(sentence)}</div>`:'<div class="word-browser-sentence muted">No example sentence yet.</div>'}<button class="text-link word-browser-sentence-action" type="button" data-sentence-card="${esc(card.id)}">${sentence?'Replace sentence':'Add sentence'}</button></div></article>`;
}
function bindSentenceButtons(){document.querySelectorAll('[data-sentence-card]').forEach(button=>button.addEventListener('click',()=>openSentenceMaintenance(button.dataset.sentenceCard)));}
function renderList(cards,query=''){
  lastQuery=query;
  const results=searchableCards(cards,query);
  const host=document.getElementById('word-browser-results');
  const count=document.getElementById('word-browser-count');
  if(!host||!count)return;
  count.textContent=query?`${results.length}${results.length===WORD_BROWSER_LIMIT?'+':''} match${results.length===1?'':'es'}`:`Showing first ${Math.min(results.length,WORD_BROWSER_LIMIT)} active words`;
  host.innerHTML=results.length?results.map(row).join(''):'<div class="empty">No matching words.</div>';
  bindSentenceButtons();
}
async function open(){
  if(busy)return;busy=true;activateTab();
  content.innerHTML='<article class="card evidence-card"><h2>Opening your words…</h2><p class="muted">Reading your flashcard data.</p></article>';
  try{
    const cards=await fetchCards(),summary=wordBrowserSummary(cards);
    content.innerHTML=`<section class="word-browser"><article class="card evidence-card word-browser-head"><div class="eyebrow">WORDS</div><h2>Vocabulary browser</h2><p class="muted">Search your live flashcard vocabulary. Sentence maintenance here does not change SRS, learning evidence, or today’s completed session.</p><div class="word-browser-metrics"><div class="metric"><span class="eyebrow">Active</span><span class="n">${summary.active}</span></div><div class="metric"><span class="eyebrow">With sentence</span><span class="n">${summary.withSentence}</span></div><div class="metric"><span class="eyebrow">With image</span><span class="n">${summary.withImage}</span></div></div><label class="word-browser-search-label" for="word-browser-search">Search Dutch, English, word type or sentence</label><input id="word-browser-search" class="word-browser-search" type="search" autocomplete="off" spellcheck="false" placeholder="e.g. schrijven or write" value="${esc(lastQuery)}"><div id="word-browser-count" class="mini muted"></div></article><div id="word-browser-results" class="word-browser-results"></div></section>`;
    const input=document.getElementById('word-browser-search');
    input?.addEventListener('input',()=>renderList(cards,input.value));
    renderList(cards,lastQuery);input?.focus();
  }catch(error){content.innerHTML=`<article class="card evidence-card"><h2>Could not open Words</h2><p class="error-message">${esc(error.message)}</p></article>`;}
  finally{busy=false;}
}

async function openSentenceMaintenance(cardId){
  const cards=await fetchCards(),card=cards.find(item=>String(item.id)===String(cardId));if(!card)return;
  activateTab();
  let user=null;try{user=await sentenceGenerationUser();}catch{}
  content.innerHTML=`<section class="word-browser sentence-maintenance"><article class="card evidence-card"><div class="eyebrow">SENTENCE MAINTENANCE</div><h2><span lang="nl">${esc(card.dutch)}</span> · ${esc(card.english)}</h2><p class="muted">Generate five fresh examples, choose one, and save it to this flashcard. Only the Dutch and English sentence fields are changed.</p>${card.dutch_sentence?`<div class="sentence-maintenance-current"><div class="eyebrow">Current sentence</div><strong lang="nl">${esc(card.dutch_sentence)}</strong>${card.english_sentence?`<span>${esc(card.english_sentence)}</span>`:''}</div>`:''}<div class="sentence-maintenance-actions">${user?'<button id="generate-replacement-sentences" class="primary" type="button">Generate 5 new sentences</button>':'<button id="signin-replacement-sentences" class="secondary" type="button">Sign in with Google to generate</button>'}<button id="cancel-sentence-maintenance" class="text-link" type="button">Back to Words</button></div><div id="sentence-maintenance-status" class="small muted"></div><div id="sentence-maintenance-options"></div></article></section>`;
  document.getElementById('cancel-sentence-maintenance').onclick=()=>open();
  document.getElementById('signin-replacement-sentences')?.addEventListener('click',async()=>{const status=document.getElementById('sentence-maintenance-status');try{status.textContent='Opening Google sign-in…';sessionStorage.setItem('sentence_maintenance_card',String(card.id));await signInForSentenceGeneration('words');}catch(error){status.innerHTML=`<span class="error-message">${esc(error.message)}</span>`;}});
  document.getElementById('generate-replacement-sentences')?.addEventListener('click',()=>generateReplacementOptions(card));
}

async function generateReplacementOptions(card){
  const button=document.getElementById('generate-replacement-sentences'),status=document.getElementById('sentence-maintenance-status'),host=document.getElementById('sentence-maintenance-options');
  if(!button||!status||!host)return;button.disabled=true;button.textContent='Generating…';status.textContent='Creating five fresh sentence pairs…';host.innerHTML='';
  try{
    const result=await generateSentenceBanks([card],{force:true}),generated=result.cards[0]?.generatedSentences||[];
    if(generated.length!==5)throw new Error('Expected five generated sentence pairs.');
    status.textContent='Choose the example you want to use.';
    host.innerHTML=`<div class="sentence-maintenance-list">${generated.map((pair,index)=>`<button type="button" class="sentence-maintenance-option" data-sentence-choice="${index}"><strong lang="nl">${esc(pair.nl)}</strong><span>${esc(pair.en)}</span></button>`).join('')}</div>`;
    host.querySelectorAll('[data-sentence-choice]').forEach(choice=>choice.addEventListener('click',()=>saveReplacementSentence(card,generated[Number(choice.dataset.sentenceChoice)])));
  }catch(error){status.innerHTML=`<span class="error-message">${esc(error.message)}</span>`;button.disabled=false;button.textContent='Try generation again';}
}

async function saveReplacementSentence(card,pair){
  const status=document.getElementById('sentence-maintenance-status'),host=document.getElementById('sentence-maintenance-options');
  if(!pair||!status||!host)return;
  host.querySelectorAll('button').forEach(button=>button.disabled=true);status.textContent='Saving selected sentence…';
  try{
    const c=await config(),res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?id=eq.${encodeURIComponent(card.id)}`,{method:'PATCH',headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({dutch_sentence:pair.nl,english_sentence:pair.en})});
    if(!res.ok)throw new Error(`Could not save sentence (${res.status}).`);
    card.dutch_sentence=pair.nl;card.english_sentence=pair.en;
    status.innerHTML='<span class="sentence-maintenance-saved">Saved. SRS and today’s session were not changed.</span>';
    host.innerHTML=`<div class="sentence-maintenance-current saved"><div class="eyebrow">New sentence</div><strong lang="nl">${esc(pair.nl)}</strong><span>${esc(pair.en)}</span></div><button id="sentence-maintenance-done" class="primary" type="button">Back to Words</button>`;
    document.getElementById('sentence-maintenance-done').onclick=()=>open();
  }catch(error){status.innerHTML=`<span class="error-message">${esc(error.message)}</span>`;host.querySelectorAll('button').forEach(button=>button.disabled=false);}
}

async function restoreSentenceMaintenance(){
  if(sentenceGenerationReturnTarget()!=='words')return;
  let user=null;for(let attempt=0;attempt<20&&!user;attempt++){try{user=await sentenceGenerationUser();}catch{}if(!user)await wait(100);}
  if(!user)return;
  const cardId=sessionStorage.getItem('sentence_maintenance_card');sessionStorage.removeItem('sentence_maintenance_card');clearSentenceGenerationReturn();
  if(cardId)await openSentenceMaintenance(cardId);else await open();
}

tab?.addEventListener('click',open);
setTimeout(()=>restoreSentenceMaintenance().catch(()=>{}),0);
