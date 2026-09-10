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

export async function generateSentenceBanks(cards,{force=false}={}){
 const {client,url}=await generationClient();
 const {data:sessionData,error:sessionError}=await client.auth.getSession();
 if(sessionError)throw sessionError;if(!sessionData.session)throw new Error('Sign in with Google before generating sentence examples.');
 const cache=readCache(url),wanted=[];
 for(const card of cards){const stored=Array.isArray(cache[String(card.id)]?.sentences)?cache[String(card.id)].sentences:[],bank=mergeSentenceBank(card,stored,[]);if(force||sentenceBankNeedsRefresh(bank))wanted.push(Number(card.id));}
 const ids=wanted.slice(0,5);if(!ids.length)return {generated:0,requested:0,cards:[]};
 const {data,error}=await client.functions.invoke('generate-sentences',{body:{ids}});
 if(error){let message='Sentence generation failed.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
 if(!data||!Array.isArray(data.cards))throw new Error('Sentence generator returned an invalid response.');
 const byId=new Map(cards.map(c=>[Number(c.id),c])),updated=[];
 for(const result of data.cards){const id=Number(result.id),card=byId.get(id);if(!card||!ids.includes(id)||!Array.isArray(result.sentences))continue;const sentences=mergeSentenceBank(card,cache[String(id)]?.sentences||[],result.sentences);cache[String(id)]={sentences,updatedAt:new Date().toISOString()};updated.push({id,sentences});}
 writeCache(url,cache);return {generated:updated.length,requested:ids.length,cards:updated};
}
