import {mergeSentenceBank,sentenceBankNeedsRefresh} from '../engine/sentence-bank.js';

const AUTH_STORAGE_KEY='dutch_sentence_auth';
const CACHE_PREFIX='dutch_sentence_bank_v1:';
let clientPromise=null;

async function config(){
 const c=await import('https://dabutchart-sudo.github.io/flashcards/constants.js');
 if(!c.SUPABASE_URL||!c.SUPABASE_ANON_KEY)throw new Error('Sentence generation configuration is unavailable.');
 return c;
}

async function generationClient(){
 if(clientPromise)return clientPromise;
 clientPromise=(async()=>{
  const [{createClient},c]=await Promise.all([
   import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'),
   config()
  ]);
  return {client:createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,{auth:{storageKey:AUTH_STORAGE_KEY,flowType:'pkce'}}),url:c.SUPABASE_URL};
 })();
 return clientPromise;
}

function cacheKey(url){return `${CACHE_PREFIX}${url}`;}
function readCache(url){
 try{const parsed=JSON.parse(localStorage.getItem(cacheKey(url))||'{}');return parsed&&typeof parsed==='object'?parsed:{};}catch{return{};}
}
function writeCache(url,cache){localStorage.setItem(cacheKey(url),JSON.stringify(cache));}
function validPair(pair){return pair&&typeof pair.nl==='string'&&pair.nl.trim()&&typeof pair.en==='string'&&pair.en.trim();}

export async function sentenceGenerationUser(){
 const {client}=await generationClient(),{data,error}=await client.auth.getSession();
 if(error)throw error;return data.session?.user||null;
}

export async function signInForSentenceGeneration(){
 const {client}=await generationClient();
 sessionStorage.setItem('sentence_signin_return','1');
 const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});
 if(error)throw error;
}

export async function signOutSentenceGeneration(){const {client}=await generationClient(),{error}=await client.auth.signOut({scope:'local'});if(error)throw error;}

export async function cachedSentenceBank(card){
 const {url}=await generationClient(),cache=readCache(url),stored=Array.isArray(cache[String(card.id)]?.sentences)?cache[String(card.id)].sentences:[];
 return mergeSentenceBank(card,stored,[]);
}

export async function inspectSentenceBanks(cards=[]){
 const {url}=await generationClient(),cache=readCache(url);
 const records=cards.map(card=>{const stored=Array.isArray(cache[String(card.id)]?.sentences)?cache[String(card.id)].sentences:[],sentences=mergeSentenceBank(card,stored,[]);return {cardId:String(card.id),sentences,count:sentences.length,needsRefresh:sentenceBankNeedsRefresh(sentences)};});
 return {records,ready:records.filter(r=>!r.needsRefresh).length,needsRefresh:records.filter(r=>r.needsRefresh).length,total:records.length};
}

export async function generateSentenceBanks(cards,{force=false}={}){
 const {client,url}=await generationClient();
 const {data:sessionData,error:sessionError}=await client.auth.getSession();
 if(sessionError)throw sessionError;if(!sessionData.session)throw new Error('Sign in with Google before generating sentence examples.');
 const cache=readCache(url),wanted=[];
 for(const card of cards){const stored=Array.isArray(cache[String(card.id)]?.sentences)?cache[String(card.id)].sentences:[],bank=mergeSentenceBank(card,stored,[]);if(force||sentenceBankNeedsRefresh(bank))wanted.push(Number(card.id));}
 const ids=wanted.slice(0,5);if(!ids.length)return {generated:0,requested:0,cards:[],readyAfter:0};
 const {data,error}=await client.functions.invoke('generate-sentences',{body:{ids}});
 if(error){let message='Sentence generation failed.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
 if(!data||!Array.isArray(data.cards))throw new Error('Sentence generator returned an invalid response.');
 if(data.cards.length!==ids.length)throw new Error(`Sentence generator returned ${data.cards.length} of ${ids.length} requested cards.`);
 const returnedIds=data.cards.map(r=>Number(r.id));
 if(new Set(returnedIds).size!==ids.length||returnedIds.some(id=>!ids.includes(id)))throw new Error('Sentence generator returned unexpected card IDs.');
 const byId=new Map(cards.map(c=>[Number(c.id),c])),updated=[];
 for(const result of data.cards){
  const id=Number(result.id),card=byId.get(id);
  if(!card)throw new Error(`Generated card ${id} was not found locally.`);
  if(!Array.isArray(result.sentences)||result.sentences.length!==5||result.sentences.some(p=>!validPair(p)))throw new Error(`Sentence generator returned invalid examples for card ${id}.`);
  const sentences=mergeSentenceBank(card,cache[String(id)]?.sentences||[],result.sentences);
  if(sentenceBankNeedsRefresh(sentences))throw new Error(`Generated examples for card ${id} did not create a complete sentence bank.`);
  cache[String(id)]={sentences,updatedAt:new Date().toISOString()};updated.push({id,sentences});
 }
 writeCache(url,cache);
 const verified=readCache(url),readyAfter=ids.filter(id=>Array.isArray(verified[String(id)]?.sentences)&&!sentenceBankNeedsRefresh(mergeSentenceBank(byId.get(id),verified[String(id)].sentences,[]))).length;
 if(readyAfter!==ids.length)throw new Error(`Sentence banks were generated but only ${readyAfter} of ${ids.length} were saved successfully.`);
 return {generated:updated.length,requested:ids.length,cards:updated,readyAfter};
}
