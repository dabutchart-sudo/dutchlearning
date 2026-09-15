const content=document.getElementById('content');
const tab=document.getElementById('flashcards-preview-tab');
const KEY='dutch_flashcards_sentence_queue';
const MIGRATION_KEY='dutch_sentence_queue_shared_v1';
const SUGGESTIONS_PREFIX='dutch_sentence_suggestions_v1:';
let scheduled=false;
let generationClient=null;
let generationUser=null;
let generationBusy=false;
let cardsCache=new Map();
let suggestionsCache=new Map();
let activeReviewIds=[];
let queueSyncPromise=null;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function ids(){try{return [...new Set(JSON.parse(localStorage.getItem(KEY)||'[]').map(Number).filter(Number.isFinite))];}catch{return[];}}
function saveIds(list){localStorage.setItem(KEY,JSON.stringify([...new Set(list.map(Number).filter(Number.isFinite))]));}
async function constants(){return import('https://dabutchart-sudo.github.io/flashcards/constants.js');}
function suggestionKey(url){return SUGGESTIONS_PREFIX+url;}
function loadSuggestions(url){try{const saved=JSON.parse(localStorage.getItem(suggestionKey(url))||'[]');suggestionsCache=new Map((Array.isArray(saved)?saved:[]).filter(r=>r&&Number.isFinite(Number(r.id))&&Array.isArray(r.sentences)).map(r=>[Number(r.id),r.sentences]));}catch{suggestionsCache=new Map();}}
function saveSuggestions(url){try{localStorage.setItem(suggestionKey(url),JSON.stringify([...suggestionsCache].map(([id,sentences])=>({id,sentences}))));}catch{}}
function hasFiveSuggestions(id){const list=suggestionsCache.get(Number(id));return Array.isArray(list)&&list.length===5&&list.every(p=>p&&typeof p.nl==='string'&&typeof p.en==='string');}
function reviewIds(){return activeReviewIds.length?[...activeReviewIds]:ids();}

