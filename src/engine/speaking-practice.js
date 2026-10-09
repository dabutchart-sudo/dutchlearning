import {formatAvailable} from './format-release.js';
import {scoreSpeaking} from './listen-speak-preview.js';
import {hash,normalize} from './util.js';

export const SPEAKING_PRACTICE_SIZE=5;
// Practice-only gate. It does not change the Core speaking question in the daily 20.
export const SPEAKING_PRACTICE_RELEASE=Object.freeze({speaking:Object.freeze({releaseLevel:'practice',enabled:true})});

function learnedConcepts(state){
 return new Set(Object.entries(state.progress||{}).filter(([,progress])=>progress&&(progress.taught||progress.lessonAcknowledged||progress.practiceAttempts>0||progress.masteredAt)).map(([id])=>id));
}

function canSpeak(item){
 const kinds=item.suitableKinds;
 return !Array.isArray(kinds)||kinds.includes('speaking')||kinds.includes('typed');
}

export function speakingPracticePool(state,content,conceptId){
 if(!conceptId||!learnedConcepts(state).has(conceptId))return [];
 const eligible=(content.sentences||[]).filter(item=>item.concept===conceptId&&item.pool==='practice'&&canSpeak(item)&&normalize(item.nl)&&normalize(item.en)&&normalize(item.nl)!==normalize(item.en));
 return [...new Map(eligible.map(item=>[normalize(item.nl),item])).values()];
}

export function speakingPracticeOffer(state,content,conceptId,release=SPEAKING_PRACTICE_RELEASE){
 if(!formatAvailable('speaking','practice',release))return null;
 const pool=speakingPracticePool(state,content,conceptId);
 if(!pool.length)return null;
 return Object.freeze({conceptId,available:pool.length,count:Math.min(SPEAKING_PRACTICE_SIZE,pool.length)});
}

function buildQuestion(item,index){
 return Object.freeze({
  id:`speaking-practice:${index}:${item.id}`,sourceId:item.id,concept:item.concept,kind:'speaking',phase:'speaking-practice',
  releaseLevel:'practice',direction:'en-nl',prompt:item.en,answer:item.nl
 });
}

export function startSpeakingPractice(state,content,{conceptId,size=SPEAKING_PRACTICE_SIZE,seed='speaking-practice',release=SPEAKING_PRACTICE_RELEASE}={}){
 if(!formatAvailable('speaking','practice',release))throw Error('Optional speaking practice is currently unavailable.');
 if(!conceptId||!learnedConcepts(state).has(conceptId))throw Error('Complete the first teaching step before starting speaking practice.');
 const pool=speakingPracticePool(state,content,conceptId);
 if(!pool.length)throw Error('This topic needs a familiar sentence before speaking practice.');
 const count=Math.max(1,Math.min(SPEAKING_PRACTICE_SIZE,Math.trunc(size)||SPEAKING_PRACTICE_SIZE,pool.length));
 const selected=[...pool].sort((a,b)=>hash(`${seed}:${a.id}`)-hash(`${seed}:${b.id}`)).slice(0,count);
 const questions=selected.map((item,index)=>buildQuestion(item,index));
 return Object.freeze({releaseLevel:'practice',capability:'speak',conceptId,index:0,questions:Object.freeze(questions),answers:Object.freeze([])});
}

export function currentSpeakingQuestion(session){return session?.questions?.[session.index]||null;}

function laterReviewQuestion(question){
 return Object.freeze({...question,id:`${question.id}:later-review`,laterReview:true,reviewOf:question.id});
}

function canScheduleLaterReview(session,question,result,nextIndex){
 if(question.laterReview||!result.speakingEvidence||result.correct)return false;
 if(session.questions.some(candidate=>candidate.laterReview))return false;
 return session.questions.slice(nextIndex).some(candidate=>!candidate.laterReview);
}

