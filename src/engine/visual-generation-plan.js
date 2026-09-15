import {visualNeedForRecord} from './visual-need.js';
import {visualGenerationCandidate,visualSemanticDecision} from './visual-semantic-review.js';

const clean=value=>String(value??'').trim();
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

export const VISUAL_GENERATION_DEFAULT_LIMIT=1;

export function visualGenerationPrompt(record={}){
 const dutch=clean(record.dutch),english=clean(record.english),part=clean(record.partofword||record.partOfWord);
 if(!dutch||!english)throw new Error('Visual generation requires Dutch and English text.');
 const kind=part?` The vocabulary item is a ${part}.`:'';
 return `Create one simple, clear educational memory image that communicates the meaning "${english}" for a Dutch learner.${kind} Use an everyday, concrete scene where possible. Do not include written words, letters, captions, labels, flags, subtitles, or the Dutch answer in the image. Avoid decorative details that do not help communicate the meaning.`;
}

export function visualGenerationPlan(record,state={},options={}){
 if(!visualGenerationCandidate(record,state,options))return null;
 const need=visualNeedForRecord(record,state,options),decision=visualSemanticDecision(state,record?.id);
 return {
  cardId:String(record.id),
  dutch:clean(record.dutch),
  english:clean(record.english),
  partOfWord:clean(record.partofword||record.partOfWord),
  prompt:visualGenerationPrompt(record),
  alt:`Visual memory cue for ${clean(record.english)}`,
  reason:'repeated-unresolved-recall',
  semanticDecision:decision?.decision||null,
  recallMissDays:finite(need.recallMissDays),
  recallMisses:finite(need.recallMisses)
 };
}

export function visualGenerationQueue(cards=[],state={},options={}){
 const limit=Math.max(0,Math.trunc(finite(options.limit,VISUAL_GENERATION_DEFAULT_LIMIT)));
 if(!limit)return[];
 return cards.map(record=>({record,need:visualNeedForRecord(record,state,options)}))
  .filter(item=>visualGenerationCandidate(item.record,state,options))
  .sort((a,b)=>b.need.recallMissDays-a.need.recallMissDays||b.need.recallMisses-a.need.recallMisses||String(a.record.id).localeCompare(String(b.record.id),undefined,{numeric:true}))
  .slice(0,limit)
  .map(item=>visualGenerationPlan(item.record,state,options));
}
