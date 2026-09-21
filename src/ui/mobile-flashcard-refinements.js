import {speak} from './speech.js';

const content=document.getElementById('content');
const status=document.getElementById('system-message');

function decorate(root=document){
 root.querySelectorAll?.('#speak-card,#speak-card-back,#sandbox-speak,#sandbox-speak-back').forEach(listen=>{
  listen.dataset.icon='🔊';listen.setAttribute('aria-label','Listen to Dutch pronunciation');listen.title='Listen';
 });
 root.querySelectorAll?.('#flag-sentence,#flag-sentence-back,#sandbox-flag,#sandbox-flag-back').forEach(flag=>{
  flag.dataset.icon=flag.classList.contains('flagged')?'⚑':'⚐';flag.setAttribute('aria-label',flag.classList.contains('flagged')?'Sentence flagged':'Flag sentence');flag.title=flag.getAttribute('aria-label');
 });
 root.querySelectorAll?.('#edit-card,#edit-card-back,#sandbox-edit,#sandbox-edit-back').forEach(edit=>{
  edit.dataset.icon='✎';edit.setAttribute('aria-label','Edit flashcard');edit.title='Edit card';
 });
}

function currentDutch(){
 const host=document.getElementById('review-card')||document.getElementById('sandbox-review-card');
 const fromData=String(host?.dataset?.dutch||'').replace(/\s*\(.*?\)/g,'').trim();
 if(fromData)return fromData;
 const word=document.querySelector('.flashcard-review-card .flashcard-word[lang="nl"]');
 if(!word)return '';
 const spoken=word.cloneNode(true);
 spoken.querySelector?.('.flashcard-part')?.remove();
 return String(spoken.textContent||'').replace(/\s*\(.*?\)/g,'').trim();
}

document.addEventListener('click',event=>{
 const button=event.target.closest?.('#speak-card,#speak-card-back,#sandbox-speak,#sandbox-speak-back');
 if(!button)return;
 event.preventDefault();
 event.stopImmediatePropagation();
 const text=currentDutch();
 if(!text)return;
 speak(text,message=>{if(status)status.innerHTML=`<div class="error-message">${String(message).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</div>`;});
},true);

if(content){
 decorate(content);
 new MutationObserver(()=>decorate(content)).observe(content,{childList:true,subtree:true});
}
