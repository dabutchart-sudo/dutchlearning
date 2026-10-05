import {SPEAKING_MAX_AUDIO_BYTES} from './speaking-budget.js';
import {classifyOrigin} from './study-origin.js';

// Local preview transcription. The browser posts audio only.
export const SPEAKING_TRANSCRIPTION_PATH='/preview/stt';
// Production route. It stays dark until the function is deployed and enabled.
export const SPEAKING_TRANSCRIPTION_FUNCTION='https://dntitlrtvkgisxwqjxch.supabase.co/functions/v1/speaking-transcription';
const LEARNING_AUTH_KEY='sb-dntitlrtvkgisxwqjxch-auth-token';
const PUBLISHABLE_KEY='sb_publishable_0QmYB4lwmjfJLkY3pH5dCQ_EVKC47Lb';

export function learningAccessToken(storage=globalThis.localStorage){
 try{
  const raw=storage?.getItem?.(LEARNING_AUTH_KEY);
  if(!raw)return '';
  const parsed=JSON.parse(raw);
  return String(parsed?.access_token||parsed?.currentSession?.access_token||'').trim();
 }catch{return '';}
}

export async function transcribeSpokenAnswer(blob,{fetchImpl=globalThis.fetch,path=SPEAKING_TRANSCRIPTION_PATH,origin='',accessToken=learningAccessToken}={}){
 if(!blob||typeof blob.size!=='number'||blob.size<1||blob.size>SPEAKING_MAX_AUDIO_BYTES)return Object.freeze({ok:false,speechIssue:'unavailable',text:''});
 const production=classifyOrigin(origin)==='production';
 try{
  const body=new FormData();
  body.append('audio',blob,'speech.webm');
  let response;
  if(production){
   const token=String(await accessToken()||'').trim();
   if(!token)return Object.freeze({ok:false,speechIssue:'unavailable',text:''});
   response=await fetchImpl(SPEAKING_TRANSCRIPTION_FUNCTION,{method:'POST',headers:{Authorization:`Bearer ${token}`,apikey:PUBLISHABLE_KEY},body});
  }else response=await fetchImpl(path,{method:'POST',body});
  const payload=await response.json().catch(()=>({}));
  const text=String(payload?.text||'').trim();
  if(!response.ok)return Object.freeze({ok:false,speechIssue:'unavailable',text:''});
  if(!text)return Object.freeze({ok:false,speechIssue:'unclear',text:''});
  return Object.freeze({ok:true,speechIssue:null,text});
 }catch{
  return Object.freeze({ok:false,speechIssue:'unavailable',text:''});
 }
}
