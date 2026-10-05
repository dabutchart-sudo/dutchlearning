import {formatAvailable} from './format-release.js';
import {displayTokens,distance,hash,normalize,sentenceCase,shuffle,tokens} from './util.js';

export const DICTATION_SIZE=5;
// Short enough to hold in memory after one hearing.
export const DICTATION_MAX_WORDS=6;
// Practice-only gate. It does not change the Core listening question in the daily 20.
export const DICTATION_RELEASE=Object.freeze({listening:Object.freeze({releaseLevel:'practice',enabled:true})});

function learnedConcepts(state){
 return new Set(Object.entries(state.progress||{}).filter(([,progress])=>progress&&(progress.taught||progress.lessonAcknowledged||progress.practiceAttempts>0||progress.masteredAt)).map(([id])=>id));
}

export function dictationPool(state,content,conceptId){
 if(!conceptId||!learnedConcepts(state).has(conceptId))return [];
 const eligible=(content.sentences||[]).filter(item=>{
  if(item.concept!==conceptId||item.pool!=='practice'||!(item.suitableKinds||[]).includes('listening'))return false;
  const words=tokens(item.nl).length;
  return words>=2&&words<=DICTATION_MAX_WORDS&&normalize(item.en);
 });
 return [...new Map(eligible.map(item=>[normalize(item.nl),item])).values()];
}

// Used only when the audio is unclear or unavailable: the sentence is then shown
// and the learner chooses its English meaning, which is recognition.
function meaningChoices(item,pool,seed){
 const others=[...new Map(pool.filter(candidate=>normalize(candidate.en)!==normalize(item.en)).map(candidate=>[normalize(candidate.en),candidate])).values()];
 const near=others.filter(candidate=>candidate.subject===item.subject||candidate.verb===item.verb);
 const far=others.filter(candidate=>candidate.subject!==item.subject&&candidate.verb!==item.verb);
 const picked=[...shuffle(near,`${seed}:near`),...shuffle(far,`${seed}:far`)].slice(0,2);
 if(picked.length<2)return null;
 return shuffle([item.en,...picked.map(candidate=>candidate.en)],`${seed}:meaning`);
}

function buildQuestion(item,pool,index,seed){
 const meaningOptions=meaningChoices(item,pool,`${seed}:${item.id}`);
 if(!meaningOptions)return null;
 return Object.freeze({
  id:`dictation:${index}:${item.id}`,sourceId:item.id,concept:item.concept,kind:'listen-dictation',phase:'listening-dictation',
  releaseLevel:'practice',prompt:'Listen, then type the Dutch sentence you heard.',audio:item.nl,answer:item.nl,meaning:item.en,
  wordCount:tokens(item.nl).length,meaningOptions:Object.freeze(meaningOptions)
 });
}

function eligibleQuestions(pool,seed){
 return pool.flatMap(item=>{
  const question=buildQuestion(item,pool,0,seed);
  return question?[{item,question}]:[];
 });
}

export function dictationOffer(state,content,conceptId,release=DICTATION_RELEASE){
 if(!formatAvailable('listening','practice',release))return null;
 const eligible=eligibleQuestions(dictationPool(state,content,conceptId),'offer');
 if(!eligible.length)return null;
 return Object.freeze({conceptId,available:eligible.length,count:Math.min(DICTATION_SIZE,eligible.length)});
}

export function startDictation(state,content,{conceptId,size=DICTATION_SIZE,seed='listening-dictation',release=DICTATION_RELEASE}={}){
 if(!formatAvailable('listening','practice',release))throw Error('Optional listening practice is currently unavailable.');
 if(!conceptId||!learnedConcepts(state).has(conceptId))throw Error('Complete the first teaching step before starting listening practice.');
 const pool=dictationPool(state,content,conceptId);
 const eligible=eligibleQuestions(pool,seed);
 if(!eligible.length)throw Error('This topic needs a few more familiar sentences before this listening practice.');
 const count=Math.max(1,Math.min(DICTATION_SIZE,Math.trunc(size)||DICTATION_SIZE,eligible.length));
 const selected=[...eligible].sort((a,b)=>hash(`${seed}:${a.item.id}`)-hash(`${seed}:${b.item.id}`)).slice(0,count);
 const questions=selected.map((entry,index)=>buildQuestion(entry.item,pool,index,seed));
 if(questions.some(question=>!question||question.audio!==question.answer||!question.meaningOptions.includes(question.meaning)))throw Error('Invalid dictation question.');
 return Object.freeze({releaseLevel:'practice',capability:'listen',format:'listen-dictation',conceptId,index:0,questions:Object.freeze(questions),answers:Object.freeze([])});
}

