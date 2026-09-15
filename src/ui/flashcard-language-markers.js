import {languageMarker} from '../engine/language-marker.js';

const content=document.getElementById('content');

function applyLanguageMarker(){
 const label=document.querySelector('.flashcard-review-card > .eyebrow');
 if(!label)return;
 const info=languageMarker(label.textContent);
 if(!info||label.dataset.languageMarker===info.language)return;
 label.textContent=info.marker;
 label.dataset.languageMarker=info.language;
 label.classList.add('flashcard-language-marker');
 label.setAttribute('role','img');
 label.setAttribute('aria-label',info.language);
 label.title=info.language;
}

new MutationObserver(applyLanguageMarker).observe(content,{childList:true,subtree:true});
applyLanguageMarker();
