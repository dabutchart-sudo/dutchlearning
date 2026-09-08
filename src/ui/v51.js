import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://dntitlrtvkgisxwqjxch.supabase.co';
const SUPABASE_KEY='sb_publishable_0QmYB4lwmjfJLkY3pH5dCQ_EVKC47Lb';
const STORAGE_KEY='dutch_sentence_trainer_v5';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let syncing=false,lastRevision=-1;

const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localState=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}};
const setStatus=t=>{const f=document.querySelector('#offline-status');if(f)f.textContent=t};

function diffWordHtml(actual,expected){
 const a=String(actual),e=String(expected);let p=0;while(p<a.length&&p<e.length&&a[p]===e[p])p++;
 let s=0;while(s<a.length-p&&s<e.length-p&&a[a.length-1-s]===e[e.length-1-s])s++;
 const left=escapeHtml(a.slice(0,p)),mid=a.slice(p,a.length-s),right=escapeHtml(a.slice(a.length-s));
 if(!mid&&e.length>a.length)return `${left}<mark class="problem-char" aria-label="missing letter">_</mark>${right}`;
 return `${left}<mark class="problem-char">${escapeHtml(mid||a[p]||'')}</mark>${right}`;
}
function enhanceCorrection(){
 const type=document.querySelector('.q-type');if(!type||type.textContent.trim()!=='Correct the Dutch sentence')return;
 const prompt=document.querySelector('.question-card .prompt');if(!prompt||prompt.dataset.v51==='1')return;
 const q=localState()?.pending;if(!q?.answer||!q?.prompt)return;
 const a=q.prompt.split(/\s+/),e=q.answer.split(/\s+/);let i=a.findIndex((w,n)=>w!==e[n]);
 if(i<0)return;const parts=a.map((w,n)=>n===i?diffWordHtml(w,e[n]||''):escapeHtml(w));
 prompt.innerHTML=parts.join(' ');prompt.dataset.v51='1';
}
function enhanceVocabulary(){
 const direction=document.querySelector('.direction');if(!direction||!direction.textContent.includes('Vocabulary reminder'))return;
 const card=direction.closest('.card');if(!card||card.dataset.v51==='1')return;card.dataset.v51='1';
 const rows=[...card.querySelectorAll('.vocabulary-list .row')];
 if(rows.length&&rows.every(r=>r.querySelector('.pill')?.textContent.includes('Mature card'))){
   const b=document.querySelector('#words-learned');if(b)setTimeout(()=>b.click(),0);return;
 }
 card.querySelectorAll('p.muted').forEach(p=>{if(/scored questions today/i.test(p.textContent))p.remove()});
 const q=localState()?.pending;
 if(q?.answer){const box=document.createElement('div');box.className='teach-panel v51-context';box.innerHTML=`<div class="eyebrow">In context</div><div class="teach-example"><strong lang="nl">${escapeHtml(q.answer)}</strong>${q.cue?`<br><span class="muted">${escapeHtml(q.cue)}</span>`:''}</div>`;card.querySelector('.vocabulary-list')?.after(box);}
 const h=card.querySelector('h2');if(h&&/A few words before you practise/i.test(h.textContent))h.textContent=rows.length===1?'One useful word before you practise':'A few useful words before you practise';
}
function injectSyncPanel(){
 const settings=document.querySelector('.settings-row')?.parentElement;if(!settings||document.querySelector('#v51-sync'))return;
 const panel=document.createElement('section');panel.id='v51-sync';panel.className='settings-row';panel.innerHTML='<div class="eyebrow">Cross-device sync</div><h3>Supabase</h3><div id="v51-sync-body"><p class="muted small">Checking sign-in…</p></div>';
 settings.appendChild(panel);renderSyncPanel();
}
async function renderSyncPanel(){
 const body=document.querySelector('#v51-sync-body');if(!body)return;const {data:{user}}=await supabase.auth.getUser();
 if(user){body.innerHTML=`<p class="small">Signed in as <strong>${escapeHtml(user.email||'your account')}</strong></p><div class="assist-row"><button class="secondary" id="sync-now">Sync now</button><button class="secondary" id="sync-out">Sign out</button></div>`;document.querySelector('#sync-now').onclick=()=>syncNow(true);document.querySelector('#sync-out').onclick=async()=>{await supabase.auth.signOut();location.reload()};}
 else{body.innerHTML='<p class="muted small">Use the same email on your Mac and iPhone. We will send a secure sign-in link.</p><input id="sync-email" class="input" type="email" autocomplete="email" placeholder="Email address"><div class="spaced"><button class="primary" id="sync-signin">Email me a sign-in link</button></div><p id="sync-message" class="muted small"></p>';document.querySelector('#sync-signin').onclick=async()=>{const email=document.querySelector('#sync-email').value.trim();if(!email)return;const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:location.href.split('#')[0]}});document.querySelector('#sync-message').textContent=error?error.message:'Check your email for the sign-in link.'};}
}
async function pushAttempts(user,state){
 const rows=(state.attempts||[]).filter(a=>/^[0-9a-f-]{36}$/i.test(a.id||'')).map(a=>({id:a.id,user_id:user.id,attempted_at:a.occurredAt||new Date().toISOString(),day:a.date,concept_id:a.concept,direction:a.direction,exercise_type:a.kind,phase:a.phase,source_id:a.sourceId||null,answer:String(a.answer??''),correct_answer:String(a.expected??''),grammar_correct:a.grammar===true,spelling_correct:a.spelling==null?null:!!a.spelling,error_types:a.errorType?[String(a.errorType)]:[],used_help:!!a.assisted}));
 if(rows.length)await supabase.from('trainer_attempts').upsert(rows,{onConflict:'id',ignoreDuplicates:true});
}
async function syncNow(manual=false){
 if(syncing)return;syncing=true;try{const {data:{user}}=await supabase.auth.getUser();if(!user){if(manual)setStatus('Offline progress saved on this device');return;}const local=localState();if(!local)return;
 const {data:remote,error}=await supabase.from('trainer_state').select('state,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;
 const lr=Number(local.revision||0),rr=Number(remote?.state?.revision||-1);
 if(!remote){await supabase.from('trainer_state').upsert({user_id:user.id,state:local,updated_at:new Date().toISOString()});await pushAttempts(user,local);}
 else if(rr>lr){localStorage.setItem(STORAGE_KEY,JSON.stringify(remote.state));setStatus('Newer progress downloaded — reloading…');setTimeout(()=>location.reload(),250);return;}
 else if(lr>rr){await supabase.from('trainer_state').upsert({user_id:user.id,state:local,updated_at:new Date().toISOString()});await pushAttempts(user,local);}
 lastRevision=Number(localState()?.revision||0);setStatus('Progress synced');if(manual)renderSyncPanel();
 }catch(e){setStatus('Offline — progress saved locally');console.warn('Trainer sync:',e)}finally{syncing=false}}

const observer=new MutationObserver(()=>{enhanceCorrection();enhanceVocabulary();injectSyncPanel()});observer.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('online',()=>syncNow());supabase.auth.onAuthStateChange(()=>{renderSyncPanel();setTimeout(()=>syncNow(),0)});
setInterval(()=>{const r=Number(localState()?.revision||0);if(r!==lastRevision)syncNow()},4000);
setTimeout(()=>{enhanceCorrection();enhanceVocabulary();injectSyncPanel();syncNow()},500);
