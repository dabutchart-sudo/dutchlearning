import {flashcardSummary,remainingNewCards} from '../engine/flashcards.js';

const tab=document.getElementById('flashcards-preview-tab');
const contentEl=document.getElementById('content');
const message=document.getElementById('system-message');
let loaded=null;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const addDays=(date,n)=>{const d=new Date(date);d.setDate(d.getDate()+n);return d;};
const percent=value=>value===null||value===undefined?'—':`${Math.round(value*100)}%`;

function settings(){
  const number=(key,fallback)=>{const n=parseInt(localStorage.getItem(key)??'',10);return Number.isFinite(n)?n:fallback;};
  return {
    maxNew:number('dfc_max_new',5),
    retentionThreshold:number('dutch_flashcards_ret_threshold',0),
    reviewTarget:number('dutch_flashcards_review_target',60)
  };
}

function reviewLoadAllowance(rawLimit,dueReviews,target){
  if(!target||target<=0)return rawLimit;
  const ratio=Math.max(0,Number(dueReviews||0))/target;
  if(ratio>=1)return 0;
  if(ratio>=0.90)return Math.min(rawLimit,Math.max(1,Math.floor(rawLimit*0.20)));
  if(ratio>=0.70)return Math.min(rawLimit,Math.max(1,Math.ceil(rawLimit*0.50)));
  return rawLimit;
}

function adjustedMaxNew(history,dateToCheck,dueReviews,cfg){
  const raw=Math.max(0,cfg.maxNew);
  if(cfg.retentionThreshold>0){
    const dayReviews=history.filter(r=>r.timestamp&&String(r.timestamp).slice(0,10)===dateToCheck);
    if(dayReviews.length){
      const passed=dayReviews.filter(r=>String(r.rating).toLowerCase()!=='again').length;
      if((passed/dayReviews.length)*100<cfg.retentionThreshold)return 0;
    }
  }
  return Math.min(raw,reviewLoadAllowance(raw,dueReviews,cfg.reviewTarget));
}

async function fetchAll(base,key,table){
  const rows=[];const pageSize=1000;
  for(let from=0;;from+=pageSize){
    const to=from+pageSize-1;
    const response=await fetch(`${base}/rest/v1/${table}?select=*`,{
      headers:{apikey:key,Authorization:`Bearer ${key}`,Range:`${from}-${to}`,'Range-Unit':'items'}
    });
    if(!response.ok)throw new Error(`Could not read ${table} (${response.status}).`);
    const page=await response.json();rows.push(...page);
    if(page.length<pageSize)break;
  }
  return rows;
}

async function loadFlashcards(){
  // Temporary migration bridge: reuse the public browser configuration already used by
  // the standalone Flashcards PWA. No write request is made from this preview module.
  const config=await import('https://dabutchart-sudo.github.io/flashcards/constants.js');
  const [cards,history]=await Promise.all([
    fetchAll(config.SUPABASE_URL,config.SUPABASE_ANON_KEY,'cards'),
    fetchAll(config.SUPABASE_URL,config.SUPABASE_ANON_KEY,'reviewhistory')
  ]);
  return {cards,history,supabaseUrl:config.SUPABASE_URL};
}

function rangeHistory(history,days=30){
  const cutoff=addDays(new Date(),-(days-1));cutoff.setHours(0,0,0,0);
  return history.filter(h=>h.timestamp&&new Date(h.timestamp)>=cutoff);
}

function troubleWords(cards,history){
  const byCard=new Map();
  for(const h of history.filter(x=>x.review_type!=='new')){
    const id=String(h.cardid??h.card_id??'');if(!id)continue;
    const s=byCard.get(id)||{again:0,total:0};s.total++;if(String(h.rating).toLowerCase()==='again')s.again++;byCard.set(id,s);
  }
  return [...byCard.entries()].map(([id,s])=>{
    const card=cards.find(c=>String(c.id)===id);if(!card||card.suspended||!s.again)return null;
    return {card,again:s.again,retention:Math.round(((s.total-s.again)/s.total)*100)};
  }).filter(Boolean).sort((a,b)=>b.again-a.again||a.retention-b.retention).slice(0,5);
}

