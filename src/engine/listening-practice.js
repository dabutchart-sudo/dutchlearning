import {makeExercise} from './exercises.js';
import {formatAvailable} from './format-release.js';
import {hash,normalize} from './util.js';

export const LISTENING_PRACTICE_SIZE=5;
export const LISTENING_PRACTICE_RELEASE=Object.freeze({listening:Object.freeze({releaseLevel:'practice',enabled:true})});

export function listeningPracticeItems(state,content){
 const learned=new Set(content.concepts.filter(c=>{
  const p=state.progress?.[c.id];
  return p&&(p.taught||p.lessonAcknowledged||p.practiceAttempts>0||p.masteredAt);
 }).map(c=>c.id));
 const eligible=content.sentences.filter(item=>item.pool==='practice'&&learned.has(item.concept)&&(item.suitableKinds||[]).includes('listening'));
 return [...new Map(eligible.map(item=>[normalize(item.nl),item])).values()];
}

export function startListeningPractice(state,content,{size=LISTENING_PRACTICE_SIZE,seed='listening-practice'}={}){
 if(!formatAvailable('listening','practice',LISTENING_PRACTICE_RELEASE))throw Error('Optional listening practice is currently unavailable.');
 const available=listeningPracticeItems(state,content);
 if(!available.length)throw Error('Complete the first teaching step before starting listening practice.');
 const count=Math.max(1,Math.min(LISTENING_PRACTICE_SIZE,Math.trunc(size)||LISTENING_PRACTICE_SIZE));
 const selected=[...available].sort((a,b)=>hash(`${seed}:${a.id}`)-hash(`${seed}:${b.id}`)).slice(0,count);
 const questions=selected.map((item,index)=>makeExercise(item,'listening',content,{phase:'listening-practice',seed:`${seed}:${index}`}));
 return Object.freeze({releaseLevel:'practice',capability:'listen',index:0,questions:Object.freeze(questions),answers:Object.freeze([])});
}

export function currentListeningQuestion(session){return session?.questions?.[session.index]||null;}

export function answerListeningPractice(session,raw,{usedTextFallback=false}={}){
 const question=currentListeningQuestion(session);
 if(!question)throw Error('Listening practice is already complete.');
 if(!String(raw??'').trim())throw Error('Choose an answer first.');
 const correct=normalize(raw)===normalize(question.answer);
 const result=Object.freeze({
  questionId:question.id,sourceId:question.sourceId,concept:question.concept,correct,
  capability:usedTextFallback?'recognise':'listen',support:'independent',releaseLevel:'practice',
  usedTextFallback:Boolean(usedTextFallback),countsTowardProgress:false
 });
 return Object.freeze({...session,index:session.index+1,answers:Object.freeze([...session.answers,result])});
}

export function listeningPracticeSummary(session){
 const answers=session?.answers||[];
 const heard=answers.filter(a=>!a.usedTextFallback);
 return Object.freeze({total:answers.length,heard:heard.length,heardCorrect:heard.filter(a=>a.correct).length,textFallbacks:answers.filter(a=>a.usedTextFallback).length,countsTowardProgress:false});
}
