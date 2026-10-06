import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPEAKING_ATTEMPT_COST_GBP,SPEAKING_ATTEMPT_COST_PENCE,SPEAKING_MAX_AUDIO_BYTES,SPEAKING_MONTHLY_BUDGET_GBP,SPEAKING_MONTHLY_BUDGET_PENCE,speakingBudgetDecision} from '../src/engine/speaking-budget.js';
import {SPEAKING_TRANSCRIPTION_FUNCTION,learningAccessToken,transcribeSpokenAnswer} from '../src/engine/speaking-transcription.js';

test('the monthly speaking cap is £5 and each attempt reserves 2p',()=>{
 assert.equal(SPEAKING_MONTHLY_BUDGET_GBP,5);
 assert.equal(SPEAKING_MONTHLY_BUDGET_PENCE,500);
 assert.equal(SPEAKING_ATTEMPT_COST_GBP,0.02);
 assert.equal(SPEAKING_ATTEMPT_COST_PENCE,2);
 assert.equal(speakingBudgetDecision({enabled:true,audioBytes:1000}).allowed,true);
 assert.equal(speakingBudgetDecision({enabled:false,audioBytes:1000}).reason,'disabled');
 assert.equal(speakingBudgetDecision({enabled:true,configuredCeilingPence:600,audioBytes:1000}).reason,'cost-budget-unconfigured');
 assert.equal(speakingBudgetDecision({enabled:true,audioBytes:SPEAKING_MAX_AUDIO_BYTES+1}).reason,'audio-too-large');
 const last=speakingBudgetDecision({enabled:true,usedPence:498,audioBytes:1000});
 assert.equal(last.allowed,true);
 assert.equal(last.remainingPence,0);
 assert.equal(speakingBudgetDecision({enabled:true,usedPence:500,audioBytes:1000}).reason,'monthly-cost-ceiling-reached');
});

test('a development copy still uses the local preview route',async()=>{
 const blob=new Blob(['speech'],{type:'audio/webm'});
 let called=false;
 const heard=await transcribeSpokenAnswer(blob,{origin:'127.0.0.1',fetchImpl:async path=>{called=path;return {ok:true,json:async()=>({text:'Ik schrijf.'})};}});
 assert.equal(called,'/preview/stt');
 assert.equal(heard.text,'Ik schrijf.');
});

test('the live origin sends the learner token to the capped function and never an OpenAI key',async()=>{
 const blob=new Blob(['speech'],{type:'audio/webm'});
 const requests=[];
 const heard=await transcribeSpokenAnswer(blob,{
  origin:'dabutchart-sudo.github.io',
  accessToken:()=>'learner-session',
  fetchImpl:async(path,options)=>{
   requests.push({path,headers:options.headers});
   return {ok:false,json:async()=>({error:'not deployed'})};
  }
 });
 assert.equal(heard.ok,false);
 assert.equal(heard.speechIssue,'unavailable');
 assert.equal(requests[0].path,SPEAKING_TRANSCRIPTION_FUNCTION);
 assert.equal(requests[0].headers.Authorization,'Bearer learner-session');
 assert.equal(requests[0].headers.apikey.startsWith('sb_publishable_'),true);
 assert.deepEqual(await transcribeSpokenAnswer(blob,{origin:'dabutchart-sudo.github.io',accessToken:()=>'',fetchImpl:async()=>{throw Error('should not be called');}}),{ok:false,speechIssue:'unavailable',text:''});
 const storage={getItem:key=>key.endsWith('auth-token')?JSON.stringify({access_token:'saved-session'}):null};
 assert.equal(learningAccessToken(storage),'saved-session');
});

test('the production function reserves the £5 cap before OpenAI and fails closed behind its switch',()=>{
 const fn=readFileSync(new URL('../supabase/functions/speaking-transcription/index.ts',import.meta.url),'utf8');
 const sql=readFileSync(new URL('../supabase/migrations/20261005_speaking_transcription_budget.sql',import.meta.url),'utf8');
 const config=readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8');
 const listen=readFileSync(new URL('../supabase/functions/listen-tts/index.ts',import.meta.url),'utf8');
 assert.match(fn,/SPEAKING_TRANSCRIPTION_ENABLED'\)==='true'/);
 assert.match(fn,/reserve_speaking_transcription/);
 assert.match(fn,/gpt-4o-mini-transcribe/);
 assert.match(fn,/body\.append\('language','nl'\)/);
 assert.match(fn,/body\.append\('prompt',DUTCH_TRANSCRIPTION_PROMPT\)/);
 assert.match(fn,/vertaal niet naar het Engels/);
 assert.doesNotMatch(fn,/Hij sluit de deur/);
 assert.match(fn,/speakingBudgetDecision/);
 assert.doesNotMatch(fn,/sk-|console\.log\(openaiKey|whisper-1/);
 assert.ok(fn.indexOf('reserve_speaking_transcription')<fn.indexOf('api.openai.com'));
 assert.match(sql,/p_monthly_budget_gbp > 5/);
 assert.match(sql,/estimated_cost_gbp <= 0\.02/);
 assert.match(sql,/revoke all on function public.reserve_speaking_transcription/);
 assert.match(sql,/grant execute on function public.reserve_speaking_transcription\(uuid, integer, numeric, numeric\) to service_role/);
 assert.match(config,/\[functions\.speaking-transcription\]\s+verify_jwt = true/);
 assert.match(listen,/audio\/speech/);
 assert.doesNotMatch(listen,/transcriptions|speaking-transcription/);
});
