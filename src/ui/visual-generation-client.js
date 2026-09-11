import {validateGeneratedVisual} from '../engine/visual-generation-response.js';

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

export async function visualGenerationUser(){
 const client=await visualClient(),{data,error}=await client.auth.getSession();
 if(error)throw error;
 return data.session?.user||null;
}

export async function requestGeneratedVisual(plan){
 if(!plan?.cardId)throw new Error('Visual generation requires a generation plan.');
 const client=await visualClient(),{data:sessionData,error:sessionError}=await client.auth.getSession();
 if(sessionError)throw sessionError;
 if(!sessionData.session)throw new Error('Sign in with Google before generating a visual cue.');
 const {data,error}=await client.functions.invoke('generate-visual',{body:{cardId:String(plan.cardId)}});
 if(error)throw new Error(`Visual generation failed: ${await functionFailureMessage(error)}`);
 return validateGeneratedVisual(data,plan.cardId);
}
