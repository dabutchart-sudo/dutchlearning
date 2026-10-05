import {formatAvailable} from './format-release.js';
import {displayTokens,hash,normalize,sentenceCase,shuffle,tokens} from './util.js';

export const MISSING_WORD_SIZE=5;
// Practice-only gate. It does not change the Core listening question in the daily 20.
export const MISSING_WORD_RELEASE=Object.freeze({listening:Object.freeze({releaseLevel:'practice',enabled:true})});
export const MISSING_WORD_GAP='_____';

function learnedConcepts(state){
 return new Set(Object.entries(state.progress||[]).filter(([,progress])=>progress&&(progress.taught||progress.lessonAcknowledged||progress.practiceAttempts>0||progress.masteredAt)).map(([id])=>id));
}

// The missing word is the finite verb the topic already teaches. A sentence is
// usable only when that slot is a real, single word in the displayed sentence.
function targetWord(item){
 const words=displayTokens(sentenceCase(item.nl));
 const index=item.verbIndex;
 if(!Number.isInteger(index)||index<0||index>=words.length||words.length<2)return null;
 return {words,index,word:words[index]};
}

export function missingWordPool(state,content,conceptId){
 if(!conceptId||!learnedConcepts(state).has(conceptId))return [];
 const eligible=(content.sentences||[]).filter(item=>item.concept===conceptId&&item.pool==='practice'&&(item.suitableKinds||[]).includes('listening')&&normalize(item.nl)&&normalize(item.en)&&targetWord(item));
 return [...new Map(eligible.map(item=>[normalize(item.nl),item])).values()];
}

function matchCase(word,index){
 const lower=word.toLocaleLowerCase('nl');
 return index===0?sentenceCase(lower):lower;
}

// Which finite form the frame needs. Two options with the same key both fit the
// sentence grammatically, so only the audio can tell them apart.
export function agreementKey(item){
 const target=targetWord(item);
 if(!target)return null;
 const words=tokens(item.nl),heard=normalize(target.word);
 const subject=tokens(item.subject||'')[0]||'';
 if(['wij','we','jullie'].includes(subject))return 'plural';
 const longest=[...(item.forms||[])].map(normalize).filter(form=>/n$/.test(form)).sort((a,b)=>b.length-a.length)[0];
 if(longest&&heard===longest&&!['ik','jij','je','u','hij','het'].includes(subject))return 'plural';
 if(subject==='ik')return 'stem';
 if(['jij','je'].includes(subject))return words.indexOf(subject)>target.index?'stem':'jij';
 if(subject==='u')return 'u';
 return 'third';
}

// Distractors are finite verbs from other sentences in the same topic with the
// same agreement. Forms of the heard verb are excluded, so near-homophones such
// as word/wordt never compete.
function wordChoices(item,pool,seed){
 const target=targetWord(item),key=agreementKey(item);
 const ownForms=new Set([target.word,...(item.forms||[])].map(normalize));
 const candidates=pool.filter(candidate=>normalize(candidate.nl)!==normalize(item.nl)&&agreementKey(candidate)===key).flatMap(candidate=>{
  const other=targetWord(candidate);
  return other&&!ownForms.has(normalize(other.word))?[other.word]:[];
 });
 const picked=[],seen=new Set([normalize(target.word)]);
 for(const word of shuffle(candidates,`${seed}:distractors`)){
  const normalized=normalize(word);
  if(seen.has(normalized))continue;
  seen.add(normalized);picked.push(matchCase(word,target.index));
  if(picked.length===2)break;
 }
 if(picked.length<2)return null;
 return shuffle([target.word,...picked],`${seed}:options`);
}

function buildQuestion(item,pool,index,seed){
 const target=targetWord(item);
 const options=target&&wordChoices(item,pool,`${seed}:${item.id}`);
 if(!options)return null;
 const ending=item.nl.trim().match(/[.!?]$/)?.[0]||'.';
 const frame=target.words.map((word,position)=>position===target.index?MISSING_WORD_GAP:word).join(' ')+ending;
 return Object.freeze({
  id:`missing-word:${index}:${item.id}`,sourceId:item.id,concept:item.concept,kind:'listen-missing-word',phase:'listening-missing-word',
  releaseLevel:'practice',prompt:'Listen, then choose the missing word.',audio:item.nl,sentence:item.nl,frame,answer:target.word,wordIndex:target.index,meaning:item.en,
  options:Object.freeze(options)
 });
}

