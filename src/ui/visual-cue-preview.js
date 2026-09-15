const params=new URLSearchParams(window.location.search);
const enabled=params.get('visual-preview')==='1'||params.get('visual-test')==='1';
const content=document.getElementById('content');
const tab=document.getElementById('flashcards-preview-tab');
let scheduled=false,card=null;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function loadCard(){
 if(card)return card;
 const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js');
 const res=await fetch(`${c.SUPABASE_URL}/rest/v1/cards?id=eq.175&select=id,dutch,english,partofword,image_url`,{headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`}});
 if(!res.ok)throw new Error(`Could not read preview card (${res.status}).`);
 const rows=await res.json();card=rows[0]||null;return card;
}
function panel(){return document.getElementById('visual-cue-preview-panel');}
function removePanel(){panel()?.remove();}
function anchor(){return document.querySelector('.flashcards-preview .flashcard-hero');}
async function render(){
 if(!enabled)return;
 const a=anchor();if(!a){removePanel();return;}
 if(panel())return;
 const record=await loadCard();if(!record?.image_url)return;
 const host=document.createElement('article');host.id='visual-cue-preview-panel';host.className='card evidence-card';
 host.innerHTML=`<div class="eyebrow">SAFE VISUAL-CUE PREVIEW</div><h2>See how image support feels</h2><p class="muted small">This uses the real image for <strong lang="nl">${esc(record.dutch)}</strong>, but it does not record a miss, change SRS, or save learning evidence.</p><button id="open-visual-cue-preview" class="secondary" type="button">Preview supported recall</button>`;
 a.insertAdjacentElement('afterend',host);
 document.getElementById('open-visual-cue-preview')?.addEventListener('click',()=>showPreview(record));
}
function showPreview(record){
 content.innerHTML=`<section class="flashcard-session"><article class="card production-card independent-production-card"><div class="eyebrow">Visual reinforcement · preview only</div><div class="production-prompt">${esc(record.english)}</div><div class="visual-recall-cue"><img src="${esc(record.image_url)}" alt="Visual cue for ${esc(record.english)}" loading="eager"></div><div class="mini muted">In real use this appears after a recall miss. The Dutch answer stays hidden so the picture can help you retrieve it.</div><div class="production-spelling"><input id="visual-preview-input" class="production-input" type="text" lang="nl" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type the Dutch answer"><button id="check-visual-preview" class="primary" disabled>Check answer</button></div><button id="leave-visual-preview" class="text-link">Back to Flashcards</button><div id="visual-preview-result"></div></article></section>`;
 const input=document.getElementById('visual-preview-input'),check=document.getElementById('check-visual-preview'),result=document.getElementById('visual-preview-result');
 input.addEventListener('input',()=>check.disabled=!input.value.trim());
 const complete=()=>{const answer=input.value.trim();const correct=answer.toLocaleLowerCase('nl-NL').replace(/[.!?]+$/,'')===String(record.dutch||'').trim().toLocaleLowerCase('nl-NL').replace(/[.!?]+$/,'');result.innerHTML=`<div class="production-result ${correct?'correct':'wrong'}"><div class="production-result-title">${correct?'That’s it':'Not quite'}</div><div class="production-result-row"><span>Correct answer</span><strong lang="nl">${esc(record.dutch)}</strong></div></div><p class="muted small">Preview only — nothing was recorded.</p>`;input.disabled=true;check.disabled=true;};
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.trim()&&!input.disabled)complete();});check.onclick=complete;
 document.getElementById('leave-visual-preview').onclick=()=>tab?.click();input.focus();
}
function refresh(){if(!enabled||scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render().catch(()=>{});});}
if(enabled&&content)new MutationObserver(()=>{const a=anchor(),p=panel();if(a&&!p)refresh();else if(!a&&p)removePanel();}).observe(content,{childList:true,subtree:true});
if(enabled)tab?.addEventListener('click',()=>setTimeout(refresh,0));
if(enabled)refresh();
