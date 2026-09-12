import {visualGenerationStatus,visualGenerationUser,requestGeneratedVisual} from './visual-generation-client.js';

const params=new URLSearchParams(location.search);
const enabled=params.get('visual-test')==='1';
const TEST_CARD={cardId:'175',dutch:'hand',english:'hand',partOfWord:'noun, de'};
const content=document.getElementById('content');
const tab=document.getElementById('flashcards-preview-tab');
let scheduled=false,busy=false,message='';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function remove(){document.getElementById('visual-generation-test-panel')?.remove();}
async function render(){
 if(!enabled){remove();return;}
 const anchor=document.querySelector('.flashcards-preview .flashcard-hero')||document.getElementById('production-progress-panel');
 if(!anchor){remove();return;}
 remove();
 let user=null,status=null,error='';
 try{user=await visualGenerationUser();if(user)status=await visualGenerationStatus();}
 catch(e){error=e?.message||'Visual test preflight failed.';}
 const panel=document.createElement('article');
 panel.id='visual-generation-test-panel';panel.className='card evidence-card';panel.setAttribute('aria-live','polite');
 const ready=Boolean(user&&status?.ready);
 panel.innerHTML=`<div class="eyebrow">CONTROLLED VISUAL TEST</div><h2>Test image pipeline</h2><p class="muted small">This test uses the real card <strong lang="nl">${TEST_CARD.dutch}</strong> (${TEST_CARD.english}) without creating fake recall failures, changing its SRS schedule, or recording learning evidence. One confirmed generation is a real paid OpenAI image request and still obeys the server budgets.</p>${!user?'<p class="muted small">Sign in with Google in the “Today’s varied examples” panel first.</p>':error?`<p class="small error-message">${esc(error)}</p>`:status?`<p class="muted small">Server: ${ready?'ready':'not ready'} · ${esc(status.reason||'unknown')} · estimated budget reservation £${Number(status.estimatedCostGbp||0).toFixed(2)}.</p>`:''}${ready?`<button id="run-controlled-visual-test" class="primary" type="button" ${busy?'disabled':''}>${busy?'Generating…':'Generate one test image'}</button>`:''}${message?`<p class="small error-message">${esc(message)}</p>`:''}<p class="muted small">After generation, stop at the image review screen. The normal approval/rejection workflow will take over.</p>`;
 anchor.insertAdjacentElement('afterend',panel);
 document.getElementById('run-controlled-visual-test')?.addEventListener('click',async()=>{
  if(busy)return;
  if(!confirm('Generate one real OpenAI image for “hand”? This is a paid API request and will count toward today’s visual-generation allowance.'))return;
  busy=true;message='';await render();
  try{await requestGeneratedVisual(TEST_CARD);location.reload();}
  catch(e){message=e?.message||'Controlled visual generation failed.';busy=false;await render();}
 });
}
function refresh(){if(!enabled||scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render().catch(()=>{});});}
if(enabled&&content)new MutationObserver(refresh).observe(content,{childList:true,subtree:true});
if(enabled)tab?.addEventListener('click',()=>setTimeout(refresh,0));
if(enabled)refresh();
