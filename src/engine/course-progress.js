import {dayKey,addDays} from './util.js';
import {blankProgress,phase,unlocked,proofEligibility} from './learner.js';

// Display-only roadmap, sourced from docs/a1-completion-target.md. These entries
// never enter the exercise registry, scheduler, or completion denominator.
export const plannedTopics=[
 ['A1.21','Place and movement'],['A1.22','Simple directions and location'],
 ['A1.23','Requests and service Dutch'],['A1.24','Connecting ideas'],
 ['A1.25','Daily-life consolidation'],['A1.26','A1 integrated checkpoint']
].map(([id,title])=>({id,title,level:'A1',status:'planned'}));
const statusLabels={upcoming:'Upcoming',lesson:'Lesson ready',learning:'In practice','proof-ready':'Test ready','retention-wait':'Waiting for retention','retention-ready':'Retention ready',mastered:'Retained',reinforcement:'Revisiting'};
const validDay=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;};
const attemptDay=a=>validDay(a.date)?a.date:validDay(String(a.occurredAt||'').slice(0,10))?String(a.occurredAt).slice(0,10):null;
export const isIndependentAttempt=a=>a.kind==='typed'&&a.direction==='en-nl'&&a.assisted===false;
const count=n=>Math.max(0,Number(n)||0);
export function courseOutline(state,content,{today=dayKey()}={}){
 const currentId=content.concepts.find(c=>unlocked(c,state)&&!state.progress[c.id]?.masteredAt)?.id||null;
 const topics=content.concepts.map(c=>{
  const p=state.progress[c.id]||blankProgress(),available=unlocked(c,state);
  const untouched=!p.masteredAt&&!p.retentionDue&&!p.lessonAcknowledged&&!p.practiceAttempts&&!p.recognised&&!p.constructed&&!p.independent;
  const status=!available?'upcoming':untouched?'lesson':phase(p,today);
  const required=Math.max(1,count(c.minPractice)||40),attempts=count(p.practiceAttempts),remaining=Math.max(0,required-attempts);
  let nextStep;
  if(!available)nextStep=`Retain ${c.prerequisites.join(' and ')} to unlock this topic.`;
  else if(state.proof?.concept===c.id)nextStep=`Finish your ${state.proof.type} test (${state.proof.index} of ${state.proof.questions.length} answered).`;
  else if(status==='lesson')nextStep='Read the lesson, then begin guided practice.';
  else if(status==='proof-ready'||status==='retention-ready'){
   const type=status==='proof-ready'?'mastery':'retention';
   nextStep=proofEligibility(state,content,c.id,type,new Date(today+'T12:00:00'))||`Take the ${type==='mastery'?'20-question mastery':'10-question retention'} test. Pass grammar in both directions${type==='retention'?' to unlock the next topic':''}.`;
  }else if(status==='retention-wait')nextStep=`Your retention check opens on ${p.retentionDue}. Passing it unlocks the next topic.`;
  else if(status==='mastered')nextStep='Retained after a delayed check. Future practice will revisit this skill.';
  else if(status==='reinforcement')nextStep='Revisit this retained skill in maintenance practice. Earlier retention evidence is kept.';
  else nextStep=[remaining?`${remaining} more practice ${remaining===1?'answer':'answers'} to reach the ${required}-answer test requirement.`:'Practice requirement reached.',p.remedial?`${p.remedial} successful practice ${p.remedial===1?'answer':'answers'} still needed after your last test.`:''].filter(Boolean).join(' ');
  return {...c,status,label:statusLabels[status]||'In practice',available,current:c.id===currentId,attempts,required,remaining,retained:!!p.masteredAt,retainedAt:p.masteredAt||null,nextStep};
 });
 return {topics,current:topics.find(c=>c.current)||null,retained:topics.filter(c=>c.retained).length,total:topics.length,
  planned:plannedTopics.filter(p=>!content.conceptById[p.id]),levels:[...new Set(topics.map(c=>c.level))]};
}
export function accuracy(attempts,field){
 const assessed=attempts.filter(a=>typeof a[field]==='boolean'),correct=assessed.filter(a=>a[field]).length;
 return {correct,total:assessed.length,rate:assessed.length?correct/assessed.length:null,unassessed:attempts.length-assessed.length};
}
function aggregate(attempts){return {total:attempts.length,grammar:accuracy(attempts,'grammar'),spelling:accuracy(attempts,'spelling')};}
export function learningProgress(state,{today=dayKey(),days=30,cohort='independent',concept=null}={}){
 if(!validDay(today))throw Error('A valid study day is required.');
 if(!['independent','supported'].includes(cohort))throw Error('Unknown evidence group.');
 if(days!==null&&(!Number.isInteger(days)||days<1||days>3660))throw Error('Invalid reporting window.');
 // Older success-only `independent` flags are intentionally not used as the
 // denominator. Failed independent attempts belong in this group too.
 const seen=new Set();
 const all=(state.attempts||[]).filter(a=>{
  if(!a||!attemptDay(a)||attemptDay(a)>today)return false;
  if(a.id&&seen.has(a.id))return false;if(a.id)seen.add(a.id);
  return !concept||a.concept===concept;
 }).sort((a,b)=>attemptDay(a).localeCompare(attemptDay(b))||String(a.occurredAt||'').localeCompare(String(b.occurredAt||'')));
 const start=days===null?(attemptDay(all[0]||{})||today):addDays(today,1-days);
 const inRange=all.filter(a=>attemptDay(a)>=start);
 const todayAttempts=all.filter(a=>attemptDay(a)===today);
 const independent=inRange.filter(isIndependentAttempt);
 const supportedKinds=new Set(['gap','correction','wordbank','choice','form','correct-sentence','listening','speaking']);
 const supported=inRange.filter(a=>!isIndependentAttempt(a)&&(a.assisted===true||supportedKinds.has(a.kind)));
 const unclassified=inRange.length-independent.length-supported.length;
 const selected=cohort==='independent'?independent:supported;
 const byDay=new Map();
 for(const a of selected){const date=attemptDay(a);if(!byDay.has(date))byDay.set(date,[]);byDay.get(date).push(a);}
 const daily=[...byDay.entries()].map(([date,attempts])=>({date,...aggregate(attempts)}));
 const last=selected.slice(-20),previous=selected.slice(-40,-20);
 const latest=aggregate(last),prior=aggregate(previous);
 const comparable=last.length===20&&previous.length===20&&latest.grammar.total>=10&&prior.grammar.total>=10;
 return {today,start,cohort,concept,total:inRange.length,todayTotal:todayAttempts.length,todayIndependent:todayAttempts.filter(isIndependentAttempt).length,todaySupported:todayAttempts.filter(a=>!isIndependentAttempt(a)&&(a.assisted===true||supportedKinds.has(a.kind))).length,studyDays:new Set(inRange.map(attemptDay)).size,
  independent:independent.length,supported:supported.length,unclassified,assisted:inRange.filter(a=>a.assisted===true).length,
  selected:aggregate(selected),daily,latest,prior,comparison:comparable?{delta:latest.grammar.rate-prior.grammar.rate}:null,
  undated:(state.attempts||[]).filter(a=>a&&!attemptDay(a)).length};
}