export function currentDictationQuestion(session){return session?.questions?.[session.index]||null;}

// A one-letter slip in a longer word is a spelling near-miss: the word was heard.
function closeSpelling(got,expected){
 return expected.length>=4&&distance(got,expected)<=1;
}

// Marks each word of the heard sentence as matched, misspelled, or missed, and
// lists typed words that were not in it. Words are aligned in order, so one
// missed word does not mark every later word wrong. Capitals and punctuation
// are ignored.
export function dictationMarking(raw,answer){
 const expected=displayTokens(sentenceCase(answer)),want=expected.map(normalize),got=tokens(raw);
 const same=(a,b)=>a===b||closeSpelling(a,b);
 const table=Array.from({length:got.length+1},()=>Array(want.length+1).fill(0));
 for(let i=got.length-1;i>=0;i--)for(let j=want.length-1;j>=0;j--){
  table[i][j]=same(got[i],want[j])?table[i+1][j+1]+1:Math.max(table[i+1][j],table[i][j+1]);
 }
 const words=expected.map(text=>({text,status:'missed'})),extra=[];
 let i=0,j=0;
 while(i<got.length&&j<want.length){
  if(same(got[i],want[j])){words[j]={text:expected[j],status:got[i]===want[j]?'heard':'spelling',typed:got[i]};i++;j++;}
  else if(table[i+1][j]>=table[i][j+1]){extra.push(got[i]);i++;}
  else j++;
 }
 extra.push(...got.slice(i));
 return Object.freeze({words:Object.freeze(words.map(Object.freeze)),extra:Object.freeze(extra)});
}

// Typing a heard sentence is listening plus writing. It is never speaking
// evidence. After an audio issue the sentence is shown and the learner chooses
// its English meaning instead, which is recognition. A slower replay is
// supported listening.
export function answerDictation(session,raw,{usedTextFallback=false,audioIssue=null,slowed=false}={}){
 const question=currentDictationQuestion(session);
 if(!question)throw Error('Listening practice is already complete.');
 const text=String(raw??'');
 if(!text.trim())throw Error(usedTextFallback?'Choose an answer first.':'Type what you heard first.');
 const issue=['unclear','unavailable'].includes(audioIssue)?audioIssue:null;
 const heardSlowly=Boolean(slowed&&!usedTextFallback);
 const base={questionId:question.id,sourceId:question.sourceId,concept:question.concept,support:heardSlowly?'supported':'independent',slowed:heardSlowly,releaseLevel:'practice',speakingEvidence:false,countsTowardProgress:false};
 let result;
 if(usedTextFallback){
  result={...base,correct:normalize(text)===normalize(question.meaning),near:false,capability:'recognise',writing:false,usedTextFallback:true,...(issue?{audioIssue:issue}:{})};
 }else{
  const marking=dictationMarking(text,question.answer);
  const heard=marking.words.filter(word=>word.status!=='missed').length;
  const exact=marking.words.every(word=>word.status==='heard')&&!marking.extra.length;
  const near=!exact&&marking.words.every(word=>word.status!=='missed')&&!marking.extra.length;
  result={...base,correct:exact,near,capability:'listen',writing:true,usedTextFallback:false,wordsHeard:heard,wordCount:marking.words.length};
 }
 return Object.freeze({...session,index:session.index+1,answers:Object.freeze([...session.answers,Object.freeze(result)])});
}

export function dictationSummary(session){
 const answers=session?.answers||[];
 const heard=answers.filter(answer=>!answer.usedTextFallback);
 const audioIssues=answers.filter(answer=>answer.audioIssue).map(answer=>{
  const question=session?.questions?.find(item=>item.id===answer.questionId);
  return Object.freeze({sourceId:answer.sourceId,issue:answer.audioIssue,audio:question?.audio||'',meaning:question?.meaning||''});
 });
 return Object.freeze({
  total:answers.length,heard:heard.length,heardCorrect:heard.filter(answer=>answer.correct).length,heardNear:heard.filter(answer=>answer.near).length,slowed:heard.filter(answer=>answer.slowed).length,
  wordsHeard:heard.reduce((sum,answer)=>sum+answer.wordsHeard,0),words:heard.reduce((sum,answer)=>sum+answer.wordCount,0),
  textFallbacks:answers.filter(answer=>answer.usedTextFallback).length,audioUnclear:answers.filter(answer=>answer.audioIssue==='unclear').length,audioUnavailable:answers.filter(answer=>answer.audioIssue==='unavailable').length,
  audioIssues:Object.freeze(audioIssues),countsTowardProgress:false
 });
}
