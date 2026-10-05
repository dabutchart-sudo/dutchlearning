const FEMALE_HINT=/(female|colette|ellen|femke|lotte|sofie|sophie|nora|sara|laura|emma|eva|fenna|fleur|ilse|iris|julia|lisa|marieke|noor|roos|saskia|tessa|yara|claire)/i;
const MALE_HINT=/(male|maarten|xander|ruben|frank|bart|jeroen|pieter|daan)/i;
const SYSTEM_DUTCH_FALLBACK=Object.freeze({lang:'nl-NL',__systemFallback:true});
const PRODUCTION_HOST='dabutchart-sudo.github.io';
const LISTEN_FUNCTION='https://dntitlrtvkgisxwqjxch.supabase.co/functions/v1/listen-tts';
const FLASHCARD_CONSTANTS='https://dabutchart-sudo.github.io/flashcards/constants.js';
const SILENT_WAV='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
let player=null;
let unlocker=null;
let audioCtx=null;
let speechSource=null;
let listenAuth=null;
let listenAuthPending=null;
let listenGen=0;
// Playback speed for the current speak() call. 1 is normal; SLOWER_RATE is the
// optional slower replay in Practice listening. Audio elements keep pitch.
export const SLOWER_RATE=.8;
let requestedRate=1;
function applyRate(audio){
 try{audio.defaultPlaybackRate=requestedRate;audio.playbackRate=requestedRate;}catch{}
 try{audio.preservesPitch=true;audio.webkitPreservesPitch=true;}catch{}
}
let lastBlobUrl='';
const ttsCache=new Map();
const ttsPending=new Map();
const decodedCache=new Map();

function voiceScore(v){
 const name=String(v?.name||'');
 const lang=String(v?.lang||'');
 let score=0;
 if(/^nl-NL$/i.test(lang))score+=35;
 else if(/^nl(?:-|_)/i.test(lang))score+=20;
 if(FEMALE_HINT.test(name))score+=100;
 if(MALE_HINT.test(name))score-=50;
 if(/natural|premium|enhanced/i.test(name))score+=15;
 if(v?.localService)score+=8;
 return score;
}

export function dutchVoice(){
 const synth=globalThis.speechSynthesis;
 const Utterance=globalThis.SpeechSynthesisUtterance;
 if(!synth||!Utterance)return undefined;
 const voices=synth.getVoices?.().filter(v=>/^nl(?:-|_)/i.test(v.lang))||[];
 return voices.sort((a,b)=>voiceScore(b)-voiceScore(a))[0]||SYSTEM_DUTCH_FALLBACK;
}

export function dutchSpeechAvailable(){
 return Boolean(globalThis.speechSynthesis&&globalThis.SpeechSynthesisUtterance)||typeof Audio==='function';
}

function hostname(){
 return String(globalThis.location?.hostname||'');
}

export function canUseLanListen(){
 const host=hostname();
 if(host==='localhost'||host==='127.0.0.1'||host.startsWith('192.168.'))return true;
 return Boolean(globalThis.document?.body?.classList.contains('is-development'));
}

export function canUseProductionListen(){
 return hostname()===PRODUCTION_HOST;
}

export function canUseServerListen(){
 return canUseLanListen()||canUseProductionListen();
}

export function listenAudioUrl(text=''){
 const dutch=String(text||'').trim();
 let path='/listen/tts';
 try{
  const resolved=new URL('../../listen/tts',import.meta.url);
  if(resolved.protocol==='http:'||resolved.protocol==='https:')path=resolved.pathname;
 }catch{}
 return dutch?`${path}?text=${encodeURIComponent(dutch)}`:path;
}

function playErrorMessage(){
 return canUseLanListen()
  ?'Dutch audio could not play. Restart the Mac server, refresh this page, then tap Listen once.'
  :'Dutch audio could not play. Refresh the page and tap Listen once.';
}

function makeAudio(){
 const audio=new Audio();
 audio.setAttribute('playsinline','');
 audio.setAttribute('webkit-playsinline','');
 audio.playsInline=true;
 audio.preload='auto';
 try{globalThis.document?.body?.appendChild(audio);}catch{}
 return audio;
}