async function patchFlags(cardIds,value){
 const clean=[...new Set((cardIds||[]).map(Number).filter(Number.isFinite))];
 if(!clean.length)return;
 const c=await constants();
 for(let i=0;i<clean.length;i+=100){
  const chunk=clean.slice(i,i+100);
  const res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?id=in.(${chunk.join(',')})`,{method:'PATCH',headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({sentence_flagged:Boolean(value)})});
  if(!res.ok)throw new Error(`Could not sync sentence flags (${res.status}).`);
  for(const id of chunk){const card=cardsCache.get(id);if(card)card.sentence_flagged=Boolean(value);}
 }
}
async function readServerFlagIds(){
 const c=await constants();
 const res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?select=id&sentence_flagged=eq.true&order=id.asc`,{headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`}});
 if(!res.ok)throw new Error(`Could not read shared sentence queue (${res.status}).`);
 return (await res.json()).map(r=>Number(r.id)).filter(Number.isFinite);
}
async function syncSharedQueue(){
 if(queueSyncPromise)return queueSyncPromise;
 queueSyncPromise=(async()=>{
  const local=ids(),server=await readServerFlagIds(),migrated=localStorage.getItem(MIGRATION_KEY)==='1';
  const localSet=new Set(local),serverSet=new Set(server);
  let finalIds;
  if(!migrated){
   finalIds=[...new Set([...server,...local])];
   const add=finalIds.filter(id=>!serverSet.has(id));
   await patchFlags(add,true);
   localStorage.setItem(MIGRATION_KEY,'1');
  }else{
   const add=local.filter(id=>!serverSet.has(id));
   const remove=server.filter(id=>!localSet.has(id));
   await patchFlags(add,true);
   await patchFlags(remove,false);
   finalIds=[...local];
  }
  saveIds(finalIds);
  return finalIds;
 })().finally(()=>{queueSyncPromise=null;});
 return queueSyncPromise;
}

async function fetchCardsByIds(wanted,{force=false}={}){
 const clean=[...new Set((wanted||[]).map(Number).filter(Number.isFinite))];
 if(!clean.length)return[];
 if(!force&&clean.every(id=>cardsCache.has(id)))return clean.map(id=>cardsCache.get(id)).filter(Boolean);
 const c=await constants();
 for(let i=0;i<clean.length;i+=100){
  const chunk=clean.slice(i,i+100),filter=`id=in.(${chunk.join(',')})`;
  const res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?select=*&${filter}`,{headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`}});
  if(!res.ok)throw new Error(`Could not read queued cards (${res.status}).`);
  const rows=await res.json();
  for(const row of rows)cardsCache.set(Number(row.id),row);
 }
 return clean.map(id=>cardsCache.get(id)).filter(Boolean);
}
async function patchCard(id,patch){const c=await constants();const res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(patch)});if(!res.ok)throw new Error(`Could not save sentence changes (${res.status}).`);}
async function ensureGenerationClient(){
 if(generationClient)return generationClient;
 const c=await constants();
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
 generationClient=createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,{auth:{storageKey:'dutch_sentence_auth',flowType:'pkce'}});
 loadSuggestions(c.SUPABASE_URL);
 generationClient.auth.onAuthStateChange((_event,session)=>{generationUser=session?.user||null;});
 const {data}=await generationClient.auth.getSession();generationUser=data.session?.user||null;
 return generationClient;
}
function injectSummary(){const hero=document.querySelector('.flashcards-preview .flashcard-hero');if(!hero)return;let panel=document.getElementById('sentence-review-summary');const count=ids().length,markup=`<div class="row"><div><div class="eyebrow">Sentence maintenance</div><h2>${count?`${count} sentence${count===1?'':'s'} queued for review`:'No sentences queued'}</h2></div><span class="status">${count}</span></div><p class="muted">Flag a card during review and it will appear here. Five AI alternatives are prepared for every flagged word before review begins.</p><button id="open-sentence-review" class="secondary" ${count?'':'disabled'}>${count?'Review flagged sentences':'Queue is empty'}</button>`;if(!panel){panel=document.createElement('article');panel.id='sentence-review-summary';panel.className='card evidence-card sentence-review-summary';hero.insertAdjacentElement('afterend',panel);}if(panel.dataset.queueCount===String(count))return;panel.dataset.queueCount=String(count);panel.innerHTML=markup;document.getElementById('open-sentence-review')?.addEventListener('click',openQueue);}

async function openQueue(){
 content.innerHTML='<section class="sentence-preparation-view"><article class="card evidence-card sentence-preparation-card"><div class="sentence-loader" aria-hidden="true"></div><div class="eyebrow">Sentence maintenance</div><h2>Preparing flagged sentences…</h2><p class="muted">Loading your flagged words.</p></article></section>';
 try{
  await syncSharedQueue();
  activeReviewIds=ids();
  await ensureGenerationClient();
  const cards=await fetchCardsByIds(activeReviewIds,{force:true});
  if(!cards.length){renderComplete();return;}
  const missing=Math.max(0,activeReviewIds.length-cards.length);
  if(missing){renderPreparationError(cards,[`${missing} flagged card${missing===1?' is':'s are'} no longer available in the database.`]);return;}
  if(!generationUser){renderSignIn(cards);return;}
  if(cards.every(c=>hasFiveSuggestions(c.id))){await renderReviewFresh();return;}
  await prepareSuggestions(cards);
 }catch(e){renderPreparationError([], [e.message||'The flagged sentence queue could not load.']);}
}
function renderSignIn(cards){content.innerHTML=`<section class="sentence-preparation-view"><article class="card evidence-card sentence-preparation-card"><div class="eyebrow">AI sentence suggestions</div><h2>Sign in to prepare ${cards.length} flagged word${cards.length===1?'':'s'}</h2><p class="muted">You only need to sign in once. The app will then generate five Dutch/English sentence pairs for every flagged word before showing the review list.</p><button id="sentence-ai-signin" class="primary">Continue with Google</button><button id="back-from-sentence-prep" class="text-link">Back to Flashcards</button></article></section>`;document.getElementById('sentence-ai-signin').onclick=signIn;document.getElementById('back-from-sentence-prep').onclick=()=>{activeReviewIds=[];tab?.click();};}
function renderPreparation(cards,done,total,currentWord){const percent=total?Math.round(done/total*100):0;content.innerHTML=`<section class="sentence-preparation-view"><article class="card evidence-card sentence-preparation-card"><div class="sentence-loader" aria-hidden="true"></div><div class="eyebrow">AI sentence suggestions</div><h2>Preparing your suggestions</h2><p class="muted">Please wait while five sentence pairs are generated for every flagged word. You will only see the review list when the whole batch is ready.</p><div class="sentence-preparation-progress"><div class="row"><strong>${done} of ${total} words ready</strong><span>${percent}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>${currentWord?`<p class="small muted">Generating suggestions for <strong lang="nl">${esc(currentWord)}</strong>…</p>`:''}</div></article></section>`;}
function renderPreparationError(cards,errors){const ready=cards.filter(c=>hasFiveSuggestions(c.id)).length,total=cards.length;content.innerHTML=`<section class="sentence-preparation-view"><article class="card evidence-card sentence-preparation-card"><div class="eyebrow">Sentence preparation paused</div><h2>Not all suggestions could be prepared</h2><p class="muted">Nothing has been lost. The review screen stays hidden until all flagged words have five suggestions.</p><div class="sentence-preparation-error">${errors.map(e=>`<p>${esc(e)}</p>`).join('')}</div>${total?`<p class="small muted">${ready} of ${total} flagged words already have suggestions and will be reused.</p><button id="retry-sentence-preparation" class="primary">Try again</button>`:''}<button id="back-from-sentence-prep" class="text-link">Back to Flashcards</button></article></section>`;document.getElementById('retry-sentence-preparation')?.addEventListener('click',()=>prepareSuggestions(cards));document.getElementById('back-from-sentence-prep').onclick=()=>{activeReviewIds=[];tab?.click();};}
async function signIn(){try{const client=await ensureGenerationClient();sessionStorage.setItem('dutch_sentence_review_return','1');const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)throw error;}catch(e){renderPreparationError([], [e.message||'Could not start Google sign-in.']);}}
async function requestSuggestions(id){const client=await ensureGenerationClient();if(!generationUser)throw new Error('Your Google sign-in has expired. Please return to Flashcards and open the sentence queue again.');const {data,error}=await client.functions.invoke('generate-sentences',{body:{ids:[Number(id)]}});if(error){let message='Generation failed.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}const result=Array.isArray(data?.cards)?data.cards.find(r=>Number(r?.id)===Number(id)):null;if(!result||!Array.isArray(result.sentences)||result.sentences.length!==5||result.sentences.some(p=>!p||typeof p.nl!=='string'||typeof p.en!=='string'))throw new Error('The AI service returned an incomplete set of suggestions.');return result.sentences;}
async function prepareSuggestions(cards){if(generationBusy)return;generationBusy=true;const targets=cards.filter(c=>!hasFiveSuggestions(c.id));const total=cards.length;let done=total-targets.length;const failures=[];try{const c=await constants();if(!targets.length){await renderReviewFresh();return;}for(const card of targets){renderPreparation(cards,done,total,card.dutch);try{let sentences=null,lastError=null;for(let attempt=0;attempt<2&&!sentences;attempt++){try{sentences=await requestSuggestions(card.id);}catch(e){lastError=e;}}if(!sentences)throw lastError||new Error('Generation failed.');suggestionsCache.set(Number(card.id),sentences);saveSuggestions(c.SUPABASE_URL);done++;}catch(e){failures.push(`${card.dutch}: ${e.message||'generation failed'}`);}}if(failures.length){renderPreparationError(cards,failures);return;}await renderReviewFresh();}finally{generationBusy=false;}}
function reviewCardMarkup(card){const suggestions=suggestionsCache.get(Number(card.id))||[];return `<article class="card evidence-card sentence-review-card" data-card-id="${esc(card.id)}"><div class="row"><div><strong class="sentence-review-word" lang="nl">${esc(card.dutch)}</strong><div class="mini">${esc(card.english)}${card.partofword?` · ${esc(card.partofword)}`:''}</div></div><button class="text-link remove-sentence-flag" data-id="${esc(card.id)}">Remove</button></div><div class="sentence-ai-options"><div class="eyebrow">Choose a replacement</div>${suggestions.map((s,i)=>`<button class="sentence-ai-option" data-id="${esc(card.id)}" data-option="${i}"><strong><span>${i+1}.</span> <span lang="nl">${esc(s.nl)}</span></strong><span>${esc(s.en)}</span></button>`).join('')}<div class="sentence-review-actions"><button class="text-link regenerate-sentence-options" data-id="${esc(card.id)}">Generate five different suggestions</button><button class="text-link edit-queued-sentence" data-id="${esc(card.id)}">Edit manually</button></div></div></article>`;}
async function renderReviewFresh(){
 const wanted=reviewIds();
 const cards=await fetchCardsByIds(wanted,{force:true});
 if(!cards.length){renderComplete();return;}
 if(cards.length!==wanted.length){renderPreparationError(cards,[`${wanted.length-cards.length} flagged word${wanted.length-cards.length===1?' is':'s are'} missing from the database.`]);return;}
 const incomplete=cards.filter(c=>!hasFiveSuggestions(c.id));
 if(incomplete.length){await prepareSuggestions(cards);return;}
 renderReview(cards);
}
function renderReview(cards){if(!cards.length){renderComplete();return;}content.innerHTML=`<section class="flashcards-preview sentence-review-view"><div class="row sentence-review-header"><div><div class="eyebrow">Sentence maintenance</div><h2>${cards.length} flagged sentence${cards.length===1?'':'s'}</h2><p class="muted small">Choose one of five alternatives for each word.</p></div><button id="back-from-sentence-queue" class="secondary">Back to Flashcards</button></div>${cards.map(reviewCardMarkup).join('')}</section>`;document.getElementById('back-from-sentence-queue').onclick=()=>{activeReviewIds=[];tab?.click();};document.querySelectorAll('.remove-sentence-flag').forEach(b=>b.onclick=()=>removeFlag(Number(b.dataset.id)));document.querySelectorAll('.edit-queued-sentence').forEach(b=>b.onclick=()=>editSentence(cards.find(c=>Number(c.id)===Number(b.dataset.id))));document.querySelectorAll('.regenerate-sentence-options').forEach(b=>b.onclick=()=>regenerateOne(Number(b.dataset.id),cards));document.querySelectorAll('.sentence-ai-option').forEach(b=>b.onclick=()=>chooseSuggestion(cards.find(c=>Number(c.id)===Number(b.dataset.id)),Number(b.dataset.option)));}
async function regenerateOne(id,cards){const card=cards.find(c=>Number(c.id)===Number(id));if(!card||generationBusy)return;generationBusy=true;renderPreparation(cards,0,1,card.dutch);try{const sentences=await requestSuggestions(id);suggestionsCache.set(Number(id),sentences);const c=await constants();saveSuggestions(c.SUPABASE_URL);await renderReviewFresh();}catch(e){renderPreparationError(cards,[`${card.dutch}: ${e.message||'generation failed'}`]);}finally{generationBusy=false;}}
async function chooseSuggestion(card,index){const option=suggestionsCache.get(Number(card.id))?.[index];if(!option)return;const buttons=[...document.querySelectorAll(`.sentence-ai-option[data-id="${card.id}"]`)];buttons.forEach(b=>b.disabled=true);try{await patchCard(card.id,{dutch_sentence:option.nl,english_sentence:option.en,sentence_flagged:false});card.dutch_sentence=option.nl;card.english_sentence=option.en;card.sentence_flagged=false;cardsCache.set(Number(card.id),card);suggestionsCache.delete(Number(card.id));const c=await constants();saveSuggestions(c.SUPABASE_URL);saveIds(ids().filter(x=>x!==Number(card.id)));activeReviewIds=activeReviewIds.filter(x=>x!==Number(card.id));await renderReviewFresh();}catch(e){buttons.forEach(b=>b.disabled=false);alert(e.message||'Could not save the selected sentence.');}}
async function removeFlag(id){await patchFlags([id],false);saveIds(ids().filter(x=>x!==Number(id)));activeReviewIds=activeReviewIds.filter(x=>x!==Number(id));suggestionsCache.delete(Number(id));await renderReviewFresh();}
function editSentence(card){content.innerHTML=`<section class="flashcard-session"><article class="card evidence-card flashcard-edit"><div class="eyebrow">EDIT QUEUED SENTENCE</div><h2>${esc(card.dutch)}</h2><p class="muted">${esc(card.english)}</p><label>Dutch sentence<textarea id="queue-dutch-sentence">${esc(card.dutch_sentence||'')}</textarea></label><label>English sentence<textarea id="queue-english-sentence">${esc(card.english_sentence||'')}</textarea></label><div class="flashcard-edit-actions"><button id="cancel-queue-edit" class="secondary">Cancel</button><button id="save-queue-edit" class="primary">Save & resolve</button></div><button id="save-queue-keep" class="text-link">Save but keep flagged</button></article></section>`;document.getElementById('cancel-queue-edit').onclick=renderReviewFresh;document.getElementById('save-queue-edit').onclick=()=>saveSentence(card,true);document.getElementById('save-queue-keep').onclick=()=>saveSentence(card,false);}
async function saveSentence(card,resolve){const dutch=document.getElementById('queue-dutch-sentence').value.trim(),english=document.getElementById('queue-english-sentence').value.trim();const button=document.getElementById(resolve?'save-queue-edit':'save-queue-keep');button.disabled=true;try{await patchCard(card.id,{dutch_sentence:dutch||null,english_sentence:english||null,...(resolve?{sentence_flagged:false}:{})});card.dutch_sentence=dutch||null;card.english_sentence=english||null;cardsCache.set(Number(card.id),card);if(resolve){card.sentence_flagged=false;saveIds(ids().filter(x=>x!==Number(card.id)));activeReviewIds=activeReviewIds.filter(x=>x!==Number(card.id));suggestionsCache.delete(Number(card.id));}await renderReviewFresh();}catch(e){button.disabled=false;alert(e.message);}}
function renderComplete(){activeReviewIds=[];content.innerHTML='<section class="flashcards-preview sentence-review-view"><article class="card evidence-card complete"><div class="bigcheck">✓</div><h2>Sentence queue is clear</h2><p class="muted">There are no flagged cards waiting for sentence maintenance.</p><button id="back-from-sentence-complete" class="primary">Back to Flashcards</button></article></section>';document.getElementById('back-from-sentence-complete').onclick=()=>tab?.click();}
function normalizeLoadingText(){const heading=[...content.querySelectorAll('h2')].find(h=>h.textContent==='Reading your Flashcards data…');if(heading)heading.textContent='Reading your flashcard data…';}
async function refresh(){if(scheduled)return;scheduled=true;queueMicrotask(async()=>{try{await syncSharedQueue();normalizeLoadingText();if(document.querySelector('.flashcards-preview .flashcard-hero'))injectSummary();}catch{}finally{scheduled=false;}});}
new MutationObserver(refresh).observe(content,{childList:true,subtree:true});
window.addEventListener('storage',e=>{if(e.key===KEY)refresh();});
tab?.addEventListener('click',()=>{activeReviewIds=[];setTimeout(refresh,0);});
if(sessionStorage.getItem('dutch_sentence_review_return')){sessionStorage.removeItem('dutch_sentence_review_return');setTimeout(async()=>{tab?.click();setTimeout(()=>document.getElementById('open-sentence-review')?.click(),500);},200);}
refresh();