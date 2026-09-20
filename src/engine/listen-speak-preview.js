import {distance,normalize,shuffle} from './util.js';

export const SAMPLE={
 id:'listen-speak-sample-1',
 nl:'Ik drink koffie.',
 en:'I drink coffee.',
 distractors:['I drink tea.','I am eating bread.']
};

export function listeningOptions(item=SAMPLE,seed=1){
 return shuffle([item.en,...item.distractors],seed);
}

export function scoreListening(choice,item=SAMPLE){
 return {correct:normalize(choice)===normalize(item.en)};
}

export function scoreSpeaking(transcript,item=SAMPLE){
 const got=normalize(transcript);
 const expected=normalize(item.nl);
 if(!got)return {correct:false,near:false,empty:true,expected:item.nl};
 if(got===expected)return {correct:true,near:false,empty:false,expected:item.nl};
 return {correct:false,near:distance(got,expected)<=2,empty:false,expected:item.nl};
}

export function allowedSpeechText(text,item=SAMPLE){
 return normalize(text)===normalize(item.nl);
}
