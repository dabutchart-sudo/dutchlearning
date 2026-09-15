import {registerPacks} from '../content/registry.js';
import {createRepository} from '../engine/persistence.js';

let contentPromise=null;
async function loadContent(){
 if(contentPromise)return contentPromise;
 contentPromise=(async()=>{
  const manifestURL=new URL('../content/packs.json',import.meta.url);
  const response=await fetch(manifestURL);
  if(!response.ok)throw Error('The course could not load for reset. Reconnect and try again.');
  const manifest=await response.json();
  const packs=await Promise.all(manifest.packs.map(async path=>{
   const r=await fetch(new URL(path,manifestURL));
   if(!r.ok)throw Error('A course pack could not load for reset. Reconnect and try again.');
   return r.json();
  }));
  return registerPacks(packs);
 })();
 return contentPromise;
}

function installResetControl(){
 const root=document.getElementById('content');
 const stack=root?.querySelector('.stack');
 if(!stack||root.querySelector('#learning-reset-card')||root.querySelector('.debug-banner'))return;
 const heading=stack.querySelector('h2');
 if(heading?.textContent?.trim()!=='Your app')return;

 const card=document.createElement('article');
 card.id='learning-reset-card';
 card.className='card evidence-card';
 card.innerHTML=`<h2>Start Learning from Day 1</h2><p class="muted">This permanently clears only Zin Learning course progress on this device: lessons, attempts, word-learning evidence, tests, retention and today’s question count. Your Flashcards/SRS data and Supabase records are not changed.</p><button id="reset-learning-progress" class="secondary" type="button">Reset Learning progress</button><p class="small muted">Export Learning progress above first if you want a recovery copy.</p>`;
 stack.append(card);

 card.querySelector('#reset-learning-progress').addEventListener('click',async()=>{
  const ok=confirm('Reset Zin Learning to Day 1?\n\nThis clears only Learning course progress on this device. Flashcards/SRS and Supabase data are not changed.\n\nThis cannot be undone unless you exported a Learning backup.');
  if(!ok)return;
  const button=card.querySelector('#reset-learning-progress');
  button.disabled=true;
  button.textContent='Resetting Learning…';
  try{
   const content=await loadContent();
   createRepository(localStorage,content).resetLearning();
   location.reload();
  }catch(error){
   button.disabled=false;
   button.textContent='Reset Learning progress';
   const message=document.getElementById('system-message');
   if(message)message.innerHTML=`<div class="error-message">${String(error?.message||error).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</div>`;
  }
 });
}

new MutationObserver(installResetControl).observe(document.getElementById('content'),{childList:true,subtree:true});
installResetControl();
