import {PRODUCTION_STAGE} from './flashcards.js';

const DAY_MS=86400000;
const stages=[PRODUCTION_STAGE.SUPPORTED,PRODUCTION_STAGE.GUIDED,PRODUCTION_STAGE.INDEPENDENT,PRODUCTION_STAGE.CONTEXTUAL];
const blankStage=()=>({correct:0,total:0,rate:null});
const rate=(correct,total)=>total?correct/total:null;
const dayNumber=value=>{const d=new Date(`${String(value).slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:Math.floor(d.getTime()/DAY_MS);};

export function productionProgress(state={}, {today,days=14}={}){
 if(!today)throw new Error('Production progress requires a study day.');
 const end=dayNumber(today),windowDays=Math.max(1,Math.trunc(Number(days)||14)),start=end-windowDays+1;
 const history=Array.isArray(state.flashcardProduction?.attempts)?state.flashcardProduction.attempts:[];
 const attempts=history.filter(a=>{
  if(a?.meaningful!==true)return false;
  const day=dayNumber(a.date||a.timestamp);
  return day!==null&&day>=start&&day<=end;
 });
 const byStage=Object.fromEntries(stages.map(s=>[s,blankStage()]));
 let correct=0;
 for(const attempt of attempts){
  const stage=byStage[attempt.stage]??(byStage[attempt.stage]=blankStage());
  stage.total++;
  if(attempt.correct===true){stage.correct++;correct++;}
 }
 for(const stage of Object.values(byStage))stage.rate=rate(stage.correct,stage.total);
 const latestMissByCard=new Map();
 for(const attempt of [...attempts].reverse()){
  if(attempt.correct!==false)continue;
  const id=String(attempt.cardId??'');
  if(id&&!latestMissByCard.has(id))latestMissByCard.set(id,{cardId:id,date:String(attempt.date||'').slice(0,10),stage:attempt.stage,prompt:attempt.prompt||'',expected:attempt.expected||''});
 }
 return {days:windowDays,total:attempts.length,correct,rate:rate(correct,attempts.length),byStage,recentMisses:[...latestMissByCard.values()].slice(0,3)};
}