function ensurePlayer(){
 if(player||typeof Audio!=='function')return player;
 player=makeAudio();
 return player;
}

function ensureUnlocker(){
 if(unlocker||typeof Audio!=='function')return unlocker;
 unlocker=makeAudio();
 return unlocker;
}

export function unlockListenAudio(){
 if(canUseServerListen()){ensureUnlocker();ensurePlayer();}
 prefetchListenAuth();
}

async function prefetchListenAuth(){
 if(listenAuth||listenAuthPending||!canUseProductionListen())return listenAuth;
 listenAuthPending=fetch(FLASHCARD_CONSTANTS,{cache:'no-store'}).then(res=>res.text()).then(src=>{
  const key=(src.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)||[])[1]||'';
  listenAuth=key?{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'}:null;
  return listenAuth;
 }).catch(()=>null).finally(()=>{listenAuthPending=null;});
 return listenAuthPending;
}

function stopUnlocker(){
 if(!unlocker)return;
 try{unlocker.pause();}catch{}
 try{unlocker.currentTime=0;}catch{}
}

function stopSpeechSource(){
 const source=speechSource;
 speechSource=null;
 if(!source)return;
 try{source.onended=null;source.stop();}catch{}
}

function ensureAudioContext(){
 try{
  const Ctx=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Ctx)return null;
  audioCtx=audioCtx||new Ctx();
  return audioCtx;
 }catch{return null;}
}

function resumeAudioContext(){
 const ctx=ensureAudioContext();
 if(!ctx)return null;
 try{
  const pending=ctx.resume?.();
  if(pending&&typeof pending.catch==='function')pending.catch(()=>{});
 }catch{}
 return ctx;
}

function unlockInGesture(){
 const silent=ensureUnlocker();
 if(silent){
  silent.muted=false;
  silent.volume=.01;
  silent.src=SILENT_WAV;
  try{silent.currentTime=0;}catch{}
  try{silent.play();}catch{}
 }
 resumeAudioContext();
}

async function explainPlayError(onError){
 if(canUseLanListen()){
  try{
   const res=await fetch('/listen/status');
   const data=await res.json();
   if(data?.error){onError(String(data.error));return;}
  }catch{}
 }
 onError(playErrorMessage());
}

function ignoreDeviceError(event){
 const reason=String(event?.error||'');
 return reason==='canceled'||reason==='interrupted';
}

function queueDutch(synth,Utterance,text,onError,events={}){
 const message='Audio could not play. Check that speech is enabled for this browser.';
 const voice=dutchVoice();
 const u=new Utterance(String(text??''));
 if(voice&&!voice.__systemFallback)u.voice=voice;
 u.lang=voice?.lang||'nl-NL';
 u.rate=.85*requestedRate;
 u.volume=1;
 u.onerror=event=>{if(!ignoreDeviceError(event))onError(message);};
 if(events.onStart)u.onstart=()=>events.onStart();
 if(events.onEnd)u.onend=()=>events.onEnd();
 try{if(synth.paused)synth.resume();}catch{}
 synth.speak(u);
}

function speakDevice(text,onError,events={}){
 const synth=globalThis.speechSynthesis;
 const Utterance=globalThis.SpeechSynthesisUtterance;
 if(!synth||!Utterance){onError('Speech playback is not available in this browser.');return false;}
 try{
  if(synth.speaking||synth.pending){
   synth.cancel();
   setTimeout(()=>{try{queueDutch(synth,Utterance,text,onError,events);}catch{onError('Audio could not play. Check that speech is enabled for this browser.');}},50);
   return true;
  }
  queueDutch(synth,Utterance,text,onError,events);
  return true;
 }catch{
  onError('Audio could not play. Check that speech is enabled for this browser.');
  return false;
 }
}

// The development copy reports start and end like the live path, so screens that
// wait for audio to begin (missing word, dictation) also work on a Mac preview.
function speakLan(dutch,onError,events={}){
 const audio=ensurePlayer();
 if(!audio)return speakDevice(dutch,onError,events);
 const gen=++listenGen;
 audio.pause();
 audio.muted=false;
 audio.volume=1;
 audio.onerror=()=>{explainPlayError(onError);};
 audio.onended=()=>{if(gen===listenGen)events.onEnd?.();};
 audio.src=listenAudioUrl(dutch);
 applyRate(audio);
 try{
  const start=audio.play();
  if(start&&typeof start.then==='function')start.then(()=>{if(gen===listenGen)events.onStart?.();},()=>explainPlayError(onError));
  else events.onStart?.();
  return true;
 }catch{
  explainPlayError(onError);
  return false;
 }
}

