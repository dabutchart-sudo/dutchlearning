import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {SPEAKING_ATTEMPT_COST_GBP,SPEAKING_MAX_AUDIO_BYTES,SPEAKING_MONTHLY_BUDGET_GBP,speakingBudgetDecision} from '../../../src/engine/speaking-budget.js';

const cors={
 'Access-Control-Allow-Origin':'*',
 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
 'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const DUTCH_TRANSCRIPTION_PROMPT='Dit is een korte Nederlandse zin van een beginnende cursist. Schrijf alleen de gesproken Nederlandse woorden uit; vertaal niet naar het Engels.';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});

Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({error:'Method not allowed.'},405);

 const supabaseUrl=Deno.env.get('SUPABASE_URL');
 const anonKey=Deno.env.get('SUPABASE_ANON_KEY');
 const serviceRole=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const openaiKey=(Deno.env.get('OPENAI_API_KEY')||'').trim();
 if(!supabaseUrl||!anonKey||!serviceRole)return json({error:'Server configuration is incomplete.'},500);

 const enabled=Deno.env.get('SPEAKING_TRANSCRIPTION_ENABLED')==='true';
 if(!enabled)return json({error:'Speaking transcription is not enabled.'},503);
 if(!openaiKey)return json({error:'Speaking transcription is not configured.'},503);

 const authHeader=req.headers.get('Authorization')||'';
 if(!authHeader.startsWith('Bearer '))return json({error:'Authentication required.'},401);
 const authClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authHeader}}});
 const {data:userData,error:userError}=await authClient.auth.getUser();
 if(userError||!userData.user)return json({error:'Authentication required.'},401);

 let form:FormData;
 try{form=await req.formData();}catch{return json({error:'A spoken recording is required.'},400);}
 const audio=form.get('audio');
 if(!(audio instanceof File)||audio.size<1||audio.size>SPEAKING_MAX_AUDIO_BYTES)return json({error:'A short spoken recording is required.'},400);

 const preview=speakingBudgetDecision({usedPence:0,audioBytes:audio.size,enabled:true,configuredCeilingPence:SPEAKING_MONTHLY_BUDGET_GBP*100});
 if(!preview.allowed)return json({error:'Speaking transcription is not available.'},preview.reason==='audio-too-large'?413:503);

 const admin=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false}});
 const {data:reservation,error:reserveError}=await admin.rpc('reserve_speaking_transcription',{
  p_user_id:userData.user.id,
  p_audio_bytes:audio.size,
  p_estimated_cost_gbp:SPEAKING_ATTEMPT_COST_GBP,
  p_monthly_budget_gbp:SPEAKING_MONTHLY_BUDGET_GBP
 });
 const row=Array.isArray(reservation)?reservation[0]:reservation;
 if(reserveError||!row)return json({error:'Speaking transcription budget could not be verified.'},503);
 if(!row.allowed)return json({error:row.reason==='monthly-cost-ceiling-reached'?'This month’s speaking transcription allowance is used.':'Speaking transcription is not available.'},row.reason==='monthly-cost-ceiling-reached'?429:503);

 const attemptId=row.attempt_id;
 const finish=async(status:'succeeded'|'failed')=>{
  const {error}=await admin.rpc('finish_speaking_transcription',{p_attempt_id:attemptId,p_user_id:userData.user.id,p_status:status});
  if(error)console.error('Speaking transcription audit finalisation failed');
 };

 const body=new FormData();
 body.append('model','gpt-4o-mini-transcribe');
 body.append('language','nl');
 body.append('prompt',DUTCH_TRANSCRIPTION_PROMPT);
 body.append('file',audio,'speech.webm');
 let openai:Response;
 try{
  openai=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${openaiKey}`},body});
 }catch{
  await finish('failed');
  return json({error:'Speech could not be transcribed.'},502);
 }
 if(!openai.ok){
  await finish('failed');
  return json({error:'Speech could not be transcribed.'},502);
 }
 let text='';
 try{text=String((await openai.json())?.text||'').trim();}catch{text='';}
 await finish(text?'succeeded':'failed');
 if(!text)return json({error:'Speech could not be transcribed.'},422);
 return json({text});
});
