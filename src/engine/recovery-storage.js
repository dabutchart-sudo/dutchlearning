// Only the local recovery copy uses this lossless envelope. Main state, exports
// and cloud state remain ordinary V5 JSON. Keep accepting older JSON backups.
const PREFIX='zin-recovery-dictionary-v1\n';

export function decodeRecovery(raw){
 if(!raw?.startsWith(PREFIX))return raw;
 const envelope=JSON.parse(raw.slice(PREFIX.length));
 if(!Array.isArray(envelope)||envelope.length!==2||!Array.isArray(envelope[0])||!envelope[0].every(s=>typeof s==='string'))throw Error('Invalid recovery dictionary.');
 const [strings,packed]=envelope;
 const lookup=ref=>{
  if(typeof ref!=='string'||!/^(0|[1-9a-z][0-9a-z]*)$/.test(ref))throw Error('Invalid recovery reference.');
  const index=parseInt(ref,36);
  if(!Number.isSafeInteger(index)||index>=strings.length||index.toString(36)!==ref)throw Error('Missing recovery reference.');
  return strings[index];
 };
 const unpack=value=>{
  if(typeof value==='string')return lookup(value);
  if(Array.isArray(value))return value.map(unpack);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>{
   if(!key.startsWith('$'))throw Error('Invalid recovery key.');
   return [lookup(key.slice(1)),unpack(item)];
  }));
  return value;
 };
 return JSON.stringify(unpack(packed));
}

export function encodeRecovery(raw){
 // Small checkpoints do not need a dictionary or a new representation.
 if(raw.length<16384)return raw;
 const strings=[],indices=new Map();
 const intern=value=>{
  if(!indices.has(value)){indices.set(value,strings.length.toString(36));strings.push(value);}
  return indices.get(value);
 };
 const pack=value=>{
  if(typeof value==='string')return intern(value);
  if(Array.isArray(value))return value.map(pack);
  // Prefix keys so JavaScript cannot reorder integer-looking dictionary refs.
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>['$'+intern(key),pack(item)]));
  return value;
 };
 const original=JSON.parse(raw),packed=pack(original);
 const encoded=PREFIX+JSON.stringify([strings,packed]);
 if(encoded.length>=raw.length)return raw;
 // Verify the full round trip before replacing any existing recovery copy.
 if(decodeRecovery(encoded)!==JSON.stringify(original))throw Error('Recovery checkpoint could not be verified.');
 return encoded;
}