function rememberBlob(dutch,blob){
 if(ttsCache.has(dutch))ttsCache.delete(dutch);
 ttsCache.set(dutch,blob);
 if(ttsCache.size>24)ttsCache.delete(ttsCache.keys().next().value);
}

function rememberDecoded(dutch,buffer){
 if(decodedCache.has(dutch))decodedCache.delete(dutch);
 decodedCache.set(dutch,buffer);
 if(decodedCache.size>24)decodedCache.delete(decodedCache.keys().next().value);
}

async function rememberSpeech(dutch,blob){
 rememberBlob(dutch,blob);
 decodedCache.delete(dutch);
 const ctx=ensureAudioContext();
 if(!ctx||typeof ctx.decodeAudioData!=='function')return;
 try{
  const buffer=await decodeSpeech(ctx,await blob.arrayBuffer());
  if(buffer)rememberDecoded(dutch,buffer);
 }catch{}
}

function startHtmlClip(audio,blob){
 if(lastBlobUrl)try{URL.revokeObjectURL(lastBlobUrl);}catch{}
 lastBlobUrl=(globalThis.URL||{}).createObjectURL?URL.createObjectURL(blob):'';
 audio.pause();
 audio.muted=false;
 audio.volume=1;
 audio.src=lastBlobUrl||listenAudioUrl('');
 applyRate(audio);
 try{audio.currentTime=0;}catch{}
 try{return audio.play();}catch(error){return Promise.reject(error);}
}

async function playBlob(audio,blob){
 try{
  await startHtmlClip(audio,blob);
 }catch{
  await new Promise(resolve=>setTimeout(resolve,60));
  await startHtmlClip(audio,blob);
 }
}

function canPlayDecodedSpeech(){
 return Boolean(audioCtx&&typeof audioCtx.decodeAudioData==='function'&&typeof audioCtx.createBufferSource==='function');
}

function decodeSpeech(ctx,bytes){
 const copy=bytes.slice(0);
 return new Promise((resolve,reject)=>{
  let settled=false;
  const ok=value=>{if(!settled){settled=true;resolve(value);}};
  const bad=error=>{if(!settled){settled=true;reject(error instanceof Error?error:Error('Dutch audio could not be decoded.'));}};
  try{
   const result=ctx.decodeAudioData(copy,ok,bad);
   if(result&&typeof result.then==='function')result.then(ok,bad);
  }catch(error){bad(error);}
 });
}

function startDecodedBuffer(buffer,gen,events){
 if(gen!==listenGen||!buffer||!canPlayDecodedSpeech())return false;
 try{
  stopSpeechSource();
  if(gen!==listenGen)return false;
  const source=audioCtx.createBufferSource();
  source.buffer=buffer;
  // Last-resort path: a slowed buffer also lowers pitch, but stays audible.
  if(requestedRate!==1)try{source.playbackRate.value=requestedRate;}catch{}
  source.connect(audioCtx.destination);
  source.onended=()=>{if(gen===listenGen&&speechSource===source){speechSource=null;events.onEnd();}};
  source.start(0);
  speechSource=source;
  events.onStart();
  return true;
 }catch{return false;}
}

async function playDecoded(blob,gen,events){
 const ctx=audioCtx;
 if(!canPlayDecodedSpeech())throw Error('no-web-audio');
 if(ctx.state==='suspended'&&typeof ctx.resume==='function')await ctx.resume();
 const bytes=await blob.arrayBuffer();
 if(gen!==listenGen)return false;
 const buffer=await decodeSpeech(ctx,bytes);
 if(!buffer)return false;
 return startDecodedBuffer(buffer,gen,events);
}

