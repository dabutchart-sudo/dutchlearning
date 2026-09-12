const TYPES=new Set(['visual','spelling']);

export function applySupportTracking(word={},type,{shown=false,completed=false}={}){
 if(!word||typeof word!=='object')throw new Error('Support tracking requires a word record.');
 if(shown&&TYPES.has(type)){
  const key=type==='visual'?'visualSupports':'spellingSupports';
  word[key]=(Number(word[key])||0)+1;
 }
 if(completed)word.supportedEncounters=(Number(word.supportedEncounters)||0)+1;
 return word;
}
