import a1CoreExpansion from './a1-core-expansion.js';
import a1CoreExpansion2 from './a1-core-expansion-2.js';
import a1CoreExpansion3 from './a1-core-expansion-3.js';
import a1ProofRetryBuffer from './a1-proof-retry-buffer.js';
import a1CoreExpansion4 from './a1-core-expansion-4.js';
import a1CoreExpansion4ProofBuffer from './a1-core-expansion-4-proof-buffer.js';
import a1CoreExpansion5 from './a1-core-expansion-5.js';
import a1CoreExpansion5ProofBuffer from './a1-core-expansion-5-proof-buffer.js';
import a1CapabilityExpansion1 from './a1-capability-expansion-1.js';
import a1CapabilityExpansion2 from './a1-capability-expansion-2.js';
import a1CapabilityExpansion3 from './a1-capability-expansion-3.js';
import a1CapabilityExpansion4 from './a1-capability-expansion-4.js';
import {completeA1Vocabulary} from './a1-vocabulary.js';
import {fairPracticeRows} from './a1-fair-practice.js';
import a1ProofCapacity from './a1-proof-capacity.js';
import {normalize,tokens} from '../engine/util.js';
export function registerPacks(packs){
 const includesMainCourse=packs.some(p=>p?.id==='foundation-a1');
 const sources=includesMainCourse?[...packs,a1CoreExpansion,a1CoreExpansion2,a1CoreExpansion3,a1ProofRetryBuffer,a1CoreExpansion4,a1CoreExpansion4ProofBuffer,a1CoreExpansion5,a1CoreExpansion5ProofBuffer,a1CapabilityExpansion1,a1CapabilityExpansion2,a1CapabilityExpansion3,a1CapabilityExpansion4]:packs;
 const concepts=[],sentences=[],ids=new Set();
 for(const p of sources){if(p.schemaVersion!==1)throw Error('Unsupported content pack version');for(const c of p.concepts){if(ids.has(c.id))throw Error('Duplicate concept');ids.add(c.id);concepts.push(c)}sentences.push(...p.sentences)}
 if(includesMainCourse)sentences.push(...fairPracticeRows(sentences));
 for(let i=0;i<sentences.length;i++)if(/^A1\.(?:[7-9]|1\d|2[01])$/.test(sentences[i].concept))sentences[i]=completeA1Vocabulary(sentences[i]);
 const knownWords=new Map(sentences.flatMap(item=>(item.vocabulary||[])
  .filter(word=>tokens(word.nl).length===1&&word.en)
  .map(word=>[tokens(word.nl)[0],word])));
 const usedText=new Set(sentences.map(item=>normalize(item.nl)));
 if(includesMainCourse)for(const row of a1ProofCapacity.sentences){
  const text=normalize(row.nl);
  if(usedText.has(text))continue;
  const model=sentences.find(item=>item.concept===row.concept&&item.verb===row.verb&&item.forms?.length)
   ||sentences.find(item=>item.verb===row.verb&&item.forms?.length);
  if(!model)throw Error(`${row.id}: no finite-verb metadata for ${row.verb}`);
  const vocabulary=[...new Set(tokens(row.nl))].map(word=>knownWords.get(word)).filter(Boolean);
  sentences.push({...row,forms:row.forms||model.forms,vocabulary});
  usedText.add(text);
 }
 for(let i=0;i<sentences.length;i++)if(sentences[i].id.includes('-capacity-'))sentences[i]=completeA1Vocabulary(sentences[i]);
 const seen=new Set();for(const s of sentences){if(seen.has(s.id)||!ids.has(s.concept)||!s.nl||!s.en)throw Error('Invalid sentence record');seen.add(s.id)}
 for(const c of concepts)for(const prerequisite of c.prerequisites)if(!ids.has(prerequisite))throw Error('Missing prerequisite');
 const visiting=new Set(),done=new Set();const visit=id=>{if(visiting.has(id))throw Error('Cyclic prerequisites');if(done.has(id))return;visiting.add(id);for(const p of concepts.find(c=>c.id===id).prerequisites)visit(p);visiting.delete(id);done.add(id)};for(const c of concepts)visit(c.id);
 return {concepts,sentences,byId:Object.fromEntries(sentences.map(x=>[x.id,x])),conceptById:Object.fromEntries(concepts.map(x=>[x.id,x]))};
}
