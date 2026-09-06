export function registerPacks(packs){
 const concepts=[],sentences=[],ids=new Set();
 for(const p of packs){if(p.schemaVersion!==1)throw Error('Unsupported content pack version');for(const c of p.concepts){if(ids.has(c.id))throw Error('Duplicate concept');ids.add(c.id);concepts.push(c)}sentences.push(...p.sentences)}
 const seen=new Set();for(const s of sentences){if(seen.has(s.id)||!ids.has(s.concept)||!s.nl||!s.en)throw Error('Invalid sentence record');seen.add(s.id)}
 for(const c of concepts)for(const prerequisite of c.prerequisites)if(!ids.has(prerequisite))throw Error('Missing prerequisite');
 const visiting=new Set(),done=new Set();const visit=id=>{if(visiting.has(id))throw Error('Cyclic prerequisites');if(done.has(id))return;visiting.add(id);for(const p of concepts.find(c=>c.id===id).prerequisites)visit(p);visiting.delete(id);done.add(id)};for(const c of concepts)visit(c.id);
 return {concepts,sentences,byId:Object.fromEntries(sentences.map(x=>[x.id,x])),conceptById:Object.fromEntries(concepts.map(x=>[x.id,x]))};
}
