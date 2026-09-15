import {speak} from './speech.js';

const content=document.getElementById('content');
const status=document.getElementById('system-message');

function decorate(root=document){
 const listen=root.querySelector?.('#speak-card');
 if(listen){listen.dataset.icon='🔊';listen.setAttribute('aria-label','Listen to Dutch pronunciation');listen.title='Listen';}
 const flag=root.querySelector?.('#flag-sentence');
 if(flag){flag.dataset.icon=flag.classList.contains('flagged')?'⚑':'⚐';flag.setAttribute('aria-label',flag.classList.contains('flagged')?'Sentence flagged':'Flag sentence');flag.title=flag.getAttribute('aria-label');}
 const edit=root.querySelector?.('#edit-card');
 if(edit){edit.dataset.icon='✎';edit.setAttribute('aria-label','Edit flashcard');edit.title='Edit card';}
}

function currentDutch(){
 const word=document.querySelector('.flashcard-review-card .flashcard-word[lang="nl"]');
 if(!word)return '';
 const spoken=word.cloneNode(true);
 spoken.querySelector?.('.flashcard-part')?.remove();
 return String(spoken.textContent||'').replace(/\s*\(.*?\)/g,'').trim();
}

document.addEventListener('click',event=>{
 const button=event.target.closest?.('#speak-card');
 if(!button)return;
 event.preventDefault();
 event.stopImmediatePropagation();
 const text=currentDutch();
 if(!text)return;
 speak(text,message=>{if(status)status.textContent=message;});
},true);

if(content){
 decorate(content);
 new MutationObserver(()=>decorate(content)).observe(content,{childList:true,subtree:true});
}
