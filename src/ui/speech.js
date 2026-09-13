const FEMALE_HINT=/(female|colette|ellen|femke|lotte|sofie|sophie|nora|sara|laura|emma|eva|fenna|fleur|ilse|iris|julia|lisa|marieke|noor|roos|saskia|tessa|yara|claire)/i;
const MALE_HINT=/(male|maarten|xander|ruben|frank|bart|jeroen|pieter|daan)/i;

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
 const voices=globalThis.speechSynthesis?.getVoices?.().filter(v=>/^nl(?:-|_)/i.test(v.lang))||[];
 return voices.sort((a,b)=>voiceScore(b)-voiceScore(a))[0];
}

export function speak(text,onError=()=>{}){
 const synth=globalThis.speechSynthesis;
 const Utterance=globalThis.SpeechSynthesisUtterance;
 if(!synth||!Utterance){onError('Speech playback is not available in this browser.');return false;}
 try{
  const voice=dutchVoice();
  synth.cancel();
  const u=new Utterance(String(text??''));
  if(voice)u.voice=voice;
  u.lang=voice?.lang||'nl-NL';
  u.rate=.85;
  u.onerror=()=>onError('Audio could not play. Check that Dutch speech is enabled on this device.');
  synth.speak(u);
  return true;
 }catch{
  onError('Audio could not play. Check that Dutch speech is enabled on this device.');
  return false;
 }
}