function eligibleQuestions(pool,seed){
 return pool.flatMap(item=>{
  const question=buildQuestion(item,pool,0,`${seed}:${item.id}`);
  return question?[{item,question}]:[];
 });
}

export function missingWordOffer(state,content,conceptId,release=MISSING_WORD_RELEASE){
 if(!formatAvailable('listening','practice',release))return null;
 const pool=missingWordPool(state,content,conceptId);
 const eligible=eligibleQuestions(pool,'offer');
 if(!eligible.length)return null;
 return Object.freeze({conceptId,available:eligible.length,count:Math.min(MISSING_WORD_SIZE,eligible.length)});
}

export function startMissingWord(state,content,{conceptId,size=MISSING_WORD_SIZE,seed='listening-missing-word',release=MISSING_WORD_RELEASE}={}){
 if(!formatAvailable('listening','practice',release))throw Error('Optional listening practice is currently unavailable.');
 if(!conceptId||!learnedConcepts(state).has(conceptId))throw Error('Complete the first teaching step before starting listening practice.');
 const pool=missingWordPool(state,content,conceptId);
 const eligible=eligibleQuestions(pool,seed);
 if(!eligible.length)throw Error('This topic needs a few more familiar sentences before this listening practice.');
 const count=Math.max(1,Math.min(MISSING_WORD_SIZE,Math.trunc(size)||MISSING_WORD_SIZE,eligible.length));
 const selected=[...eligible].sort((a,b)=>hash(`${seed}:${a.item.id}`)-hash(`${seed}:${b.item.id}`)).slice(0,count);
 const questions=selected.map((entry,index)=>buildQuestion(entry.item,pool,index,seed));
 if(questions.some(question=>!question||question.audio!==question.sentence||!question.options.includes(question.answer)||new Set(question.options.map(normalize)).size!==question.options.length||!question.frame.includes(MISSING_WORD_GAP)))throw Error('Invalid missing-word question.');
 return Object.freeze({releaseLevel:'practice',capability:'listen',format:'listen-missing-word',conceptId,index:0,questions:Object.freeze(questions),answers:Object.freeze([])});
}

export function currentMissingWordQuestion(session){return session?.questions?.[session.index]||null;}

// A heard answer is listening only when it was made before the sentence was shown.
// After an audio issue the same choice is made with the English meaning visible,
// so it counts as recognition.
export function answerMissingWord(session,raw,{usedTextFallback=false,audioIssue=null}={}){
 const question=currentMissingWordQuestion(session);
 if(!question)throw Error('Listening practice is already complete.');
 if(!String(raw??'').trim())throw Error('Choose an answer first.');
 const issue=['unclear','unavailable'].includes(audioIssue)?audioIssue:null;
 const correct=normalize(raw)===normalize(question.answer);
 const result=Object.freeze({
  questionId:question.id,sourceId:question.sourceId,concept:question.concept,correct,
  capability:usedTextFallback?'recognise':'listen',support:'independent',releaseLevel:'practice',
  usedTextFallback:Boolean(usedTextFallback),...(issue?{audioIssue:issue}:{}),countsTowardProgress:false
 });
 return Object.freeze({...session,index:session.index+1,answers:Object.freeze([...session.answers,result])});
}

export function missingWordSummary(session){
 const answers=session?.answers||[];
 const heard=answers.filter(answer=>!answer.usedTextFallback);
 const audioIssues=answers.filter(answer=>answer.audioIssue).map(answer=>{
  const question=session?.questions?.find(item=>item.id===answer.questionId);
  return Object.freeze({sourceId:answer.sourceId,issue:answer.audioIssue,audio:question?.audio||'',meaning:question?.meaning||''});
 });
 return Object.freeze({total:answers.length,heard:heard.length,heardCorrect:heard.filter(answer=>answer.correct).length,textFallbacks:answers.filter(answer=>answer.usedTextFallback).length,audioUnclear:answers.filter(answer=>answer.audioIssue==='unclear').length,audioUnavailable:answers.filter(answer=>answer.audioIssue==='unavailable').length,audioIssues:Object.freeze(audioIssues),countsTowardProgress:false});
}
