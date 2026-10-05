// Existing local preview transcription. The browser posts audio only.
// It never receives a provider key. There is no new production service here.
export const SPEAKING_TRANSCRIPTION_PATH='/preview/stt';

export async function transcribeSpokenAnswer(blob,{fetchImpl=globalThis.fetch,path=SPEAKING_TRANSCRIPTION_PATH}={}){
 if(!blob||typeof blob.size!=='number'||blob.size<1)return Object.freeze({ok:false,speechIssue:'unavailable',text:''});
 try{
  const body=new FormData();
  body.append('audio',blob,'speech.webm');
  const response=await fetchImpl(path,{method:'POST',body});
  const payload=await response.json().catch(()=>({}));
  const text=String(payload?.text||'').trim();
  if(!response.ok)return Object.freeze({ok:false,speechIssue:'unavailable',text:''});
  if(!text)return Object.freeze({ok:false,speechIssue:'unclear',text:''});
  return Object.freeze({ok:true,speechIssue:null,text});
 }catch{
  return Object.freeze({ok:false,speechIssue:'unavailable',text:''});
 }
}
