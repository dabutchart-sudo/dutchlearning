import {STORAGE_KEY} from '../engine/persistence.js';
import {visualGenerationQueue} from '../engine/visual-generation-plan.js';
import {visualSemanticReviewQueue} from '../engine/visual-semantic-review.js';
import {requestGeneratedVisual,visualGenerationUser} from './visual-generation-client.js';

const content=document.getElementById('content');
const tab=document.getElementById('flashcards-preview-tab');
let cardsCache=null,scheduled=false,busy=false,confirmCardId=null,message='',generated=null;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function state(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return{};}}
async function cards(){
 if(cardsCache)return cardsCache;
 const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js'),rows=[],size=1000;
 for(let from=0;;from+=size){
  const res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?select=id,dutch,english,partofword,image_url`,{headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`,Range:`${from}-${from+size-1}`,'Range-Unit':'items'}});
  if(!res.ok)throw new Error(`Could not read visual-generation cards (${res.status}).`);
  const page=await res.json();rows.push(...page);if(page.length<size)break;
 }
 cardsCache=rows;return rows;
}
function removePanel(){document.getElementById('visual-generation-panel')?.remove();}
function errorText(error){return esc(error?.message||'Visual generation is unavailable.');}

async function render(){
 const anchor=document.getElementById('visual-semantic-review-panel')||document.getElementById('production-progress-panel');
 if(!anchor){removePanel();return;}
 const allCards=await cards(),s=state(),today=dayKey();
 removePanel();
 // Finish semantic decisions before offering an API-spending action.
 if(visualSemanticReviewQueue(allCards,s,{today}).length)return;
 const plan=visualGenerationQueue(allCards,s,{today,limit:1})[0]||null;
 if(!plan){generated=null;confirmCardId=null;return;}
 let user=null,authError='';
 try{user=await visualGenerationUser();}catch(error){authError=error?.message||'Sign-in status could not be checked.';}
 const panel=document.createElement('article');
 panel.id='visual-generation-panel';panel.className='card evidence-card';panel.setAttribute('aria-live','polite');
 const confirming=confirmCardId===String(plan.cardId);
 if(generated&&String(generated.cardId)===String(plan.cardId)){
  panel.innerHTML=`<div class="eyebrow">VISUAL MEMORY CUE</div><h2>Picture created</h2><p class="muted small">The image has been stored on the flashcard and can now be used as adaptive recall support.</p><div class="rule"><strong lang="nl">${esc(plan.dutch)}</strong><br><span>${esc(plan.english)}</span></div><img src="${esc(generated.imageUrl)}" alt="${esc(generated.alt)}" style="display:block;width:100%;max-width:360px;aspect-ratio:1;object-fit:cover;border-radius:16px;margin:14px auto 0">`;
 }else if(confirming){
  panel.innerHTML=`<div class="eyebrow">VISUAL MEMORY CUE</div><h2>Confirm image generation</h2><p class="muted small">This is an explicit spending action. It can consume one server generation allowance and API credit. Nothing will be generated unless you confirm.</p><div class="rule"><strong lang="nl">${esc(plan.dutch)}</strong><br><span>${esc(plan.english)}</span></div><div class="actions"><button id="confirm-visual-generation" class="primary" type="button" ${busy?'disabled':''}>${busy?'Generating…':'Confirm generation'}</button><button id="cancel-visual-generation" class="secondary" type="button" ${busy?'disabled':''}>Cancel</button></div>${message?`<p class="small error-message">${esc(message)}</p>`:''}`;
 }else{
  const authCopy=user?'You are signed in. Generation is still manual and uses the server-side usage and GBP budget limits.':authError?`Generation cannot start yet: ${esc(authError)}`:'Sign in with Google in the “Today’s varied examples” panel before generating a visual cue.';
  panel.innerHTML=`<div class="eyebrow">VISUAL MEMORY CUE</div><h2>Ready for a picture</h2><p class="muted small">You approved this word because a clear image could genuinely help recall. The app will never generate it automatically.</p><div class="rule"><strong lang="nl">${esc(plan.dutch)}</strong><br><span>${esc(plan.english)}</span>${plan.partOfWord?`<br><span class="muted small">${esc(plan.partOfWord)}</span>`:''}</div><p class="muted small">${authCopy}</p>${user?'<button id="prepare-visual-generation" class="secondary" type="button">Generate visual cue</button>':''}`;
 }
 anchor.insertAdjacentElement('afterend',panel);
 document.getElementById('prepare-visual-generation')?.addEventListener('click',()=>{confirmCardId=String(plan.cardId);message='';render().catch(()=>{});});
 document.getElementById('cancel-visual-generation')?.addEventListener('click',()=>{confirmCardId=null;message='';render().catch(()=>{});});
 document.getElementById('confirm-visual-generation')?.addEventListener('click',async()=>{
  if(busy)return;busy=true;message='';await render();
  try{
   const result=await requestGeneratedVisual(plan);
   const record=allCards.find(card=>String(card.id)===String(plan.cardId));if(record)record.image_url=result.imageUrl;
   generated=result;confirmCardId=null;
  }catch(error){message=error?.message||'Visual generation failed.';}
  busy=false;await render();
 });
}
function refresh(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render().catch(()=>{});});}
if(content)new MutationObserver(refresh).observe(content,{childList:true,subtree:true});
tab?.addEventListener('click',()=>setTimeout(refresh,0));
refresh();
