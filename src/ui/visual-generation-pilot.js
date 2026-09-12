import {visualGenerationStatus,visualGenerationUser,requestGeneratedVisual} from './visual-generation-client.js';

const params=new URLSearchParams(window.location.search);
const enabled=params.get('visual-test')==='1';
const TEST_CARD={cardId:'175',dutch:'hand',english:'hand',partOfWord:'noun, de'};
const RETURN_KEY='dutch_visual_test_return_flashcards';
const content=document.getElementById('content');
const tab=document.getElementById('flashcards-preview-tab');
let scheduled=false,busy=false,message='',lastStatusText='Checking sign-in and server preflight…';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function panel(){return document.getElementById('visual-generation-test-panel');}
function anchor(){return document.querySelector('.flashcards-preview .flashcard-hero')||document.getElementById('production-progress-panel');}
function ensurePanel(){
 if(!enabled)return null;
 const a=anchor();if(!a)return null;
 let p=panel();
 if(!p){p=document.createElement('article');p.id='visual-generation-test-panel';p.className='card evidence-card';p.setAttribute('aria-live','polite');a.insertAdjacentElement('afterend',p);}
 return p;
}
function paint({ready=false,statusText=lastStatusText}={}){
 const p=ensurePanel();if(!p)return;
 lastStatusText=statusText;
 p.innerHTML=`<div class="eyebrow">CONTROLLED VISUAL TEST</div><h2>Test image pipeline</h2><p class="muted small">This test uses the real card <strong lang="nl">${TEST_CARD.dutch}</strong> (${TEST_CARD.english}) without creating fake recall failures, changing its SRS schedule, or recording learning evidence. One confirmed generation is a real paid OpenAI image request and still obeys the server budgets.</p><p class="muted small">${esc(statusText)}</p>${ready?`<button id="run-controlled-visual-test" class="primary" type="button" ${busy?'disabled':''}>${busy?'Generating…':'Generate one test image'}</button>`:''}${message?`<p class="small error-message">${esc(message)}</p>`:''}<p class="muted small">After generation, the app returns to Flashcards and shows the pending image review near the top of the dashboard.</p>`;
 document.getElementById('run-controlled-visual-test')?.addEventListener('click',runGeneration);
}
async function runGeneration(){
 if(busy)return;
 if(!confirm('Generate one real OpenAI image for “hand”? This is a paid API request and will count toward today’s visual-generation allowance.'))return;
 busy=true;message='';paint({ready:true,statusText:lastStatusText});
 try{
  await requestGeneratedVisual(TEST_CARD);
  sessionStorage.setItem(RETURN_KEY,'1');
  window.location.reload();
 }catch(e){message=e?.message||'Controlled visual generation failed.';busy=false;paint({ready:true,statusText:lastStatusText});}
}
async function preflight(){
 const p=ensurePanel();if(!p)return;
 paint({statusText:'Checking sign-in and server preflight…'});
 try{
  const user=await visualGenerationUser();
  if(!user){paint({statusText:'Sign in with Google in the “Today’s varied examples” panel first.'});return;}
  const status=await visualGenerationStatus();
  const ready=Boolean(status?.ready);
  paint({ready,statusText:`Server: ${ready?'ready':'not ready'} · ${status?.reason||'unknown'} · estimated budget reservation £${Number(status?.estimatedCostGbp||0).toFixed(2)}.`});
 }catch(e){paint({statusText:`Preflight error: ${e?.message||'Visual test preflight failed.'}`});}
}
function refresh(){
 if(!enabled||scheduled)return;
 scheduled=true;
 queueMicrotask(()=>{scheduled=false;if(ensurePanel())preflight().catch(()=>{});});
}
if(enabled&&content)new MutationObserver(()=>{if(!panel()&&anchor())refresh();}).observe(content,{childList:true,subtree:true});
if(enabled)tab?.addEventListener('click',()=>setTimeout(refresh,0));
if(enabled&&sessionStorage.getItem(RETURN_KEY)==='1'){
 sessionStorage.removeItem(RETURN_KEY);
 setTimeout(()=>tab?.click(),150);
}
if(enabled)refresh();
