import {formatAvailable} from './format-release.js';
import {hash,normalize,shuffle} from './util.js';

export const DISCRIMINATION_SIZE=5;
// Practice-only gate. It does not change the Core listening question in the daily 20.
export const SENTENCE_DISCRIMINATION_RELEASE=Object.freeze({listening:Object.freeze({releaseLevel:'practice',enabled:true})});

function learnedConcepts(state){
 return new Set(Object.entries(state.progress||[]).filter(([,progress])=>progress&&(progress.taught||progress.lessonAcknowledged||progress.practiceAttempts>0||progress.masteredAt)).map(([id])=>id));
}

export function discriminationPool(state,content,conceptId){
 if(!conceptId||!learnedConcepts(state).has(conceptId))return [];
 const eligible=(content.sentences||[]).filter(item=>item.concept===conceptId&&item.pool==='practice'&&(item.suitableKinds||[]).includes('listening')&&normalize(item.nl)&&normalize(item.en));
 return [...new Map(eligible.map(item=>[normalize(item.nl),item])).values()];
}

function rankedDistractors(item,pool,seed){
 const others=pool.filter(candidate=>normalize(candidate.nl)!==normalize(item.nl));
 const near=others.filter(candidate=>candidate.subject===item.subject||candidate.verb===item.verb);
 const far=others.filter(candidate=>candidate.subject!==item.subject&&candidate.verb!==item.verb);
 return [...shuffle(near,`${seed}:near`),...shuffle(far,`${seed}:far`)];
}

function dutchChoices(item,pool,seed){
 const picked=[];
 const seen=new Set([normalize(item.nl)]);
 for(const candidate of rankedDistractors(item,pool,seed)){
  const key=normalize(candidate.nl);
  if(seen.has(key))continue;
  seen.add(key);picked.push(candidate);
  if(picked.length===2)break;
 }
 if(picked.length<2)return null;
 return {
  options:shuffle([item.nl,...picked.map(candidate=>candidate.nl)],`${seed}:options`),
  optionMeanings:Object.fromEntries([item,...picked].map(candidate=>[normalize(candidate.nl),candidate.en]))
 };
}

function meaningChoices(item,pool,seed){
 const others=pool.filter(candidate=>normalize(candidate.en)!==normalize(item.en)&&normalize(candidate.nl)!==normalize(item.nl));
 const unique=[...new Map(others.map(candidate=>[normalize(candidate.en),candidate])).values()];
 const near=unique.filter(candidate=>candidate.subject===item.subject||candidate.verb===item.verb);
 const far=unique.filter(candidate=>candidate.subject!==item.subject&&candidate.verb!==item.verb);
 const picked=[...shuffle(near,`${seed}:mnear`),...shuffle(far,`${seed}:mfar`)].slice(0,2);
 if(!picked.length)return null;
 return shuffle([item.en,...picked.map(candidate=>candidate.en)],`${seed}:meaning`);
}

function buildQuestion(item,pool,index,seed){
 const dutch=dutchChoices(item,pool,`${seed}:${item.id}`);
 const meanings=dutch&&meaningChoices(item,pool,`${seed}:${item.id}`);
 if(!dutch||!meanings)return null;
 return Object.freeze({
  id:`discrimination:${index}:${item.id}`,sourceId:item.id,concept:item.concept,kind:'listen-discriminate',phase:'listening-discrimination',
  releaseLevel:'practice',prompt:'Listen, then choose the Dutch sentence you heard.',audio:item.nl,answer:item.nl,meaning:item.en,
  options:Object.freeze(dutch.options),optionMeanings:Object.freeze(dutch.optionMeanings),meaningOptions:Object.freeze(meanings)
 });
}

export function sentenceDiscriminationOffer(state,content,conceptId,release=SENTENCE_DISCRIMINATION_RELEASE){
 if(!formatAvailable('listening','practice',release))return null;
 const pool=discriminationPool(state,content,conceptId);
 const eligible=pool.filter(item=>buildQuestion(item,pool,0,item.id));
 if(!eligible.length)return null;
 return Object.freeze({conceptId,available:eligible.length,count:Math.min(DISCRIMINATION_SIZE,eligible.length)});
}

export function startSentenceDiscrimination(state,content,{conceptId,size=DISCRIMINATION_SIZE,seed='listening-discrimination',release=SENTENCE_DISCRIMINATION_RELEASE}={}){
 if(!formatAvailable('listening','practice',release))throw Error('Optional listening practice is currently unavailable.');
 if(!conceptId||!learnedConcepts(state).has(conceptId))throw Error('Complete the first teaching step before starting listening practice.');
 const pool=discriminationPool(state,content,conceptId);
 const eligible=pool.flatMap(item=>{
  const question=buildQuestion(item,pool,0,`${seed}:${item.id}`);
  return question?[{item,question}]:[];
 });
 if(!eligible.length)throw Error('This topic needs a few more familiar sentences before this listening practice.');
 const count=Math.max(1,Math.min(DISCRIMINATION_SIZE,Math.trunc(size)||DISCRIMINATION_SIZE,eligible.length));
 const selected=[...eligible].sort((a,b)=>hash(`${seed}:${a.item.id}`)-hash(`${seed}:${b.item.id}`)).slice(0,count);
 const questions=selected.map((entry,index)=>buildQuestion(entry.item,pool,index,seed));
 if(questions.some(question=>!question||question.audio!==question.answer||!question.options.includes(question.answer)||!question.meaningOptions.includes(question.meaning)))throw Error('Invalid sentence-discrimination question.');
 return Object.freeze({releaseLevel:'practice',capability:'listen',format:'listen-discriminate',conceptId,index:0,questions:Object.freeze(questions),answers:Object.freeze([])});
}

export function currentDiscriminationQuestion(session){return session?.questions?.[session.index]||null;}

export function answerSentenceDiscrimination(session,raw,{usedTextFallback=false,audioIssue=null}={}){
 const question=currentDiscriminationQuestion(session);
 if(!question)throw Error('Listening practice is already complete.');
 if(!String(raw??'').trim())throw Error('Choose an answer first.');
 const issue=['unclear','unavailable'].includes(audioIssue)?audioIssue:null;
 const expected=usedTextFallback?question.meaning:question.answer;
 const correct=normalize(raw)===normalize(expected);
 const result=Object.freeze({
  questionId:question.id,sourceId:question.sourceId,concept:question.concept,correct,
  capability:usedTextFallback?'recognise':'listen',support:'independent',releaseLevel:'practice',
  usedTextFallback:Boolean(usedTextFallback),...(issue?{audioIssue:issue}:{}),countsTowardProgress:false
 });
 return Object.freeze({...session,index:session.index+1,answers:Object.freeze([...session.answers,result])});
}

export function discriminationSummary(session){
 const answers=session?.answers||[];
 const heard=answers.filter(answer=>!answer.usedTextFallback);
 const audioIssues=answers.filter(answer=>answer.audioIssue).map(answer=>{
  const question=session?.questions?.find(item=>item.id===answer.questionId);
  return Object.freeze({sourceId:answer.sourceId,issue:answer.audioIssue,audio:question?.audio||'',meaning:question?.meaning||''});
 });
 return Object.freeze({total:answers.length,heard:heard.length,heardCorrect:heard.filter(answer=>answer.correct).length,textFallbacks:answers.filter(answer=>answer.usedTextFallback).length,audioUnclear:answers.filter(answer=>answer.audioIssue==='unclear').length,audioUnavailable:answers.filter(answer=>answer.audioIssue==='unavailable').length,audioIssues:Object.freeze(audioIssues),countsTowardProgress:false});
}
