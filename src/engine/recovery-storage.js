// Lossless local representation only. Exports/cloud state remain ordinary V5
// JSON. Keep accepting existing raw browser state and exported backups.
export const STORAGE_KEY='dutch_sentence_trainer_v5';
// Build-time rollback: retain the decoder/readers if compact writes are disabled.
export const COMPACT_LOCAL_WRITES=true;
const PREFIX='zin-recovery-dictionary-v1\n';
export const isCompactState=raw=>typeof raw==='string'&&raw.startsWith(PREFIX);

export function decodeRecovery(raw){
 if(!isCompactState(raw))return raw;
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
 if(!COMPACT_LOCAL_WRITES||raw.length<16384)return raw;
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

export function readLocalState(storage,key=STORAGE_KEY){
 const raw=storage?.getItem(key);
 return raw?JSON.parse(decodeRecovery(raw)):null;
}

export function writeLocalState(storage,state,key=STORAGE_KEY){
 storage.setItem(key,encodeRecovery(JSON.stringify(state)));
}
