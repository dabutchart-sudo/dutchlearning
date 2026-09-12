import {searchableCards,wordBrowserSummary,WORD_BROWSER_LIMIT} from '../engine/word-browser.js';

const tab=document.getElementById('words-tab');
const content=document.getElementById('content');
let cache=null,busy=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function fetchCards(){
  if(cache)return cache;
  const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js');
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
  return `<article class="word-browser-row">${card.image_url?`<img src="${esc(card.image_url)}" alt="" loading="lazy">`:''}<div class="word-browser-copy"><div class="word-browser-title"><strong lang="nl">${esc(card.dutch)}</strong>${card.partofword?`<span class="pill">${esc(card.partofword)}</span>`:''}</div><div class="word-browser-english">${esc(card.english)}</div>${sentence?`<div class="word-browser-sentence" lang="nl">${esc(sentence)}</div>`:''}</div></article>`;
}
function renderList(cards,query=''){
  const results=searchableCards(cards,query);
  const host=document.getElementById('word-browser-results');
  const count=document.getElementById('word-browser-count');
  if(!host||!count)return;
  count.textContent=query?`${results.length}${results.length===WORD_BROWSER_LIMIT?'+':''} match${results.length===1?'':'es'}`:`Showing first ${Math.min(results.length,WORD_BROWSER_LIMIT)} active words`;
  host.innerHTML=results.length?results.map(row).join(''):'<div class="empty">No matching words.</div>';
}
async function open(){
  if(busy)return;busy=true;activateTab();
  content.innerHTML='<article class="card evidence-card"><h2>Opening your words…</h2><p class="muted">Reading your flashcard data.</p></article>';
  try{
    const cards=await fetchCards(),summary=wordBrowserSummary(cards);
    content.innerHTML=`<section class="word-browser"><article class="card evidence-card word-browser-head"><div class="eyebrow">WORDS</div><h2>Vocabulary browser</h2><p class="muted">Search your live flashcard vocabulary without changing SRS, learning evidence, or today’s session.</p><div class="word-browser-metrics"><div class="metric"><span class="eyebrow">Active</span><span class="n">${summary.active}</span></div><div class="metric"><span class="eyebrow">With sentence</span><span class="n">${summary.withSentence}</span></div><div class="metric"><span class="eyebrow">With image</span><span class="n">${summary.withImage}</span></div></div><label class="word-browser-search-label" for="word-browser-search">Search Dutch, English, word type or sentence</label><input id="word-browser-search" class="word-browser-search" type="search" autocomplete="off" spellcheck="false" placeholder="e.g. schrijven or write"><div id="word-browser-count" class="mini muted"></div></article><div id="word-browser-results" class="word-browser-results"></div></section>`;
    const input=document.getElementById('word-browser-search');
    input?.addEventListener('input',()=>renderList(cards,input.value));
    renderList(cards,'');input?.focus();
  }catch(error){content.innerHTML=`<article class="card evidence-card"><h2>Could not open Words</h2><p class="error-message">${esc(error.message)}</p></article>`;}
  finally{busy=false;}
}

tab?.addEventListener('click',open);