export function answerSpeakingPractice(session,raw,{typedFallback=false,speechIssue=null,retried=false}={}){
 const question=currentSpeakingQuestion(session);
 if(!question)throw Error('Speaking practice is already complete.');
 const issue=['unavailable','unclear'].includes(speechIssue)?speechIssue:null;
 const spoken=!typedFallback;
 if(issue&&spoken)throw Error('Type the Dutch sentence to continue.');
 const text=String(raw??'');
 if(!text.trim())throw Error(spoken?'Record an answer first.':'Type the Dutch sentence.');
 const score=scoreSpeaking(text,{nl:question.answer,en:question.prompt});
 const result=Object.freeze({
  questionId:question.id,sourceId:question.sourceId,concept:question.concept,correct:score.correct,near:Boolean(score.near),
  capability:spoken?'speak':'produce',support:'independent',releaseLevel:'practice',speakingEvidence:spoken,
  typedFallback:Boolean(typedFallback),retried:Boolean(retried),laterReview:Boolean(question.laterReview),
  ...(question.reviewOf?{reviewOf:question.reviewOf}:{}),...(issue?{speechIssue:issue}:{}),countsTowardProgress:false
 });
 const nextIndex=session.index+1;
 const questions=canScheduleLaterReview(session,question,result,nextIndex)?Object.freeze([...session.questions,laterReviewQuestion(question)]):session.questions;
 return Object.freeze({...session,index:nextIndex,questions,answers:Object.freeze([...session.answers,result])});
}

export function speakingPracticeMayRetry(result){
 return Boolean(result?.speakingEvidence&&!result.correct&&!result.retried&&!result.laterReview);
}

export function speakingPracticeFeedback(result,question,heard=''){
 const spoken=Boolean(result?.speakingEvidence);
 const headline=result?.laterReview?(!spoken?'Later review completed in writing':result.correct?'Recovered on later review':result.near?'Very close on later review':'Not recovered this time'):result?.correct?(spoken?'Understood':'The words match'):result?.near?'Very close':'Not this time';
 return Object.freeze({
  headline,dutch:question?.answer||'',meaning:question?.prompt||'',heard:spoken?String(heard||''):'',
  note:spoken?'This checks whether the words match. It is not a pronunciation score.':'This was typed, so it is writing practice, not speaking evidence.',
  retry:speakingPracticeMayRetry(result),badge:result?.laterReview?(spoken?'Later speaking review':'Later review · writing only'):spoken?'Speaking diagnostic':'Writing only'
 });
}

export function speakingPracticeSummary(session){
 const answers=session?.answers||[];
 const primary=answers.filter(answer=>!answer.laterReview);
 const reviews=answers.filter(answer=>answer.laterReview);
 const spoken=primary.filter(answer=>answer.speakingEvidence);
 const typed=primary.filter(answer=>answer.typedFallback);
 return Object.freeze({
  total:primary.length,spoken:spoken.length,spokenCorrect:spoken.filter(answer=>answer.correct).length,spokenNear:spoken.filter(answer=>answer.near&&!answer.correct).length,
  typed:typed.length,typedCorrect:typed.filter(answer=>answer.correct).length,
  speechUnavailable:answers.filter(answer=>answer.speechIssue==='unavailable').length,speechUnclear:answers.filter(answer=>answer.speechIssue==='unclear').length,
  retried:primary.filter(answer=>answer.retried).length,laterReviewed:reviews.length,
  laterReviewSpoken:reviews.filter(answer=>answer.speakingEvidence).length,
  laterReviewRecovered:reviews.filter(answer=>answer.speakingEvidence&&answer.correct).length,
  laterReviewTyped:reviews.filter(answer=>answer.typedFallback).length,countsTowardProgress:false
 });
}

export function speakingPracticeSummaryCopy(summary){
 const heading=summary.spoken?`${summary.spokenCorrect} of ${summary.spoken} spoken answers matched`:'No answers were spoken';
 const typed=summary.typed?`${summary.typed} ${summary.typed===1?'sentence was':'sentences were'} typed. ${summary.typed===1?'That answer is':'Those answers are'} writing practice, not speaking evidence.`:'Every completed answer was spoken.';
 const issues=[];
 if(summary.speechUnavailable)issues.push(`${summary.speechUnavailable} could not be transcribed`);
 if(summary.speechUnclear)issues.push(`${summary.speechUnclear} ${summary.speechUnclear===1?'was':'were'} unclear`);
 const review=summary.laterReviewRecovered?'One spoken answer was recovered on later review.':summary.laterReviewSpoken?'The later spoken review did not match. The round finished without another repeat.':summary.laterReviewTyped?'The later review was typed, so it is writing practice, not speaking evidence.':'';
 return Object.freeze({heading,typed,speech:issues.length?`Speech problems: ${issues.join('; ')}.`:'',review,note:'No Course, mastery, or retention progress changed. This session-only result is not added to your permanent learning record.'});
}
