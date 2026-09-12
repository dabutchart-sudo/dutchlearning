import {dutchVoice} from './speech.js';

const synth=globalThis.speechSynthesis;
if(synth&&!synth.__dutchTrainerVoiceWrapped){
 const nativeSpeak=synth.speak.bind(synth);
 const wrapped=function(utterance){
  try{
   if(utterance&&/^nl(?:-|_)/i.test(String(utterance.lang||''))){
    const voice=dutchVoice();
    if(voice){utterance.voice=voice;utterance.lang=voice.lang||'nl-NL';}
   }
  }catch{}
  return nativeSpeak(utterance);
 };
 try{Object.defineProperty(synth,'speak',{configurable:true,writable:true,value:wrapped});}
 catch{try{synth.speak=wrapped;}catch{}}
 try{Object.defineProperty(synth,'__dutchTrainerVoiceWrapped',{configurable:true,value:true});}
 catch{try{synth.__dutchTrainerVoiceWrapped=true;}catch{}}
}
