import {languageMarker} from '../engine/language-marker.js';

const content=document.getElementById('content');

function applyLanguageMarker(){
 document.querySelectorAll('.flashcard-face > .eyebrow,.flashcard-review-card > .eyebrow').forEach(label=>{
  const info=languageMarker(label.textContent);
  if(!info||label.dataset.languageMarker===info.language)return;
  label.textContent=info.marker;
  label.dataset.languageMarker=info.language;
  label.classList.add('flashcard-language-marker');
  label.setAttribute('role','img');
  label.setAttribute('aria-label',info.language);
  label.title=info.language;
 });
}

new MutationObserver(applyLanguageMarker).observe(content,{childList:true,subtree:true});
applyLanguageMarker();
