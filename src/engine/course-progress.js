import {dayKey,addDays} from './util.js';
import {activeConcept,blankProgress,phase,unlocked,proofEligibility,masteryPracticeNeed,masteryPrerequisiteNeed} from './learner.js';
import {firstMasteryReadinessNeed} from './mastery-readiness.js';
import {proofVocabularyNeed} from './proof-vocabulary.js';
import {availableProofCount} from './scheduler.js';

// Display-only roadmap, sourced from docs/a1-completion-target.md. These entries
// never enter the exercise registry, scheduler, or completion denominator.
export const plannedTopics=[
 ['A1.22','Simple directions and location'],
 ['A1.23','Requests and service Dutch'],['A1.24','Connecting ideas'],
 ['A1.25','Daily-life consolidation'],['A1.26','A1 integrated checkpoint']
].map(([id,title])=>({id,title,level:'A1',status:'planned'}));
const statusLabels={upcoming:'Upcoming',lesson:'Lesson ready',learning:'In practice','proof-ready':'Test ready','retention-wait':'Waiting for retention','retention-ready':'Retention ready',mastered:'Retained',reinforcement:'Revisiting'};
const validDay=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;};
const attemptDay=a=>validDay(a.date)?a.date:validDay(String(a.occurredAt||'').slice(0,10))?String(a.occurredAt).slice(0,10):null;
export const isIndependentAttempt=a=>a.kind==='typed'&&a.direction==='en-nl'&&a.assisted===false;
const count=n=>Math.max(0,Number(n)||0);
function journeyOf(p,status,available,practiceNeed){
 const latest=p.proofHistory?.at(-1);
 if(!available)return count(p.practiceAttempts)||p.taught?{label:'Paused',reason:'Earlier retention needs attention before this topic can continue. Your recorded practice is preserved.'}:{label:'Not started',reason:'This topic unlocks after its prerequisite passes mastery.'};
 if(status==='reinforcement')return {label:'Needs attention',reason:'A maintenance answer needs review. Earlier retention proof is still kept.'};
 if(latest?.passed===false&&!p.retentionDue&&!p.masteredAt)return latest.type==='mastery'
  ?{label:'Needs attention',reason:'The latest mastery test was not passed. Targeted practice is available before a full retake.'}
  :{label:'Needs attention',reason:'The delayed retention test was not passed. Practice is needed before another retention check.'};
 if(status==='mastered')return {label:'Retaining',reason:`A delayed retention test was passed${p.masteredAt?` on ${p.masteredAt}`:''}. Future reviews keep this topic in use.`};
 if(['retention-wait','retention-ready'].includes(status))return {label:'Proven',reason:'The mastery test passed. A delayed retention check is still needed.'};
 if(status==='proof-ready')return practiceNeed?{label:'Practising',reason:practiceNeed}:{label:'Practising',reason:'The practice requirement is met; a mastery test is the next independent check.'};
 if(status==='lesson')return {label:'Not started',reason:'The lesson and practice have not started yet.'};
 if(count(p.practiceAttempts))return {label:'Practising',reason:`${count(p.practiceAttempts)} practice answers recorded. Practice alone does not prove mastery.`};
 return {label:'Learning',reason:'The lesson has begun; practice and proof are still ahead.'};
}
export function courseOutline(state,content,{today=dayKey()}={}){
 const currentId=content.concepts.some(c=>unlocked(c,state)&&!state.progress[c.id]?.masteredAt)?activeConcept(state,content,today):null;
 const topics=content.concepts.map(c=>{
  const p=state.progress[c.id]||blankProgress(),available=unlocked(c,state);
  const untouched=!p.masteredAt&&!p.retentionDue&&!p.lessonAcknowledged&&!p.practiceAttempts&&!p.recognised&&!p.constructed&&!p.independent;
  const status=!available?'upcoming':untouched?'lesson':phase(p,today);
  const required=Math.max(1,count(c.minPractice)||40),attempts=count(p.practiceAttempts),remaining=Math.max(0,required-attempts);
  let nextStep;
  if(!available)nextStep=count(p.practiceAttempts)||p.taught?`Complete the earlier topic’s recovery and delayed retention check to continue this topic. Your practice here is saved.`:`Pass ${c.prerequisites.join(' and ')} mastery to begin this topic.`;
  else if(state.proof?.concept===c.id)nextStep=`Finish your ${state.proof.type} test (${state.proof.index} of ${state.proof.questions.length} answered).`;
  else if(status==='lesson')nextStep='Read the lesson, then begin guided practice.';
  else if(status==='proof-ready'||status==='retention-ready'){
   const type=status==='proof-ready'?'mastery':'retention';
   const eligibility=proofEligibility(state,content,c.id,type,new Date(today+'T12:00:00'));
   nextStep=eligibility==='Finish the current question first.'?'An unfinished practice question is open. Review this topic’s mastery and retention timing before you answer it.':eligibility||`Take the ${type==='mastery'?'20-question mastery':'10-question retention'} test. Pass grammar in both directions${type==='retention'?' to retain this topic':''}.`;
  }else if(status==='retention-wait')nextStep=`Your retention check can open from ${p.retentionDue}, once ten fresh test sentences and ten daily questions are available. ${content.concepts.some(next=>next.prerequisites.includes(c.id))?'You may study the next topic while you wait; this one is not retained yet.':'This topic is not retained yet.'}`;
  else if(status==='mastered')nextStep='Retained after a delayed check. Future practice will revisit this skill.';
  else if(status==='reinforcement')nextStep='Revisit this retained skill in maintenance practice. Earlier retention evidence is kept.';
  else if(p.proofHistory?.at(-1)?.type==='mastery'&&p.proofHistory.at(-1).passed===false)nextStep='Your mastery retake can start from your next study day once fresh test sentences and all 20 daily questions are available. You can practise today.';
  else nextStep=[remaining?`${remaining} more practice ${remaining===1?'answer':'answers'} to reach the ${required}-answer test requirement.`:'Practice requirement reached.',p.remedial?`${p.remedial} successful practice ${p.remedial===1?'answer':'answers'} still needed after your last test.`:''].filter(Boolean).join(' ');
  const writingNeed=status==='proof-ready'?firstMasteryReadinessNeed(state,c.id,new Date(today+'T12:00:00')):null;
  const vocabulary=status==='proof-ready'?proofVocabularyNeed(state,content,c.id,'mastery'):null;
  const needsMaterial=status==='proof-ready'&&(vocabulary?.potential<vocabulary?.required||(!vocabulary?.missing&&availableProofCount(state,content,c.id)<20));
  const needsMorePractice=status==='proof-ready'&&(writingNeed||masteryPracticeNeed(state,content,c.id)||vocabulary?.missing);
  const readinessNeed=status==='proof-ready'?masteryPrerequisiteNeed(state,content,c.id)||masteryPracticeNeed(state,content,c.id)||writingNeed||(vocabulary?.missing?'More completed topic practice is needed before enough fresh test sentences use familiar words.':null):null;
  const journey=journeyOf(p,status,available,readinessNeed);
  return {...c,status,label:!available?journey.label:needsMaterial?'Test unavailable':needsMorePractice?'More practice':statusLabels[status]||'In practice',journey,available,current:c.id===currentId,attempts,required,remaining,retained:!!p.masteredAt,retainedAt:p.masteredAt||null,retentionDue:p.retentionDue||null,nextStep};
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
 if(!['independent','supported','all'].includes(cohort))throw Error('Unknown evidence group.');
 if(days!==null&&(!Number.isInteger(days)||days<1||days>3660))throw Error('Invalid reporting window.');
 // Older success-only `independent` flags are intentionally not used as the
 // denominator. Failed independent attempts belong in this group too.
 const seen=new Set();
 const all=(state.attempts||[]).filter(a=>{
  if(!a||!attemptDay(a)||attemptDay(a)>today)return false;
  if(a.id&&seen.has(a.id))return false;if(a.id)seen.add(a.id);
  if(a.phase==='extra')return false;
  return !concept||a.concept===concept;
 }).sort((a,b)=>attemptDay(a).localeCompare(attemptDay(b))||String(a.occurredAt||'').localeCompare(String(b.occurredAt||'')));
 const start=days===null?(attemptDay(all[0]||{})||today):addDays(today,1-days);
 const inRange=all.filter(a=>attemptDay(a)>=start);
 const todayAttempts=all.filter(a=>attemptDay(a)===today);
 const independent=inRange.filter(isIndependentAttempt);
 const supportedKinds=new Set(['gap','correction','wordbank','choice','form','correct-sentence','listening','speaking']);
 const supported=inRange.filter(a=>!isIndependentAttempt(a)&&(a.assisted===true||supportedKinds.has(a.kind)));
 const unclassified=inRange.length-independent.length-supported.length;
 const selected=cohort==='independent'?independent:cohort==='supported'?supported:inRange;
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
