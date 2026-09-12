import {STORAGE_KEY} from '../engine/persistence.js';
import {visualGenerationQueue} from '../engine/visual-generation-plan.js';
import {visualGenerationStatusSummary} from '../engine/visual-generation-status.js';
import {visualSemanticReviewQueue} from '../engine/visual-semantic-review.js';
import {approveGeneratedVisual,pendingGeneratedVisual,rejectGeneratedVisual,requestGeneratedVisual,visualGenerationStatus,visualGenerationUser} from './visual-generation-client.js';

const content=document.getElementById('content');
const tab=document.getElementById('flashcards-preview-tab');
let cardsCache=null,scheduled=false,busy=false,confirmCardId=null,message='',generated=null,serviceStatus=null,statusCheckedAt=0,pendingCheckedAt=0;
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
async function status(force=false){
 if(!force&&serviceStatus&&Date.now()-statusCheckedAt<60000)return serviceStatus;
 serviceStatus=await visualGenerationStatus();statusCheckedAt=Date.now();return serviceStatus;
}
async function recoverPending(force=false){
 if(generated)return generated;
 if(!force&&pendingCheckedAt&&Date.now()-pendingCheckedAt<60000)return null;
 generated=await pendingGeneratedVisual();pendingCheckedAt=Date.now();return generated;
}
function recordPlan(record){return record?{cardId:String(record.id),dutch:record.dutch,english:record.english,partOfWord:record.partofword||''}:null;}
function reasonCopy(reason){
 return ({
  disabled:'The visual generation service is deliberately disabled on the server.',
  'missing-openai-key':'The server is missing its OpenAI image-generation key.',
  'usage-budget-disabled':'Server usage limits currently disable visual generation.',
  'cost-budget-unconfigured':'The server cost estimate or monthly GBP ceiling still needs configuring.',
  'audit-log-unavailable':'The private generation audit log is not ready yet.',
  'storage-bucket-unavailable':'The visual-cue storage bucket is not ready yet.',
  'storage-bucket-not-public':'The visual-cue storage bucket must be public before activation.',
  'daily-limit-reached':'Today’s visual generation allowance has already been used.',
  'monthly-limit-reached':'This month’s visual generation allowance has been reached.',
  'monthly-cost-ceiling-reached':'The monthly visual-generation GBP ceiling has been reached.'
 })[reason]||'The visual generation service is not ready to spend API credit.';
}