function render(data){
  const {cards,history,supabaseUrl}=data;const today=dayKey();const yesterday=dayKey(addDays(new Date(),-1));
  const cfg=settings();
  const dueReview=cards.filter(c=>!c.suspended&&c.type!=='new'&&c.due_date&&String(c.due_date).slice(0,10)<=today).length;
  const introducedToday=cards.filter(c=>!c.suspended&&c.first_seen&&String(c.first_seen).slice(0,10)===today).length;
  const complete=localStorage.getItem(`dutch_flashcards_completed_v1:${supabaseUrl}:${today}`)==='complete';
  const maxNew=adjustedMaxNew(history,yesterday,dueReview,cfg);
  const dueNew=remainingNewCards({configuredMax:cfg.maxNew,loadCap:maxNew,introducedToday,studyDayComplete:complete});
  const last30=rangeHistory(history,30);const summary=flashcardSummary(cards,last30);
  const todayReviews=history.filter(h=>h.timestamp&&dayKey(new Date(h.timestamp))===today).length;
  const trouble=troubleWords(cards,last30);
  const queueTotal=dueReview+dueNew;

  contentEl.innerHTML=`<section class="stack flashcards-preview">
    <article class="card evidence-card flashcard-hero">
      <div class="row"><div><div class="eyebrow">Flashcards · read-only migration preview</div><h2>${complete?'Flashcards complete for today':`${queueTotal} cards ready`}</h2></div><span class="status">No writes</span></div>
      <p class="muted">This screen is reading the same cards and review history as the standalone Flashcards app. Rating controls stay disabled until parity is proven.</p>
      <div class="flashcard-due-grid">
        <div class="metric"><span class="eyebrow">Reviews due</span><span class="n">${dueReview}</span></div>
        <div class="metric"><span class="eyebrow">New available</span><span class="n">${dueNew}</span></div>
        <div class="metric"><span class="eyebrow">Done today</span><span class="n">${todayReviews}</span></div>
        <div class="metric"><span class="eyebrow">Daily new ceiling</span><span class="n">${cfg.maxNew}</span></div>
      </div>
      <button class="primary" disabled>${complete?'Done for today':'Review session coming next'}</button>
    </article>

    <article class="card evidence-card">
      <div class="row"><div><div class="eyebrow">Last 30 days</div><h2>Flashcard retention</h2></div><div class="flashcard-retention">${percent(summary.retention.rate)}</div></div>
      <p class="muted">${summary.retention.correct} correct from ${summary.retention.total} review attempts. New-card introductions are excluded.</p>
      <div class="flashcard-due-grid">
        <div class="metric"><span class="eyebrow">Mastered</span><span class="n">${summary.mastered}</span></div>
        <div class="metric"><span class="eyebrow">Active cards</span><span class="n">${summary.active}</span></div>
        <div class="metric"><span class="eyebrow">Suspended</span><span class="n">${summary.suspended}</span></div>
        <div class="metric"><span class="eyebrow">Total cards</span><span class="n">${summary.total}</span></div>
      </div>
    </article>

    <article class="card evidence-card">
      <div class="eyebrow">Last 30 days</div><h2>Trouble words</h2>
      ${trouble.length?`<div class="recent-mistakes">${trouble.map(x=>`<div class="mistake-row"><div class="row"><strong lang="nl">${esc(x.card.dutch)}</strong><span class="pill">${x.again} Again</span></div><div class="mini">${esc(x.card.english)} · ${x.retention}% retained</div></div>`).join('')}</div>`:'<p class="muted">No troublesome review cards in this period.</p>'}
    </article>

    <article class="notice"><strong>Parity checkpoint.</strong> Compare the due-review count, new-card count, today count, retention and mastered totals with the standalone app. This preview deliberately cannot update Supabase.</article>
  </section>`;
}

async function openPreview(){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b===tab));
  message.innerHTML='';
  contentEl.innerHTML='<article class="card evidence-card"><h2>Reading your Flashcards data…</h2><p class="muted">Read-only: no review or card records can be changed from this screen.</p></article>';
  try{loaded=await loadFlashcards();render(loaded);}catch(error){contentEl.innerHTML=`<article class="card evidence-card"><h2>Flashcards preview could not load</h2><p class="muted">${esc(error.message)}</p><p class="small muted">The existing Flashcards app is unaffected.</p></article>`;}
}

if(tab){
  tab.addEventListener('click',openPreview);
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>tab.classList.remove('active')));
}
