import {formatAvailable} from './format-release.js';
import {LISTENING_EXCHANGES} from '../content/listening-exchanges.js';
import {hash,normalize,shuffle} from './util.js';

export const EXCHANGE_SIZE=5;
// Practice-only gate. It does not change the Core listening question in the daily 20.
export const EXCHANGE_RELEASE=Object.freeze({listening:Object.freeze({releaseLevel:'practice',enabled:true})});

function learnedConcepts(state){
 return new Set(Object.entries(state.progress||{}).filter(([,progress])=>progress&&(progress.taught||progress.lessonAcknowledged||progress.practiceAttempts>0||progress.masteredAt)).map(([id])=>id));
}

export function exchangePool(state,conceptId,exchanges=LISTENING_EXCHANGES){
 if(!conceptId||!learnedConcepts(state).has(conceptId))return [];
 return exchanges.filter(exchange=>exchange.concept===conceptId&&exchange.turns.length===2&&exchange.wrongMeanings.length===2);
}

// Both turns are played as one clip, in one voice, so the pair is heard as a
// single short exchange. Different voices are a later step (DAB-188).
function buildQuestion(exchange,index,seed){
 return Object.freeze({
  id:`exchange:${index}:${exchange.id}`,sourceId:exchange.id,concept:exchange.concept,kind:'listen-exchange',phase:'listening-exchange',
  releaseLevel:'practice',prompt:'Listen to the short exchange, then choose what was said.',
  audio:exchange.turns.map(turn=>turn.nl).join(' '),turns:exchange.turns,meaning:exchange.meaning,
  options:Object.freeze(shuffle([exchange.meaning,...exchange.wrongMeanings],`${seed}:${exchange.id}:options`))
 });
}

export function exchangeOffer(state,conceptId,release=EXCHANGE_RELEASE,exchanges=LISTENING_EXCHANGES){
 if(!formatAvailable('listening','practice',release))return null;
 const pool=exchangePool(state,conceptId,exchanges);
 if(!pool.length)return null;
 return Object.freeze({conceptId,available:pool.length,count:Math.min(EXCHANGE_SIZE,pool.length)});
}

export function startExchangePractice(state,{conceptId,size=EXCHANGE_SIZE,seed='listening-exchange',release=EXCHANGE_RELEASE,exchanges=LISTENING_EXCHANGES}={}){
 if(!formatAvailable('listening','practice',release))throw Error('Optional listening practice is currently unavailable.');
 if(!conceptId||!learnedConcepts(state).has(conceptId))throw Error('Complete the first teaching step before starting listening practice.');
 const pool=exchangePool(state,conceptId,exchanges);
 if(!pool.length)throw Error('This topic has no short exchanges to listen to yet.');
 const count=Math.max(1,Math.min(EXCHANGE_SIZE,Math.trunc(size)||EXCHANGE_SIZE,pool.length));
 const selected=[...pool].sort((a,b)=>hash(`${seed}:${a.id}`)-hash(`${seed}:${b.id}`)).slice(0,count);
 const questions=selected.map((exchange,index)=>buildQuestion(exchange,index,seed));
 if(questions.some(question=>question.options.length!==3||new Set(question.options.map(normalize)).size!==3||!question.options.includes(question.meaning)))throw Error('Invalid exchange question.');
 return Object.freeze({releaseLevel:'practice',capability:'listen',format:'listen-exchange',conceptId,index:0,questions:Object.freeze(questions),answers:Object.freeze([])});
}

export function currentExchangeQuestion(session){return session?.questions?.[session.index]||null;}

// Understanding a heard exchange is listening only. Hearing two turns is not
// taking part in one, so it is never interaction or speaking evidence. After an
// audio issue the turns are shown, and the same choice is recognition.
export function answerExchange(session,raw,{usedTextFallback=false,audioIssue=null}={}){
 const question=currentExchangeQuestion(session);
 if(!question)throw Error('Listening practice is already complete.');
 if(!String(raw??'').trim())throw Error('Choose an answer first.');
 const issue=['unclear','unavailable'].includes(audioIssue)?audioIssue:null;
 const result=Object.freeze({
  questionId:question.id,sourceId:question.sourceId,concept:question.concept,correct:normalize(raw)===normalize(question.meaning),
  capability:usedTextFallback?'recognise':'listen',support:'independent',releaseLevel:'practice',
  interactionEvidence:false,speakingEvidence:false,usedTextFallback:Boolean(usedTextFallback),...(issue?{audioIssue:issue}:{}),countsTowardProgress:false
 });
 return Object.freeze({...session,index:session.index+1,answers:Object.freeze([...session.answers,result])});
}

export function exchangeSummary(session){
 const answers=session?.answers||[];
 const heard=answers.filter(answer=>!answer.usedTextFallback);
 const audioIssues=answers.filter(answer=>answer.audioIssue).map(answer=>{
  const question=session?.questions?.find(item=>item.id===answer.questionId);
  return Object.freeze({sourceId:answer.sourceId,issue:answer.audioIssue,audio:question?.audio||'',meaning:question?.meaning||''});
 });
 return Object.freeze({total:answers.length,heard:heard.length,heardCorrect:heard.filter(answer=>answer.correct).length,textFallbacks:answers.filter(answer=>answer.usedTextFallback).length,audioUnclear:answers.filter(answer=>answer.audioIssue==='unclear').length,audioUnavailable:answers.filter(answer=>answer.audioIssue==='unavailable').length,audioIssues:Object.freeze(audioIssues),countsTowardProgress:false});
}
