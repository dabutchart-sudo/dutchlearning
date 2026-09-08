import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://dntitlrtvkgisxwqjxch.supabase.co';
const SUPABASE_KEY='sb_publishable_0QmYB4lwmjfJLkY3pH5dCQ_EVKC47Lb';
const STORAGE_KEY='dutch_sentence_trainer_v5';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let syncing=false,lastRevision=-1;

const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localState=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}};
const setStatus=t=>{const f=document.querySelector('#offline-status');if(f)f.textContent=t};

function injectSyncPanel(){
 const settings=document.querySelector('.settings-row')?.parentElement;if(!settings||document.querySelector('#v51-sync'))return;
 const panel=document.createElement('section');panel.id='v51-sync';panel.className='settings-row sync-panel';panel.innerHTML='<div class="eyebrow">Cross-device sync</div><h3>Supabase</h3><div id="v51-sync-body"><p class="muted small">Checking sign-in…</p></div>';
 settings.appendChild(panel);renderSyncPanel();
}

async function renderSyncPanel(){
 const body=document.querySelector('#v51-sync-body');if(!body)return;
 const {data:{user},error}=await supabase.auth.getUser();
 if(error)console.warn('Supabase auth:',error);
 if(user){
   body.innerHTML=`<p class="small sync-good">✓ Signed in as <strong>${escapeHtml(user.email||'your account')}</strong></p><p class="muted small">Progress is saved locally immediately and synced after answers, when the app opens, and when it comes back online.</p><div class="assist-row"><button class="secondary" id="sync-now">Sync now</button><button class="secondary" id="sync-out">Sign out</button></div><p id="sync-message" class="muted small"></p>`;
   document.querySelector('#sync-now').onclick=()=>syncNow(true);
   document.querySelector('#sync-out').onclick=async()=>{await supabase.auth.signOut();location.reload()};
 }else{
   body.innerHTML='<p class="muted small">Sync is currently off. Your progress is safe on this device, but it will not appear on another device until you sign in.</p><input id="sync-email" class="input" type="email" autocomplete="email" placeholder="Email address"><div class="spaced"><button class="primary" id="sync-signin">Email me a sign-in link</button></div><p id="sync-message" class="muted small"></p>';
   document.querySelector('#sync-signin').onclick=async()=>{const email=document.querySelector('#sync-email').value.trim();if(!email)return;const msg=document.querySelector('#sync-message');msg.textContent='Sending sign-in link…';const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:location.href.split('#')[0]}});msg.textContent=error?error.message:'Check your email for the sign-in link.'};
 }
}

async function pushAttempts(user,state){
 const rows=(state.attempts||[]).filter(a=>/^[0-9a-f-]{36}$/i.test(a.id||'')).map(a=>({
   id:a.id,user_id:user.id,attempted_at:a.occurredAt||new Date().toISOString(),day:a.date,concept_id:a.concept,direction:a.direction,exercise_type:a.kind,phase:a.phase,source_id:a.sourceId||null,answer:String(a.answer??''),correct_answer:String(a.expected??''),grammar_correct:a.grammar===true,spelling_correct:a.spelling==null?null:!!a.spelling,error_types:[...(a.errorType?[String(a.errorType)]:[]),...(a.capitalization===false?['capitalization']:[])],used_help:!!a.assisted
 }));
 if(!rows.length)return;
 const {error}=await supabase.from('trainer_attempts').upsert(rows,{onConflict:'id',ignoreDuplicates:true});if(error)throw error;
}

async function syncNow(manual=false){
 if(syncing)return;syncing=true;
 try{
   const {data:{user}}=await supabase.auth.getUser();
   if(!user){if(manual)setStatus('Progress saved locally · sign in in Settings to sync');return;}
   const local=localState();if(!local)return;
   const {data:remote,error}=await supabase.from('trainer_state').select('state,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;
   const lr=Number(local.revision||0),rr=Number(remote?.state?.revision||-1);
   if(!remote){
     const {error:e}=await supabase.from('trainer_state').upsert({user_id:user.id,state:local,updated_at:new Date().toISOString()});if(e)throw e;await pushAttempts(user,local);
   }else if(rr>lr){
     localStorage.setItem(STORAGE_KEY,JSON.stringify(remote.state));setStatus('Newer progress downloaded — reloading…');setTimeout(()=>location.reload(),250);return;
   }else if(lr>rr){
     const {error:e}=await supabase.from('trainer_state').upsert({user_id:user.id,state:local,updated_at:new Date().toISOString()});if(e)throw e;await pushAttempts(user,local);
   }else{
     await pushAttempts(user,local);
   }
   lastRevision=Number(localState()?.revision||0);setStatus('Progress synced');
   if(manual){const msg=document.querySelector('#sync-message');if(msg)msg.textContent='Synced just now.';renderSyncPanel();}
 }catch(e){setStatus('Offline — progress saved locally');console.warn('Trainer sync:',e);const msg=document.querySelector('#sync-message');if(manual&&msg)msg.textContent='Sync failed: '+e.message}
 finally{syncing=false}
}

function enhance(){
 injectSyncPanel();
}

const observer=new MutationObserver(enhance);observer.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('online',()=>syncNow());
supabase.auth.onAuthStateChange(()=>{renderSyncPanel();setTimeout(()=>syncNow(),0)});
setInterval(()=>{const r=Number(localState()?.revision||0);if(r!==lastRevision)syncNow()},2500);
setTimeout(async()=>{enhance();const {data:{user}}=await supabase.auth.getUser();setStatus(user?'Progress synced across devices':'Ready offline · progress saved locally');syncNow()},400);
