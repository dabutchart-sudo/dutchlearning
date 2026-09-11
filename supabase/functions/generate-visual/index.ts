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

 let body:{action?:string;cardId?:string|number};
 try{body=await req.json();}catch{return json({error:'Invalid JSON body.'},400);}

 const admin=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false}});
 const enabled=Deno.env.get('VISUAL_GENERATION_ENABLED')==='true';
 const dailyLimit=positiveLimit('VISUAL_GENERATION_DAILY_LIMIT',1);
 const monthlyLimit=positiveLimit('VISUAL_GENERATION_MONTHLY_LIMIT',10);
 const estimatedCostGbp=positiveMoney('VISUAL_GENERATION_ESTIMATED_COST_GBP');
 const monthlyBudgetGbp=positiveMoney('VISUAL_GENERATION_MONTHLY_BUDGET_GBP');
 const model=Deno.env.get('OPENAI_IMAGE_MODEL')||'gpt-image-2';
 const bucket=Deno.env.get('VISUAL_STORAGE_BUCKET')||'visual-cues';
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

 if(clean(body?.action).toLowerCase()==='status'){
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
 if(clean(card.image_url))return json({cardId:String(card.id),imageUrl:clean(card.image_url),alt:`Visual memory cue for ${clean(card.english)}`,model:'existing'});

 const {data:logRow,error:logError}=await admin.from('visual_generation_log').insert({user_id:userData.user.id,card_id:cardId,model,estimated_cost_gbp:estimatedCostGbp}).select('id').single();
 if(logError||!logRow){
  console.error('Visual generation audit insert failed',logError);
  return json({error:'Visual generation could not reserve budget.'},500);
 }

 const openaiResponse=await fetch('https://api.openai.com/v1/images/generations',{
  method:'POST',
  headers:{Authorization:`Bearer ${openaiKey}`,'Content-Type':'application/json'},
  body:JSON.stringify({model,prompt:educationalPrompt(card),n:1})
 });
 if(!openaiResponse.ok){
  const detail=await openaiResponse.text();
  console.error('OpenAI visual generation failed',openaiResponse.status,detail.slice(0,500));
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
 if(!bytes?.length)return json({error:'Image generator returned no usable image.'},502);

 const path=`cards/${cardId}/${crypto.randomUUID()}.png`;
 const {error:uploadError}=await admin.storage.from(bucket).upload(path,bytes,{contentType:'image/png',upsert:false,cacheControl:'31536000'});
 if(uploadError){console.error('Visual upload failed',uploadError);return json({error:'Generated image could not be stored.'},500);}
 const {data:publicData}=admin.storage.from(bucket).getPublicUrl(path);
 const imageUrl=clean(publicData?.publicUrl);
 if(!imageUrl)return json({error:'Stored image URL is unavailable.'},500);

 const {error:updateError}=await admin.from('cards').update({image_url:imageUrl}).eq('id',cardId);
 if(updateError){console.error('Card image update failed',updateError);return json({error:'Generated image was stored but the card could not be updated.'},500);}
 await admin.from('visual_generation_log').update({image_url:imageUrl}).eq('id',logRow.id);

 return json({cardId:String(card.id),imageUrl,alt:`Visual memory cue for ${clean(card.english)}`,model,estimatedCostGbp});
});