async function render(){
 const hero=document.querySelector('.flashcards-preview .flashcard-hero');
 const normalAnchor=document.getElementById('visual-semantic-review-panel')||document.getElementById('production-progress-panel');
 if(!hero&&!normalAnchor){removePanel();return;}
 const allCards=await cards(),s=state(),today=dayKey();
 removePanel();
 let user=null,authError='',pendingError='';
 try{user=await visualGenerationUser();}catch(error){authError=error?.message||'Sign-in status could not be checked.';}
 if(user&&!generated){try{await recoverPending();}catch(error){pendingError=error?.message||'Pending visual review could not be restored.';}}
 const recoveredRecord=generated?allCards.find(card=>String(card.id)===String(generated.cardId)):null;
 const recoveredPlan=recordPlan(recoveredRecord);
 if(generated&&recoveredPlan){
  const panel=document.createElement('article');
  panel.id='visual-generation-panel';panel.className='card evidence-card';panel.setAttribute('aria-live','polite');
  panel.innerHTML=`<div class="eyebrow">VISUAL CUE AWAITING REVIEW</div><h2>Check the picture before using it</h2><p class="muted small">This staged cue is for <strong lang="nl">${esc(recoveredPlan.dutch)}</strong>. The image has been generated and stored temporarily, but it has <strong>not</strong> been attached to the flashcard yet. This review survives a refresh or another signed-in device until you approve or reject it.</p><div class="rule"><strong lang="nl">${esc(recoveredPlan.dutch)}</strong><br><span>${esc(recoveredPlan.english)}</span></div><img src="${esc(generated.imageUrl)}" alt="${esc(generated.alt)}" style="display:block;width:100%;max-width:360px;aspect-ratio:1;object-fit:cover;border-radius:16px;margin:14px auto 0"><div class="actions"><button id="approve-generated-visual" class="primary" type="button" ${busy?'disabled':''}>${busy?'Saving…':'Use this image'}</button><button id="reject-generated-visual" class="secondary" type="button" ${busy?'disabled':''}>${busy?'Please wait…':'Reject image'}</button></div><p class="muted small">Rejecting removes the staged image. The generation attempt still counts toward today’s allowance because the API cost has already occurred.</p>${message?`<p class="small error-message">${esc(message)}</p>`:''}`;
  (hero||normalAnchor).insertAdjacentElement('afterend',panel);
  document.getElementById('approve-generated-visual')?.addEventListener('click',async()=>{
   if(busy||!generated)return;busy=true;message='';await render();
   try{
    const result=await approveGeneratedVisual(generated);
    const record=allCards.find(card=>String(card.id)===String(generated.cardId));if(record)record.image_url=result.imageUrl;
    generated=null;pendingCheckedAt=0;serviceStatus=null;statusCheckedAt=0;message='';
   }catch(error){message=error?.message||'Visual approval failed.';}
   busy=false;await render();
  });
  document.getElementById('reject-generated-visual')?.addEventListener('click',async()=>{
   if(busy||!generated)return;busy=true;message='';await render();
   try{await rejectGeneratedVisual(generated);generated=null;pendingCheckedAt=0;serviceStatus=null;statusCheckedAt=0;message='';}
   catch(error){message=error?.message||'Visual rejection failed.';}
   busy=false;await render();
  });
  return;
 }
 if(generated&&!recoveredPlan){generated=null;pendingCheckedAt=0;}
 if(!normalAnchor)return;
 if(visualSemanticReviewQueue(allCards,s,{today}).length)return;
 const plan=visualGenerationQueue(allCards,s,{today,limit:1})[0]||null;
 if(!plan){confirmCardId=null;return;}
 let preflight=null,preflightError='';
 if(user){try{preflight=await status();}catch(error){preflightError=error?.message||'Server preflight could not be checked.';}}
 const panel=document.createElement('article');
 panel.id='visual-generation-panel';panel.className='card evidence-card';panel.setAttribute('aria-live','polite');
 const confirming=confirmCardId===String(plan.cardId)&&preflight?.ready;
 if(confirming){
  panel.innerHTML=`<div class="eyebrow">VISUAL MEMORY CUE</div><h2>Confirm image generation</h2><p class="muted small">This is an explicit spending action. The server currently estimates this image at £${Number(preflight.estimatedCostGbp||0).toFixed(2)} and will reject it if any daily, monthly or GBP limit has been reached. You will review the generated image before it can become a learning cue.</p><div class="rule"><strong lang="nl">${esc(plan.dutch)}</strong><br><span>${esc(plan.english)}</span></div><div class="actions"><button id="confirm-visual-generation" class="primary" type="button" ${busy?'disabled':''}>${busy?'Generating…':'Confirm generation'}</button><button id="cancel-visual-generation" class="secondary" type="button" ${busy?'disabled':''}>Cancel</button></div>${message?`<p class="small error-message">${esc(message)}</p>`:''}`;
 }else{
  let authCopy='Sign in with Google in the “Today’s varied examples” panel before generating a visual cue.',action='';
  if(authError)authCopy=`Generation cannot start yet: ${esc(authError)}`;
  else if(user&&pendingError)authCopy=`Pending-review check unavailable: ${esc(pendingError)}`;
  else if(user&&preflightError)authCopy=`Server preflight unavailable: ${esc(preflightError)}`;
  else if(user&&preflight?.ready){authCopy=`Server ready · ${esc(visualGenerationStatusSummary(preflight))}. Estimated £${Number(preflight.estimatedCostGbp||0).toFixed(2)} for this image.`;action='<button id="prepare-visual-generation" class="secondary" type="button">Generate visual cue</button>';}
  else if(user&&preflight)authCopy=visualGenerationStatusSummary(preflight);
  panel.innerHTML=`<div class="eyebrow">VISUAL MEMORY CUE</div><h2>Ready for a picture</h2><p class="muted small">You approved this word because a clear image could genuinely help recall. The app will never generate it automatically.</p><div class="rule"><strong lang="nl">${esc(plan.dutch)}</strong><br><span>${esc(plan.english)}</span>${plan.partOfWord?`<br><span class="muted small">${esc(plan.partOfWord)}</span>`:''}</div><p class="muted small">${authCopy}</p>${action}`;
 }
 normalAnchor.insertAdjacentElement('afterend',panel);
 document.getElementById('prepare-visual-generation')?.addEventListener('click',()=>{confirmCardId=String(plan.cardId);message='';render().catch(()=>{});});
 document.getElementById('cancel-visual-generation')?.addEventListener('click',()=>{confirmCardId=null;message='';render().catch(()=>{});});
 document.getElementById('confirm-visual-generation')?.addEventListener('click',async()=>{
  if(busy)return;busy=true;message='';await render();
  try{
   const freshStatus=await status(true);if(!freshStatus.ready)throw new Error(reasonCopy(freshStatus.reason));
   generated=await requestGeneratedVisual(plan);confirmCardId=null;pendingCheckedAt=Date.now();serviceStatus=null;statusCheckedAt=0;
  }catch(error){message=error?.message||'Visual generation failed.';}
  busy=false;await render();
 });
}
function refresh(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render().catch(()=>{});});}
if(content)new MutationObserver(()=>{
 const hero=document.querySelector('.flashcards-preview .flashcard-hero');
 const panel=document.getElementById('visual-generation-panel');
 if(hero&&!panel)refresh();
 else if(!hero&&panel)removePanel();
}).observe(content,{childList:true,subtree:true});
tab?.addEventListener('click',()=>setTimeout(()=>{pendingCheckedAt=0;refresh();},0));
refresh();
