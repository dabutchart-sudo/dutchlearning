import {historyIdentity,isReviewHistoryPost,isSchedulingPatch,parseJsonBody,srsSnapshot} from '../engine/flashcard-write-safety.js';

const JOURNAL_KEY='dutch_flashcards_pending_rating_v1';
const RECOVERY_MESSAGE_KEY='dutch_flashcards_rating_recovery_message';
const nativeFetch=globalThis.fetch?.bind(globalThis);
let recoveryFailed=false;

function readJournal(){try{return JSON.parse(localStorage.getItem(JOURNAL_KEY)||'null');}catch{return null;}}
function writeJournal(value){if(value)localStorage.setItem(JOURNAL_KEY,JSON.stringify(value));else localStorage.removeItem(JOURNAL_KEY);}
function cardIdFromUrl(url){try{return new URL(String(url),location.href).searchParams.get('id')?.replace(/^eq\./,'')||null;}catch{return null;}}
async function auth(){const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js');return {apikey:c.SUPABASE_ANON_KEY,Authorization:`Bearer ${c.SUPABASE_ANON_KEY}`};}
async function loadCardSnapshot(url){const id=cardIdFromUrl(url);if(!id)return null;const target=new URL(String(url),location.href);target.search='';target.searchParams.set('select','type,interval,ease,reps,lapses,first_seen,last_reviewed,due_date');target.searchParams.set('id',`eq.${id}`);target.searchParams.set('limit','1');const res=await nativeFetch(target.toString(),{headers:await auth(),cache:'no-store'});if(!res.ok)return null;const rows=await res.json();return rows[0]?srsSnapshot(rows[0]):null;}
async function rollback(journal){if(!journal?.cardUrl||!journal?.snapshot)return false;try{const headers={...(await auth()),'Content-Type':'application/json',Prefer:'return=minimal'};const res=await nativeFetch(journal.cardUrl,{method:'PATCH',headers,body:JSON.stringify(journal.snapshot)});if(!res.ok)return false;writeJournal(null);sessionStorage.setItem(RECOVERY_MESSAGE_KEY,'An interrupted Flashcard rating was safely rolled back. No partial scheduling change was kept.');return true;}catch{return false;}}
async function historyAlreadySaved(journal){const identity=journal?.expectedHistory;if(!identity||!journal?.historyUrl)return false;try{const target=new URL(journal.historyUrl,location.href);target.search='';target.searchParams.set('select','cardid,timestamp');target.searchParams.set('cardid',`eq.${identity.cardid}`);target.searchParams.set('timestamp',`eq.${identity.timestamp}`);target.searchParams.set('limit','1');const res=await nativeFetch(target.toString(),{headers:await auth(),cache:'no-store'});if(!res.ok)return false;const rows=await res.json();return Array.isArray(rows)&&rows.length>0;}catch{return false;}}
async function recoverPendingRating(){const journal=readJournal();if(!journal)return true;if(await historyAlreadySaved(journal)){writeJournal(null);sessionStorage.setItem(RECOVERY_MESSAGE_KEY,'An interrupted Flashcard save was checked and found complete.');return true;}const ok=await rollback(journal);recoveryFailed=!ok;return ok;}
function surfaceRecoveryState(){const message=document.getElementById('system-message');const recovered=sessionStorage.getItem(RECOVERY_MESSAGE_KEY);if(recovered&&message&&!message.textContent.trim()){message.innerHTML=`<div class="success-message">${recovered}</div>`;sessionStorage.removeItem(RECOVERY_MESSAGE_KEY);}if(!recoveryFailed)return;const button=document.getElementById('start-flashcard-review');if(button)button.disabled=true;if(message)message.innerHTML='<div class="error-message">A previous Flashcard rating may be partially saved. Live review is disabled to protect your schedule. Use the standalone Flashcards app until this is repaired.</div>';}

if(nativeFetch&&!globalThis.__dutchFlashcardWriteGuard){
 globalThis.__dutchFlashcardWriteGuard=true;
 globalThis.fetch=async function guardedFetch(input,options={}){
  const url=typeof input==='string'||input instanceof URL?String(input):String(input?.url||input);
  if(isSchedulingPatch(url,options)){
   const snapshot=await loadCardSnapshot(url);
   if(!snapshot)return nativeFetch(input,options);
   const journal={cardId:cardIdFromUrl(url),cardUrl:url,snapshot,phase:'prepared',createdAt:new Date().toISOString()};
   writeJournal(journal);
   try{const response=await nativeFetch(input,options);if(response.ok){journal.phase='card-updated';writeJournal(journal);}else writeJournal(null);return response;}catch(error){writeJournal(null);throw error;}
  }
  if(isReviewHistoryPost(url,options)){
   const journal=readJournal();
   if(!journal)return nativeFetch(input,options);
   const history=parseJsonBody(options.body),identity=historyIdentity(history);
   journal.phase='history-posting';journal.historyUrl=url;journal.expectedHistory=identity;writeJournal(journal);
   try{const response=await nativeFetch(input,options);if(response.ok){writeJournal(null);return response;}await rollback(journal);return response;}catch(error){await rollback(journal);throw error;}
  }
  return nativeFetch(input,options);
 };
 recoverPendingRating().finally(()=>{surfaceRecoveryState();new MutationObserver(surfaceRecoveryState).observe(document.getElementById('content'),{childList:true,subtree:true});});
}
