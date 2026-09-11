import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders={
 'Access-Control-Allow-Origin':'*',
 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
 'Access-Control-Allow-Methods':'POST, OPTIONS'
};

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
const clean=(value:unknown)=>String(value??'').trim();
const positiveLimit=(name:string,fallback:number)=>{const value=Number(Deno.env.get(name));return Number.isFinite(value)&&value>=0?Math.trunc(value):fallback;};
const positiveMoney=(name:string)=>{const value=Number(Deno.env.get(name));return Number.isFinite(value)&&value>0?value:0;};
const roundMoney=(value:number)=>Math.round((Number(value)||0)*100)/100;
const RESERVATION_STALE_MINUTES=15;
const REVIEW_STALE_HOURS=24;

type AttemptStatus='reserved'|'awaiting_review'|'succeeded'|'rejected'|'failed';

function educationalPrompt(card:{english:string;partofword?:string|null}){
 const part=clean(card.partofword);
 const kind=part?` The vocabulary item is a ${part}.`:'';
 return `Create one simple, clear educational memory image that communicates the meaning "${clean(card.english)}" for a Dutch learner.${kind} Use an everyday, concrete scene where possible. Do not include written words, letters, captions, labels, flags, subtitles, or language-learning text. Avoid decorative details that do not help communicate the meaning.`;
}

function budgetStarts(now=new Date()){
 const day=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
 const month=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
 return {day:day.toISOString(),month:month.toISOString()};
}

async function finishAttempt(admin:any,id:string,status:AttemptStatus,extra:Record<string,unknown>={}){
 const payload={status,completed_at:['succeeded','rejected','failed'].includes(status)?new Date().toISOString():null,...extra};
 const {error}=await admin.from('visual_generation_log').update(payload).eq('id',id);
 if(error)console.error('Visual generation audit finalisation failed',error);
}

