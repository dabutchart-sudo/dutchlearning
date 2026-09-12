const content=document.getElementById('content');
const tab=document.getElementById('flashcards-preview-tab');
let scheduled=false,adjusting=false;

function shell(){return document.querySelector('.flashcards-preview');}
function details(){return document.getElementById('flashcard-dashboard-details');}
function toggle(){return document.getElementById('flashcard-dashboard-details-toggle');}
function directCards(root){return root?[...root.children].filter(node=>node.matches?.('article.card')):[];}
function ensureDetails(root){
 let panel=details();
 if(panel)return panel;
 panel=document.createElement('section');
 panel.id='flashcard-dashboard-details';
 panel.className='flashcard-dashboard-details';
 panel.hidden=true;
 panel.innerHTML='<div class="flashcard-dashboard-details-head"><div><div class="eyebrow">PROGRESS & DETAILS</div><h2>Deeper flashcard data</h2></div><button id="flashcard-dashboard-details-close" class="text-link" type="button">Close details</button></div><div id="flashcard-dashboard-details-content" class="stack"></div>';
 root.appendChild(panel);
 panel.querySelector('#flashcard-dashboard-details-close')?.addEventListener('click',()=>setOpen(false));
 return panel;
}
function ensureToggle(root){
 let button=toggle();
 if(button)return button;
 const hero=root.querySelector('.flashcard-hero');if(!hero)return null;
 button=document.createElement('button');
 button.id='flashcard-dashboard-details-toggle';
 button.className='secondary flashcard-dashboard-details-toggle';
 button.type='button';
 button.textContent='Progress & details';
 hero.insertAdjacentElement('afterend',button);
 button.addEventListener('click',()=>setOpen(details()?.hidden!==false));
 return button;
}
function setOpen(open){
 const panel=details(),button=toggle();if(!panel)return;
 panel.hidden=!open;
 if(button){button.textContent=open?'Hide progress & details':'Progress & details';button.setAttribute('aria-expanded',String(open));}
 if(open)panel.scrollIntoView({block:'start',behavior:'smooth'});
}
function moveDeepPanels(root,panel){
 const target=panel.querySelector('#flashcard-dashboard-details-content');if(!target)return;
 const cards=directCards(root);
 // Keep the daily SRS and active-recall action cards on the main page. Move the historic/statistical cards.
 cards.slice(2).forEach(card=>{if(card!==panel&&!card.closest('#flashcard-dashboard-details'))target.appendChild(card);});
 // These are diagnostic/progress panels injected by other modules. Keep anything requiring an immediate decision visible.
 ['#production-progress-panel','#visual-semantic-review-panel'].forEach(selector=>{
  const node=document.querySelector(selector);if(node&&!node.closest('#flashcard-dashboard-details'))target.appendChild(node);
 });
 const generation=document.getElementById('visual-generation-panel');
 if(generation&&!generation.textContent.includes('AWAITING REVIEW')&&!generation.closest('#flashcard-dashboard-details'))target.appendChild(generation);
}
function compactActiveRecall(root){
 const active=directCards(root)[1];if(!active)return;
 active.classList.add('flashcard-dashboard-action-card');
 const stages=active.querySelector('.production-stage-grid');if(stages)stages.classList.add('flashcard-dashboard-secondary-data');
 const intro=[...active.querySelectorAll(':scope > p.muted')][0];if(intro)intro.classList.add('flashcard-dashboard-secondary-data');
}
function apply(){
 if(adjusting)return;
 const root=shell();if(!root)return;
 adjusting=true;
 try{
  const panel=ensureDetails(root);ensureToggle(root);compactActiveRecall(root);moveDeepPanels(root,panel);
 }finally{adjusting=false;}
}
function refresh(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;apply();});}
if(content)new MutationObserver(()=>{if(!adjusting)refresh();}).observe(content,{childList:true,subtree:true});
tab?.addEventListener('click',()=>setTimeout(refresh,0));
refresh();
