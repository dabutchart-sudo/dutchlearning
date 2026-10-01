import {dayKey} from './util.js';

// A read-only interpretation of saved attempts. Counts are evidence, not levels or
// interchangeable scores; older records without the needed fields are left out.
export function capabilityProfile(state,{today=dayKey()}={}){
 const seen=new Set();
 const attempts=(state.attempts||[]).filter(a=>{
  if(!a||a.id&&seen.has(a.id))return false;
  if(a.id)seen.add(a.id);
  const date=a.date||String(a.occurredAt||'').slice(0,10);
  return !/^\d{4}-\d{2}-\d{2}$/.test(date)||date<=today;
 });
 const assessed=(predicate)=>attempts.filter(a=>predicate(a)&&typeof a.grammar==='boolean');
 const evidence=(rows)=>({correct:rows.filter(a=>a.grammar===true).length,total:rows.length});
 const recallAttempts=attempts.filter(a=>a.assisted===false&&['typed','gap','correction'].includes(a.kind));
 const recallWords=new Set(recallAttempts.flatMap(a=>a.wordEvidence?.successful||[]));
 const attemptedWords=new Set(recallAttempts.flatMap(a=>[...(a.wordEvidence?.attempted||[]),...(a.wordEvidence?.successful||[])]));
 const construction=evidence(assessed(a=>['wordbank','gap','form'].includes(a.kind)));
 const reading=evidence(assessed(a=>a.kind==='choice'&&a.direction==='nl-en'));
 const listening=evidence(assessed(a=>a.kind==='listening'));
 const writing=evidence(assessed(a=>a.kind==='typed'&&a.direction==='en-nl'&&a.assisted===false));
 const speaking=evidence(assessed(a=>a.kind==='speaking'));
 const proofPasses=Object.values(state.progress||{}).flatMap(p=>p?.proofHistory||[]).filter(p=>p?.type==='mastery'&&p.passed===true&&(!p.studyDate||p.studyDate<=today)).length;
 return [
  {id:'recall',title:'Vocabulary / recall',correct:recallWords.size,total:attemptedWords.size,detail:recallWords.size?`${recallWords.size} distinct Dutch words recorded as recalled in unassisted writing or form completion.`:'No word-level recall recorded yet.',rule:'Word help and recognition do not prove recall; older answers without word detail are unclassified.'},
  {id:'construction',title:'Grammar / construction',...construction,detail:proofPasses?`${proofPasses} mastery ${proofPasses===1?'test':'tests'} passed. Guided construction counts as practice, not independent proof.`:'Guided construction is practice; a passed mastery test is separate proof.',rule:'Grammar is counted only when assessed; spelling is separate.'},
  {id:'reading',title:'Reading',...reading,detail:'Visible Dutch → English meaning choices.',rule:'Listening from hidden audio is tracked separately.'},
  {id:'listening',title:'Listening',...listening,detail:'Hidden-audio meaning answers in normal Learning.',rule:'Visible-text playback and text fallback do not count as listening evidence.'},
  {id:'writing',title:'Writing / production',...writing,detail:'Unassisted English → Dutch typed sentences, including unsuccessful attempts.',rule:'Word help and word banks do not prove independent writing. A typed speech fallback counts here, not as speaking.'},
  {id:'speaking',title:'Speaking',...speaking,detail:'Spoken responses matched against a transcript.',rule:'This does not assess pronunciation; a typed fallback is not speaking.'},
  {id:'interaction',title:'Interaction',correct:0,total:0,detail:'No recorded multi-turn exchange yet.',rule:'An isolated sentence does not prove interaction.'}
 ];
}
