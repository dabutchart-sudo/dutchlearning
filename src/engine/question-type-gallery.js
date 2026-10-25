import {kinds,makeExercise} from './exercises.js';

// Names match the daily-session question kinds, so we can talk about them directly.
export const QUESTION_TYPE_TITLES={
 choice:'Choose the English meaning',
 wordbank:'Build the Dutch sentence',
 gap:'Fill the missing form',
 'correct-sentence':'Choose the matching Dutch sentence',
 correction:'Type the missing letters',
 form:'Choose the correct form',
 listening:'Listen and choose the meaning',
 speaking:'Say the Dutch sentence',
 typed:'Write the Dutch sentence'
};

const SAMPLE={
 id:'gallery-koffie',
 concept:'gallery',
 pool:'practice',
 nl:'Ik drink koffie.',
 en:'I drink coffee.',
 subject:'Ik',
 verb:'drinken',
 verbIndex:1,
 verbSlots:[1],
 forms:['drink','drinkt','drinken'],
 family:'gallery:drinken',
 vocabulary:[{id:'gallery:koffie',nl:'koffie',en:'coffee'},{id:'gallery:drinken',nl:'drinken',en:'to drink'}],
 alternatives:[],
 difficulty:1
};

function sibling(id,nl,en,subject){
 return {...SAMPLE,id,nl,en,subject,vocabulary:SAMPLE.vocabulary.map(word=>({...word}))};
}

export function galleryContent(){
 const sentences=[
  SAMPLE,
  sibling('gallery-thee','Ik drink thee.','I drink tea.','Ik'),
  sibling('gallery-water','Zij drinkt water.','She drinks water.','Zij'),
  sibling('gallery-melk','Wij drinken melk.','We drink milk.','Wij')
 ];
 return {sentences,byId:Object.fromEntries(sentences.map(item=>[item.id,item]))};
}

export function galleryExamples(seed='question-type-gallery'){
 const content=galleryContent();
 return kinds.map(kind=>{
  const question=makeExercise(SAMPLE,kind,content,{phase:'practice',seed:`${seed}:${kind}`});
  return {kind,title:QUESTION_TYPE_TITLES[kind],question,item:SAMPLE};
 });
}
