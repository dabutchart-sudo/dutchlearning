import {remainingNewCards,buildFlashcardQueue,applyFlashcardRating} from '../engine/flashcards.js';

const tab=document.getElementById('flashcards-preview-tab');
const content=document.getElementById('content');
let sandbox=null;
let scheduled=false;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const numberSetting=(key,fallback)=>{const n=parseInt(localStorage.getItem(key)??'',10);return Number.isFinite(n)?n:fallback;};

function config(){return {maxNew:numberSetting('dfc_max_new',5),retentionThreshold:numberSetting('dutch_flashcards_ret_threshold',0),reviewTarget:numberSetting('dutch_flashcards_review_target',60)};}
function reviewLoadAllowance(raw,due,target){if(!target||target<=0)return raw;const ratio=Math.max(0,Number(due||0))/target;if(ratio>=1)return 0;if(ratio>=.9)return Math.min(raw,Math.max(1,Math.floor(raw*.2)));if(ratio>=.7)return Math.min(raw,Math.max(1,Math.ceil(raw*.5)));return raw;}
function adjustedMaxNew(history,previousDate,due,cfg){const raw=Math.max(0,cfg.maxNew);if(cfg.retentionThreshold>0){const rs=history.filter(r=>r.timestamp&&String(r.timestamp).slice(0,10)===previousDate);if(rs.length&&rs.filter(r=>String(r.rating).toLowerCase()!=='again').length/rs.length*100<cfg.retentionThreshold)return 0;}return Math.min(raw,reviewLoadAllowance(raw,due,cfg.reviewTarget));}

