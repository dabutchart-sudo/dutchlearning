import {validateGeneratedVisual} from '../engine/visual-generation-response.js';
import {normalizeVisualGenerationStatus} from '../engine/visual-generation-status.js';

const AUTH_STORAGE_KEY='dutch_sentence_auth';
let clientPromise=null;

async function config(){
 const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js');
 if(!c.SUPABASE_URL||!c.SUPABASE_ANON_KEY)throw new Error('Visual generation configuration is unavailable.');
 return c;
}

async function visualClient(){
 if(clientPromise)return clientPromise;
 clientPromise=(async()=>{
  const [{createClient},c]=await Promise.all([
   import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'),
   config()
  ]);
  return createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,{auth:{storageKey:AUTH_STORAGE_KEY,flowType:'pkce'}});
 })();
 return clientPromise;
}

async function functionFailureMessage(error){
 const response=error?.context;
 let status='';let detail='';
 if(response&&typeof response.status!=='undefined')status=`HTTP ${response.status}${response.statusText?` ${response.statusText}`:''}`;
 if(response&&typeof response.clone==='function'){
  try{
   const raw=await response.clone().text();
   if(raw){
    try{const parsed=JSON.parse(raw);detail=parsed.error||parsed.message||raw;}
    catch{detail=raw;}
   }
  }catch{}
 }
 if(!detail&&error?.message)detail=error.message;
 return [status,detail].filter(Boolean).join(' — ')||'Visual generation failed with no server details.';
}

async function sessionClient(actionLabel){
 const client=await visualClient(),{data:sessionData,error:sessionError}=await client.auth.getSession();
 if(sessionError)throw sessionError;
 if(!sessionData.session)throw new Error(`Sign in with Google before ${actionLabel}.`);
 return client;
}

export async function visualGenerationUser(){
 const client=await visualClient(),{data,error}=await client.auth.getSession();
 if(error)throw error;
 return data.session?.user||null;
}

export async function visualGenerationStatus(){
 const client=await sessionClient('checking visual generation');
 const {data,error}=await client.functions.invoke('generate-visual',{body:{action:'status'}});
 if(error)throw new Error(`Visual generation status unavailable: ${await functionFailureMessage(error)}`);
 return normalizeVisualGenerationStatus(data);
}

export async function pendingGeneratedVisual(){
 const client=await sessionClient('checking pending visual review');
 const {data,error}=await client.functions.invoke('generate-visual',{body:{action:'pending-review'}});
 if(error)throw new Error(`Pending visual review unavailable: ${await functionFailureMessage(error)}`);
 if(!data?.pending)return null;
 return validateGeneratedVisual(data,data.cardId);
}

export async function requestGeneratedVisual(plan){
 if(!plan?.cardId)throw new Error('Visual generation requires a generation plan.');
 const client=await sessionClient('generating a visual cue');
 const {data,error}=await client.functions.invoke('generate-visual',{body:{cardId:String(plan.cardId)}});
 if(error)throw new Error(`Visual generation failed: ${await functionFailureMessage(error)}`);
 return validateGeneratedVisual(data,plan.cardId);
}

export async function approveGeneratedVisual(visual){
 if(!visual?.generationId||!visual?.cardId)throw new Error('Visual approval requires a staged generation.');
 const client=await sessionClient('approving a visual cue');
 const {data,error}=await client.functions.invoke('generate-visual',{body:{action:'approve',generationId:String(visual.generationId)}});
 if(error)throw new Error(`Visual approval failed: ${await functionFailureMessage(error)}`);
 return validateGeneratedVisual(data,visual.cardId);
}

export async function rejectGeneratedVisual(visual){
 if(!visual?.generationId||!visual?.cardId)throw new Error('Visual rejection requires a staged generation.');
 const client=await sessionClient('rejecting a visual cue');
 const {data,error}=await client.functions.invoke('generate-visual',{body:{action:'reject',generationId:String(visual.generationId)}});
 if(error)throw new Error(`Visual rejection failed: ${await functionFailureMessage(error)}`);
 if(String(data?.cardId||'')!==String(visual.cardId)||String(data?.status||'')!=='rejected')throw new Error('Visual rejection returned an unexpected response.');
 return data;
}
