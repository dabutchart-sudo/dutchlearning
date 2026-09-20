const FEMALE_HINT=/(female|colette|ellen|femke|lotte|sofie|sophie|nora|sara|laura|emma|eva|fenna|fleur|ilse|iris|julia|lisa|marieke|noor|roos|saskia|tessa|yara|claire)/i;
const MALE_HINT=/(male|maarten|xander|ruben|frank|bart|jeroen|pieter|daan)/i;
const SYSTEM_DUTCH_FALLBACK=Object.freeze({lang:'nl-NL',__systemFallback:true});
const PRODUCTION_HOST='dabutchart-sudo.github.io';
const LISTEN_FUNCTION='https://dntitlrtvkgisxwqjxch.supabase.co/functions/v1/listen-tts';
const FLASHCARD_CONSTANTS='https://dabutchart-sudo.github.io/flashcards/constants.js';
const SILENT_WAV='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
let player=null;
let listenAuth=null;
let listenAuthPending=null;

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

function ensurePlayer(){
 if(player||typeof Audio!=='function')return player;
 player=new Audio();
 player.setAttribute('playsinline','');
 player.setAttribute('webkit-playsinline','');
 player.playsInline=true;
 player.preload='auto';
 try{globalThis.document?.body?.appendChild(player);}catch{}
 return player;
}

export function unlockListenAudio(){
 if(canUseServerListen())ensurePlayer();
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

function unlockSilent(audio){
 audio.pause();
 audio.muted=false;
 audio.volume=1;
 audio.src=SILENT_WAV;
 try{audio.play();}catch{}
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

function queueDutch(synth,Utterance,text,onError){
 const message='Audio could not play. Check that speech is enabled for this browser.';
 const voice=dutchVoice();
 const u=new Utterance(String(text??''));
 if(voice&&!voice.__systemFallback)u.voice=voice;
 u.lang=voice?.lang||'nl-NL';
 u.rate=.85;
 u.volume=1;
 u.onerror=event=>{if(!ignoreDeviceError(event))onError(message);};
 try{if(synth.paused)synth.resume();}catch{}
 synth.speak(u);
}

function speakDevice(text,onError){
 const synth=globalThis.speechSynthesis;
 const Utterance=globalThis.SpeechSynthesisUtterance;
 if(!synth||!Utterance){onError('Speech playback is not available in this browser.');return false;}
 try{
  if(synth.speaking||synth.pending){
   synth.cancel();
   setTimeout(()=>{try{queueDutch(synth,Utterance,text,onError);}catch{onError('Audio could not play. Check that speech is enabled for this browser.');}},50);
   return true;
  }
  queueDutch(synth,Utterance,text,onError);
  return true;
 }catch{
  onError('Audio could not play. Check that speech is enabled for this browser.');
  return false;
 }
}

function speakLan(dutch,onError){
 const audio=ensurePlayer();
 if(!audio)return speakDevice(dutch,onError);
 audio.pause();
 audio.muted=false;
 audio.volume=1;
 audio.onerror=()=>{explainPlayError(onError);};
 audio.src=listenAudioUrl(dutch);
 try{
  const start=audio.play();
  if(start&&typeof start.catch==='function')start.catch(()=>explainPlayError(onError));
  return true;
 }catch{
  explainPlayError(onError);
  return false;
 }
}

async function playProductionAudio(audio,dutch,onError){
 try{
  const headers=await prefetchListenAuth();
  if(!headers){onError(playErrorMessage());return;}
  const res=await fetch(LISTEN_FUNCTION,{method:'POST',headers,body:JSON.stringify({text:dutch})});
  if(!res.ok){
   let message=playErrorMessage();
   try{message=String((await res.json())?.error||message);}catch{}
   onError(message);
   return;
  }
  const blob=await res.blob();
  audio.onerror=()=>{explainPlayError(onError);};
  audio.src=(globalThis.URL||{}).createObjectURL?URL.createObjectURL(blob):listenAudioUrl(dutch);
  audio.muted=false;
  audio.volume=1;
  await audio.play();
 }catch{
  explainPlayError(onError);
 }
}

function speakProduction(dutch,onError){
 const audio=ensurePlayer();
 if(!audio)return speakDevice(dutch,onError);
 unlockSilent(audio);
 playProductionAudio(audio,dutch,onError);
 return true;
}

export function speak(text,onError=()=>{}){
 const dutch=String(text??'').trim();
 if(!dutch)return false;
 if(canUseLanListen())return speakLan(dutch,onError);
 if(canUseProductionListen())return speakProduction(dutch,onError);
 return speakDevice(dutch,onError);
}

if(typeof document!=='undefined')prefetchListenAuth();