function spokenError(error){
 const detail=`${error?.name||''} ${error?.message||''}`;
 if(/NotAllowed|NotSupported|AbortError|no-web-audio/i.test(detail))return playErrorMessage();
 return String(error?.message||playErrorMessage());
}

function playReadyClip(audio,blob,onError,gen,events){
 stopUnlocker();
 let started;
 try{started=startHtmlClip(audio,blob);}catch(error){started=Promise.reject(error);}
 const failed=error=>{
  if(gen!==listenGen)return;
  const report=()=>{if(gen===listenGen)onError(spokenError(error));};
  playDecoded(blob,gen,events).then(ok=>{if(!ok)report();}).catch(report);
 };
 if(started&&typeof started.then==='function'){
  started.then(()=>{
   if(gen!==listenGen)return;
   audio.onerror=()=>{if(gen===listenGen)explainPlayError(onError);};
   audio.onended=()=>{if(gen===listenGen)events.onEnd();};
   events.onStart();
  }).catch(failed);
 }else if(gen===listenGen)events.onStart();
}

async function productionBlob(dutch){
 const cached=ttsCache.get(dutch);if(cached)return cached;
 if(ttsPending.has(dutch))return ttsPending.get(dutch);
 const pending=(async()=>{
  const headers=await prefetchListenAuth();
  if(!headers)throw Error(playErrorMessage());
  const res=await fetch(LISTEN_FUNCTION,{method:'POST',headers,body:JSON.stringify({text:dutch})});
  if(!res.ok){
   let message=playErrorMessage();
   try{message=String((await res.json())?.error||message);}catch{}
   throw Error(message);
  }
  const blob=await res.blob();await rememberSpeech(dutch,blob);return blob;
 })().finally(()=>ttsPending.delete(dutch));
 ttsPending.set(dutch,pending);return pending;
}

export function prepareSpeech(text){
 const dutch=String(text??'').trim();
 if(!dutch||!canUseProductionListen())return Promise.resolve(false);
 return productionBlob(dutch).then(()=>true).catch(()=>false);
}

export function discardPreparedSpeech(text){
 const dutch=String(text??'').trim();
 if(!dutch)return false;
 decodedCache.delete(dutch);
 return ttsCache.delete(dutch);
}

async function playProductionAudio(audio,dutch,onError,gen,events){
 try{
  const blob=await productionBlob(dutch);
  if(gen!==listenGen)return;
  stopUnlocker();
  audio.onerror=()=>{if(gen===listenGen)explainPlayError(onError);};
  audio.onended=()=>{if(gen===listenGen)events.onEnd();};
  await playBlob(audio,blob);
  if(gen===listenGen)events.onStart();
 }catch(error){
  if(gen===listenGen)onError(spokenError(error));
 }
}

function speakProduction(dutch,onError,events={}){
 const audio=ensurePlayer();
 if(!audio)return speakDevice(dutch,onError,events);
 audio.pause();
 try{audio.currentTime=0;}catch{}
 const status=globalThis.document?.getElementById?.('system-message');
 if(status)status.innerHTML='';
 const hooks={onStart:events.onStart||(()=>{}),onEnd:events.onEnd||(()=>{})};
 const gen=++listenGen;
 stopSpeechSource();
 resumeAudioContext();
 const decoded=decodedCache.get(dutch);
 // A slower replay prefers the audio element, which keeps pitch.
 if(decoded&&requestedRate===1&&startDecodedBuffer(decoded,gen,hooks))return true;
 const ready=ttsCache.get(dutch);
 if(ready){
  // Play the downloaded sentence in this tap. A separate near-silent clip was the faint hiss.
  playReadyClip(audio,ready,onError,gen,hooks);
  return true;
 }
 unlockInGesture();
 playProductionAudio(audio,dutch,onError,gen,hooks);
 return true;
}

export function speak(text,onError=()=>{},events={}){
 const dutch=String(text??'').trim();
 if(!dutch)return false;
 requestedRate=events.rate===SLOWER_RATE?SLOWER_RATE:1;
 if(canUseLanListen())return speakLan(dutch,onError,events);
 if(canUseProductionListen())return speakProduction(dutch,onError,events);
 return speakDevice(dutch,onError,events);
}

if(typeof document!=='undefined')prefetchListenAuth();