async function fetchAll(base,key,table){const rows=[],size=1000;for(let from=0;;from+=size){const res=await fetch(`${base}/rest/v1/${table}?select=*`,{headers:{apikey:key,Authorization:`Bearer ${key}`,Range:`${from}-${from+size-1}`,'Range-Unit':'items'}});if(!res.ok)throw new Error(`Could not read ${table} (${res.status}).`);const page=await res.json();rows.push(...page);if(page.length<size)break;}return rows;}
async function loadSnapshot(){const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js');const [cards,history]=await Promise.all([fetchAll(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,'cards'),fetchAll(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,'reviewhistory')]);return {cards,history};}

function injectButton(){
 const hero=document.querySelector('.flashcards-preview .flashcard-hero');
 if(!hero||document.getElementById('start-flashcard-sandbox'))return;
 const live=document.getElementById('start-flashcard-review');
 if(!live)return;
 const wrap=document.createElement('div');
 wrap.className='spaced';
 wrap.innerHTML='<button id="start-flashcard-sandbox" class="secondary">Safe test tomorrow\'s queue</button><p class="muted small">Sandbox only: reads your live cards, but never writes ratings, intervals, review history or completion state.</p>';
 live.insertAdjacentElement('afterend',wrap);
 document.getElementById('start-flashcard-sandbox').addEventListener('click',startSandbox);
}

async function startSandbox(){
 const button=document.getElementById('start-flashcard-sandbox');
 if(button)button.disabled=true;
 try{
  const data=await loadSnapshot();
  const targetDate=dayKey(addDays(new Date(),1));
  const previousDate=dayKey(new Date());
  const cfg=config();
  const active=data.cards.filter(c=>!c.suspended);
  const dueReview=active.filter(c=>c.type!=='new'&&c.due_date&&String(c.due_date).slice(0,10)<=targetDate).length;
  const introducedTarget=active.filter(c=>c.first_seen&&String(c.first_seen).slice(0,10)===targetDate).length;
  const loadCap=adjustedMaxNew(data.history,previousDate,dueReview,cfg);
  const dueNew=remainingNewCards({configuredMax:cfg.maxNew,loadCap,introducedToday:introducedTarget,studyDayComplete:false});
  const cloned=active.map(c=>({...c}));
  const queue=buildFlashcardQueue(cloned,{today:targetDate,newLimit:dueNew});
  if(!queue.length){alert(`No Flashcards are currently predicted for ${targetDate}.`);return;}
  if(!confirm(`SAFE FLASHCARD SANDBOX\n\nThis will simulate the ${queue.length}-card queue currently predicted for ${targetDate}.\n\nNothing in Supabase will be changed. Ratings exist only in memory and disappear when you leave the sandbox.\n\nStart the test?`))return;
  sandbox={targetDate,queue,total:queue.length,completed:0,flipped:false};
  renderSandboxCard();
 }catch(e){alert(`Sandbox could not start: ${e.message}`);}finally{if(button)button.disabled=false;}
}

function current(){return sandbox?.queue?.[0]||null;}
function speakDutch(){const c=current();if(!c)return;const u=new SpeechSynthesisUtterance(String(c.dutch||'').replace(/\s*\(.*?\)/g,'').trim());u.lang='nl-NL';speechSynthesis.cancel();speechSynthesis.speak(u);}
function exitSandbox(){sandbox=null;tab?.click();}

function renderSandboxCard(){
 const c=current();
 if(!c){
  content.innerHTML=`<section class="flashcards-preview"><article class="card evidence-card complete"><div class="bigcheck">✓</div><div class="eyebrow">SAFE SANDBOX</div><h2>Simulation complete</h2><p class="muted">${sandbox.completed} simulated ratings were processed through the real scheduling logic. Supabase received zero writes, and your Flashcard completion state was not changed.</p><button id="leave-sandbox-complete" class="primary">Back to Flashcards</button></article></section>`;
  document.getElementById('leave-sandbox-complete').onclick=exitSandbox;
  return;
 }
 const progress=sandbox.total?Math.max(0,Math.min(100,(sandbox.completed/sandbox.total)*100)):0;
 const part=c.partofword?` <span class="muted small">(${esc(c.partofword)})</span>`:'';
 content.innerHTML=`<section class="flashcard-session"><div class="session-head"><strong>${sandbox.queue.length} remaining</strong><span class="pill">SAFE SANDBOX · ${esc(sandbox.targetDate)}</span></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><article class="card evidence-card"><div class="eyebrow">No database writes</div><p class="muted small">Again / Hard / Good / Easy use the real scheduling code, but all changes stay in memory only.</p></article><article id="sandbox-review-card" class="card flashcard-review-card" role="button" tabindex="0">${sandbox.flipped?`<div class="eyebrow">English</div><div class="flashcard-word">${esc(c.english)}</div>${c.english_sentence?`<div class="flashcard-sentence">${esc(c.english_sentence)}</div>`:''}`:`<div class="eyebrow">Dutch</div><div class="flashcard-word" lang="nl">${esc(c.dutch)}${part}</div>${c.dutch_sentence?`<div class="flashcard-sentence" lang="nl">${esc(c.dutch_sentence)}</div>`:''}<button id="sandbox-speak" class="secondary flashcard-listen">Listen</button>`}</article>${sandbox.flipped?`<button id="sandbox-show-front" class="secondary">Show Dutch</button><div class="flashcard-rating-grid">${['again','hard','good','easy'].map(r=>`<button data-sandbox-rating="${r}" class="rating ${r}">${r[0].toUpperCase()+r.slice(1)}</button>`).join('')}</div>`:'<button id="sandbox-show-answer" class="primary">Show answer</button>'}<button id="leave-flashcard-sandbox" class="text-link">Exit sandbox — discard simulation</button></section>`;
 const setSide=flipped=>{sandbox.flipped=flipped;renderSandboxCard();};
 document.getElementById('sandbox-show-answer')?.addEventListener('click',()=>setSide(true));
 document.getElementById('sandbox-show-front')?.addEventListener('click',()=>setSide(false));
 document.getElementById('sandbox-review-card')?.addEventListener('click',e=>{if(e.target.id!=='sandbox-speak')setSide(!sandbox.flipped);});
 document.getElementById('sandbox-speak')?.addEventListener('click',e=>{e.stopPropagation();speakDutch();});
 document.querySelectorAll('[data-sandbox-rating]').forEach(b=>b.onclick=()=>rateSandbox(b.dataset.sandboxRating));
 document.getElementById('leave-flashcard-sandbox').onclick=exitSandbox;
}

function rateSandbox(rating){
 if(!sandbox?.flipped)return;
 const original=current();
 const result=applyFlashcardRating(original,rating,{today:sandbox.targetDate,nowIso:new Date().toISOString()});
 Object.assign(original,result.card);
 sandbox.queue.shift();
 sandbox.completed++;
 if(result.requeue)sandbox.queue.splice(Math.min(3,sandbox.queue.length),0,original);
 sandbox.flipped=false;
 renderSandboxCard();
}

function refresh(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;if(!sandbox)injectButton();});}
new MutationObserver(refresh).observe(content,{childList:true,subtree:true});
tab?.addEventListener('click',()=>setTimeout(refresh,0));
refresh();
