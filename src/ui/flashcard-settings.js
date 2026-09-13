const content=document.getElementById('content');
const keys={maxNew:'dfc_max_new',reviewTarget:'dutch_flashcards_review_target',retention:'dutch_flashcards_ret_threshold'};
const read=(key,fallback)=>localStorage.getItem(key)??fallback;
function option(value,label,current){return `<option value="${value}" ${String(current)===String(value)?'selected':''}>${label}</option>`;}
function inject(){
  const settingsTab=document.querySelector('[data-view="settings"]');
  if(!settingsTab?.classList.contains('active')||document.getElementById('flashcard-settings-panel'))return;
  const stack=content.querySelector('.stack');if(!stack)return;
  const maxNew=read(keys.maxNew,'5'),target=read(keys.reviewTarget,'60'),retention=read(keys.retention,'0');
  const panel=document.createElement('article');panel.id='flashcard-settings-panel';panel.className='card evidence-card flashcard-settings-panel';
  panel.innerHTML=`<div class="eyebrow">FLASHCARDS</div><h2>Review settings</h2><p class="muted">These are the same controls used by the standalone Flashcards app. Your new-card value is a hard ceiling; review load may reduce it but never increase it.</p><div class="flashcard-setting-grid"><label><strong>Daily new cards</strong><span>Maximum new cards that may be introduced in a day.</span><select id="fc-max-new">${[5,10,15,20,30].map(v=>option(v,`${v} cards`,maxNew)).join('')}</select></label><label><strong>Daily review target</strong><span>New cards taper as due reviews approach this workload.</span><select id="fc-review-target">${[[0,'Disabled'],[40,'40 reviews'],[50,'50 reviews'],[60,'60 reviews'],[75,'75 reviews'],[100,'100 reviews']].map(([v,l])=>option(v,l,target)).join('')}</select></label><label><strong>Minimum retention for new cards</strong><span>If the previous day falls below this rate, new cards pause.</span><select id="fc-retention">${[[0,'Disabled'],[70,'70%'],[75,'75%'],[80,'80%'],[85,'85%'],[90,'90%']].map(([v,l])=>option(v,l,retention)).join('')}</select></label></div><p id="fc-settings-saved" class="small muted">Changes apply to the next Flashcard queue calculation.</p>`;
  stack.prepend(panel);
  const bind=(id,key)=>document.getElementById(id)?.addEventListener('change',e=>{localStorage.setItem(key,e.target.value);const status=document.getElementById('fc-settings-saved');if(status)status.textContent='Saved. The Flashcards screen will use this setting the next time it opens.';});
  bind('fc-max-new',keys.maxNew);bind('fc-review-target',keys.reviewTarget);bind('fc-retention',keys.retention);
}
new MutationObserver(()=>inject()).observe(content,{childList:true,subtree:true});
document.querySelector('[data-view="settings"]')?.addEventListener('click',()=>setTimeout(inject,0));
setTimeout(inject,0);
