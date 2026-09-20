const FEMALE_HINT=/(female|colette|ellen|femke|lotte|sofie|sophie|nora|sara|laura|emma|eva|fenna|fleur|ilse|iris|julia|lisa|marieke|noor|roos|saskia|tessa|yara|claire)/i;
const MALE_HINT=/(male|maarten|xander|ruben|frank|bart|jeroen|pieter|daan)/i;
const SYSTEM_DUTCH_FALLBACK=Object.freeze({lang:'nl-NL',__systemFallback:true});
const PLAY_ERROR='Dutch audio could not play. Restart the Mac server, refresh this page, then tap Listen once.';
let player=null;

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

export function canUseServerListen(){
 const host=String(globalThis.location?.hostname||'');
 if(host==='localhost'||host==='127.0.0.1'||host.startsWith('192.168.'))return true;
 return Boolean(globalThis.document?.body?.classList.contains('is-development'));
}

export function listenAudioUrl(text=''){
 const dutch=String(text||'').trim();
 return dutch?'/listen/tts?text='+encodeURIComponent(dutch):'/listen/tts';
}

function ensurePlayer(){
 if(player||typeof Audio!=='function')return player;
 player=new Audio();
 player.setAttribute('playsinline','');
 player.setAttribute('webkit-playsinline','');
 player.playsInline=true;
 player.preload='auto';
 return player;
}

export function unlockListenAudio(){
 if(canUseServerListen())ensurePlayer();
}

async function explainPlayError(onError){
 try{
  const res=await fetch('/listen/status');
  const data=await res.json();
  if(data?.error){onError(String(data.error));return;}
 }catch{}
 onError(PLAY_ERROR);
}

function queueDutch(synth,Utterance,text,onError){
 const message='Audio could not play. Check that speech is enabled for this browser.';
 const voice=dutchVoice();
 const u=new Utterance(String(text??''));
 if(voice&&!voice.__systemFallback)u.voice=voice;
 u.lang=voice?.lang||'nl-NL';
 u.rate=.85;
 u.volume=1;
 u.onerror=()=>onError(message);
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

function speakServer(dutch,onError){
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

export function speak(text,onError=()=>{}){
 const dutch=String(text??'').trim();
 if(canUseServerListen()&&dutch)return speakServer(dutch,onError);
 return speakDevice(dutch,onError);
}
