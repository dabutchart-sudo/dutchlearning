import a1CoreExpansion from './a1-core-expansion.js';
import a1CoreExpansion2 from './a1-core-expansion-2.js';
import a1CoreExpansion3 from './a1-core-expansion-3.js';
import a1CoreExpansion4 from './a1-core-expansion-4.js';
import a1CoreExpansion4ProofBuffer from './a1-core-expansion-4-proof-buffer.js';
import a1CoreExpansion5 from './a1-core-expansion-5.js';
import a1CoreExpansion5ProofBuffer from './a1-core-expansion-5-proof-buffer.js';
export function registerPacks(packs){
 const includesMainCourse=packs.some(p=>p?.id==='foundation-a1');
 const sources=includesMainCourse?[...packs,a1CoreExpansion,a1CoreExpansion2,a1CoreExpansion3,a1CoreExpansion4,a1CoreExpansion4ProofBuffer,a1CoreExpansion5,a1CoreExpansion5ProofBuffer]:packs;
 const concepts=[],sentences=[],ids=new Set();
 for(const p of sources){if(p.schemaVersion!==1)throw Error('Unsupported content pack version');for(const c of p.concepts){if(ids.has(c.id))throw Error('Duplicate concept');ids.add(c.id);concepts.push(c)}sentences.push(...p.sentences)}
 const seen=new Set();for(const s of sentences){if(seen.has(s.id)||!ids.has(s.concept)||!s.nl||!s.en)throw Error('Invalid sentence record');seen.add(s.id)}
 for(const c of concepts)for(const prerequisite of c.prerequisites)if(!ids.has(prerequisite))throw Error('Missing prerequisite');
 const visiting=new Set(),done=new Set();const visit=id=>{if(visiting.has(id))throw Error('Cyclic prerequisites');if(done.has(id))return;visiting.add(id);for(const p of concepts.find(c=>c.id===id).prerequisites)visit(p);visiting.delete(id);done.add(id)};for(const c of concepts)visit(c.id);
 return {concepts,sentences,byId:Object.fromEntries(sentences.map(x=>[x.id,x])),conceptById:Object.fromEntries(concepts.map(x=>[x.id,x]))};
}