async function expireStaleReviews(admin:any,userId:string,bucket:string){
 const staleBefore=new Date(Date.now()-REVIEW_STALE_HOURS*60*60*1000).toISOString();
 const {data:staleReviews,error}=await admin.from('visual_generation_log').select('id,storage_path').eq('user_id',userId).eq('status','awaiting_review').lt('created_at',staleBefore);
 if(error){console.error('Stale visual review lookup failed',error);return;}
 for(const stale of staleReviews||[]){
  const path=clean(stale.storage_path);if(path)await admin.storage.from(bucket).remove([path]);
  await finishAttempt(admin,stale.id,'failed',{failure_reason:'stale-review'});
 }
}

Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Method not allowed.'},405);

 const supabaseUrl=Deno.env.get('SUPABASE_URL');
 const anonKey=Deno.env.get('SUPABASE_ANON_KEY');
 const serviceRole=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const openaiKey=Deno.env.get('OPENAI_API_KEY');
 if(!supabaseUrl||!anonKey||!serviceRole)return json({error:'Server configuration is incomplete.'},500);

 const authHeader=req.headers.get('Authorization')||'';
 if(!authHeader.startsWith('Bearer '))return json({error:'Authentication required.'},401);
 const authClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authHeader}}});
 const {data:userData,error:userError}=await authClient.auth.getUser();
 if(userError||!userData.user)return json({error:'Authentication required.'},401);

 let body:{action?:string;cardId?:string|number;generationId?:string};
 try{body=await req.json();}catch{return json({error:'Invalid JSON body.'},400);}

 const admin=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false}});
 const action=clean(body?.action).toLowerCase();
 const bucket=Deno.env.get('VISUAL_STORAGE_BUCKET')||'visual-cues';

 if(action==='pending-review'){
  await expireStaleReviews(admin,userData.user.id,bucket);
  const {data:attempt,error:attemptError}=await admin.from('visual_generation_log').select('id,card_id,status,image_url,model,estimated_cost_gbp,created_at').eq('user_id',userData.user.id).eq('status','awaiting_review').order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(attemptError){console.error('Pending visual review lookup failed',attemptError);return json({error:'Pending visual review could not be checked.'},500);}
  if(!attempt)return json({pending:false});
  const imageUrl=clean(attempt.image_url);
  if(!imageUrl)return json({error:'Pending visual review is incomplete.'},500);
  return json({pending:true,generationId:attempt.id,cardId:String(attempt.card_id),imageUrl,alt:'Visual memory cue',model:clean(attempt.model),estimatedCostGbp:Number(attempt.estimated_cost_gbp)||0,status:'awaiting_review'});
 }

 if(action==='approve'||action==='reject'){
  const generationId=clean(body?.generationId);
  if(!generationId)return json({error:'A generation id is required.'},400);
  const {data:attempt,error:attemptError}=await admin.from('visual_generation_log').select('id,card_id,status,image_url,storage_path').eq('id',generationId).eq('user_id',userData.user.id).single();
  if(attemptError||!attempt)return json({error:'Generated visual review was not found.'},404);
  if(attempt.status!=='awaiting_review')return json({error:'Generated visual is no longer awaiting review.'},409);
  const imageUrl=clean(attempt.image_url),storagePath=clean(attempt.storage_path);
  if(!imageUrl||!storagePath)return json({error:'Generated visual review is incomplete.'},500);
  if(action==='reject'){
   const {error:removeError}=await admin.storage.from(bucket).remove([storagePath]);
   if(removeError){console.error('Rejected visual cleanup failed',removeError);return json({error:'Rejected image could not be removed safely.'},500);}
   await finishAttempt(admin,attempt.id,'rejected',{failure_reason:'learner-rejected'});
   return json({generationId:attempt.id,cardId:String(attempt.card_id),status:'rejected'});
  }
  const {data:card,error:cardError}=await admin.from('cards').select('id,english,image_url').eq('id',attempt.card_id).single();
  if(cardError||!card)return json({error:'Card not found.'},404);
  if(clean(card.image_url)&&clean(card.image_url)!==imageUrl)return json({error:'This card already has a different visual cue.'},409);
  const {error:updateError}=await admin.from('cards').update({image_url:imageUrl}).eq('id',attempt.card_id);
  if(updateError){console.error('Card image approval failed',updateError);return json({error:'Approved image could not be attached to the card.'},500);}
  await finishAttempt(admin,attempt.id,'succeeded',{failure_reason:null});
  return json({generationId:attempt.id,cardId:String(attempt.card_id),imageUrl,alt:`Visual memory cue for ${clean(card.english)}`,status:'succeeded'});
 }

 const enabled=Deno.env.get('VISUAL_GENERATION_ENABLED')==='true';
 const dailyLimit=positiveLimit('VISUAL_GENERATION_DAILY_LIMIT',1);
 const monthlyLimit=positiveLimit('VISUAL_GENERATION_MONTHLY_LIMIT',10);
 const estimatedCostGbp=positiveMoney('VISUAL_GENERATION_ESTIMATED_COST_GBP');
 const monthlyBudgetGbp=positiveMoney('VISUAL_GENERATION_MONTHLY_BUDGET_GBP');
 const model=Deno.env.get('OPENAI_IMAGE_MODEL')||'gpt-image-2';
 const starts=budgetStarts();

 const [dailyResult,monthlyResult,bucketResult]=await Promise.all([
  admin.from('visual_generation_log').select('id',{count:'exact',head:true}).eq('user_id',userData.user.id).gte('created_at',starts.day),
  admin.from('visual_generation_log').select('id,estimated_cost_gbp').eq('user_id',userData.user.id).gte('created_at',starts.month),
  admin.storage.getBucket(bucket)
 ]);
 const auditReady=!dailyResult.error&&!monthlyResult.error;
 const storageReady=!bucketResult.error&&Boolean(bucketResult.data?.public);
 const monthlyRows=monthlyResult.data||[];
 const usedToday=dailyResult.count||0;
 const usedMonth=monthlyRows.length;
 const usedCostGbp=roundMoney(monthlyRows.reduce((sum,row)=>sum+Math.max(0,Number(row.estimated_cost_gbp)||0),0));
 const dailyRemaining=Math.max(0,dailyLimit-usedToday);
 const monthlyRemaining=Math.max(0,monthlyLimit-usedMonth);
 const costRemainingGbp=roundMoney(Math.max(0,monthlyBudgetGbp-usedCostGbp));
 const costConfigured=estimatedCostGbp>0&&monthlyBudgetGbp>0;
 const configured=Boolean(openaiKey)&&dailyLimit>0&&monthlyLimit>0&&costConfigured&&auditReady&&storageReady;
 const allowanceReady=dailyRemaining>0&&monthlyRemaining>0&&usedCostGbp+estimatedCostGbp<=monthlyBudgetGbp;
 let reason='ready';
 if(!enabled)reason='disabled';
 else if(!openaiKey)reason='missing-openai-key';
 else if(dailyLimit===0||monthlyLimit===0)reason='usage-budget-disabled';
 else if(!costConfigured)reason='cost-budget-unconfigured';
 else if(!auditReady)reason='audit-log-unavailable';
 else if(bucketResult.error)reason='storage-bucket-unavailable';
 else if(!bucketResult.data?.public)reason='storage-bucket-not-public';
 else if(dailyRemaining<=0)reason='daily-limit-reached';
 else if(monthlyRemaining<=0)reason='monthly-limit-reached';
 else if(usedCostGbp+estimatedCostGbp>monthlyBudgetGbp)reason='monthly-cost-ceiling-reached';
 const ready=enabled&&configured&&allowanceReady;

 if(action==='status'){
  return json({enabled,configured,ready,reason,model,bucket,dailyLimit,monthlyLimit,usedToday,usedMonth,dailyRemaining,monthlyRemaining,estimatedCostGbp,monthlyBudgetGbp,usedCostGbp,costRemainingGbp});
 }

 if(!enabled)return json({error:'Visual generation is not enabled.'},503);
 if(!openaiKey)return json({error:'OpenAI image generation is not configured.'},503);
 if(dailyLimit===0||monthlyLimit===0)return json({error:'Visual generation budget is disabled.'},429);
 if(!costConfigured)return json({error:'Visual generation cost budget is not configured.'},503);
 if(!auditReady){console.error('Visual budget lookup failed',dailyResult.error||monthlyResult.error);return json({error:'Visual generation budget could not be verified.'},500);}
 if(!storageReady)return json({error:'Visual generation storage is not ready.'},503);
 if(usedToday>=dailyLimit)return json({error:'Daily visual generation limit reached.',dailyLimit},429);
 if(usedMonth>=monthlyLimit)return json({error:'Monthly visual generation limit reached.',monthlyLimit},429);
 if(usedCostGbp+estimatedCostGbp>monthlyBudgetGbp)return json({error:'Monthly visual generation cost ceiling reached.'},429);

 const cardId=Number(body?.cardId);
 if(!Number.isSafeInteger(cardId)||cardId<=0)return json({error:'A valid card id is required.'},400);
 const {data:card,error:cardError}=await admin.from('cards').select('id,dutch,english,partofword,image_url').eq('id',cardId).single();
 if(cardError||!card)return json({error:'Card not found.'},404);
 if(clean(card.image_url))return json({cardId:String(card.id),imageUrl:clean(card.image_url),alt:`Visual memory cue for ${clean(card.english)}`,model:'existing',status:'succeeded'});

 const nowIso=new Date().toISOString();
 const reservationStaleBefore=new Date(Date.now()-RESERVATION_STALE_MINUTES*60*1000).toISOString();
 await admin.from('visual_generation_log').update({status:'failed',failure_reason:'stale-reservation',completed_at:nowIso}).eq('card_id',cardId).eq('status','reserved').lt('created_at',reservationStaleBefore);
 await expireStaleReviews(admin,userData.user.id,bucket);
 const {data:logRow,error:logError}=await admin.from('visual_generation_log').insert({user_id:userData.user.id,card_id:cardId,model,estimated_cost_gbp:estimatedCostGbp,status:'reserved'}).select('id').single();
 if(logError||!logRow){
  if((logError as any)?.code==='23505')return json({error:'A generated visual for this card is already in progress or waiting for review.'},409);
  console.error('Visual generation audit insert failed',logError);
  return json({error:'Visual generation could not reserve budget.'},500);
 }

 try{
  const openaiResponse=await fetch('https://api.openai.com/v1/images/generations',{
   method:'POST',
   headers:{Authorization:`Bearer ${openaiKey}`,'Content-Type':'application/json'},
   body:JSON.stringify({model,prompt:educationalPrompt(card),n:1})
  });
  if(!openaiResponse.ok){
   const detail=await openaiResponse.text();
   console.error('OpenAI visual generation failed',openaiResponse.status,detail.slice(0,500));
   await finishAttempt(admin,logRow.id,'failed',{failure_reason:'openai-error'});
   return json({error:'Image generation failed.'},502);
  }
  const generated=await openaiResponse.json();
  const item=generated?.data?.[0];
  let bytes:Uint8Array|null=null;
  if(item?.b64_json){
   const binary=atob(item.b64_json);
   bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  }else if(item?.url){
   const imageResponse=await fetch(item.url);
   if(imageResponse.ok)bytes=new Uint8Array(await imageResponse.arrayBuffer());
  }
  if(!bytes?.length){await finishAttempt(admin,logRow.id,'failed',{failure_reason:'empty-image'});return json({error:'Image generator returned no usable image.'},502);}

  const path=`cards/${cardId}/${crypto.randomUUID()}.png`;
  const {error:uploadError}=await admin.storage.from(bucket).upload(path,bytes,{contentType:'image/png',upsert:false,cacheControl:'31536000'});
  if(uploadError){console.error('Visual upload failed',uploadError);await finishAttempt(admin,logRow.id,'failed',{failure_reason:'storage-upload-error'});return json({error:'Generated image could not be stored.'},500);}
  const {data:publicData}=admin.storage.from(bucket).getPublicUrl(path);
  const imageUrl=clean(publicData?.publicUrl);
  if(!imageUrl){await admin.storage.from(bucket).remove([path]);await finishAttempt(admin,logRow.id,'failed',{failure_reason:'storage-url-error'});return json({error:'Stored image URL is unavailable.'},500);}

  await finishAttempt(admin,logRow.id,'awaiting_review',{image_url:imageUrl,storage_path:path,failure_reason:null});
  return json({generationId:logRow.id,cardId:String(card.id),imageUrl,alt:`Visual memory cue for ${clean(card.english)}`,model,estimatedCostGbp,status:'awaiting_review'});
 }catch(error){
  console.error('Unexpected visual generation failure',error);
  await finishAttempt(admin,logRow.id,'failed',{failure_reason:'unexpected-error'});
  return json({error:'Visual generation failed unexpectedly.'},500);
 }
});
