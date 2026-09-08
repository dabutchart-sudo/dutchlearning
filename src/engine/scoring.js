import {normalize,tokens,distance} from './util.js';
export const labels={capitalization:'Capitalisation',spelling:'Spelling',word_order:'Word order',verb_form:'Verb form',article:'Article',subject:'Subject',vocabulary:'Vocabulary',missing_word:'Missing word',extra_word:'Extra word',translation:'Meaning',negation:'Negation',assistance:'Word recall'};
export const tips={spelling:'The sentence pattern is right. Compare the letters with the model; this word will return in practice.',word_order:'Keep the finite verb in the correct position. In a statement it is second; after a starting time phrase it comes before the subject.',verb_form:'Match the finite verb to the subject. Ik uses the stem; hij/zij usually add -t; plural subjects use the full verb. Watch irregular zijn and hebben.',article:'Learn de or het with the noun. Een means a/an. Articles are grammar evidence, separate from spelling.',subject:'Check who is doing the action and whether the subject is singular or plural.',vocabulary:'Compare the meaning of each word with the model. An unknown alternative needs review; it is not treated as proof of grammar.',missing_word:'A required part is missing. Check the subject, verb, article and object.',extra_word:'Check for an extra word. Use each required part once.',translation:'Read the subject, action and any object or time phrase separately before choosing the whole meaning.',negation:'Geen negates an indefinite noun or a noun without an article. Niet is used for other negation.',assistance:'Word help supports grammar practice. Recall will get another turn; this is not independent production.'};
const structural=new Set('ik jij hij zij wij jullie u de het een geen niet mijn jouw zijn haar ons onze jullie ben bent is heb hebt heeft wil wilt willen kan kunt kunnen moet moeten'.split(' '));
function alignAliases(got,expected){return got.map((w,i)=>{const e=expected[i];if(w==='we'&&e==='wij'||w==='ze'&&e==='zij'||w==='je'&&['jij','jouw'].includes(e))return e;return w})}
export function assess(q,raw,{assisted=false,knownWords=new Set()}={}){
 if(q.phase!=='practice'&&q.phase!=='maintenance'&&assisted)throw Error('Proof cannot use assistance');
 const typed=['typed','gap','correction'].includes(q.kind);
 const lexicalErrors=[];
 const capitalization=typed&&q.kind!=='gap'?/^[^\p{L}]*\p{Lu}/u.test(String(raw)):null;
 const result=(grammar,spelling,errorType=null)=>({grammar,capitalization,lexicalErrors,spelling:typed?spelling:null,vocabulary:grammar===true&&spelling!==false&&!assisted,independent:q.kind==='typed'&&q.direction==='en-nl'&&!assisted&&grammar===true,errorType:assisted&&!errorType?'assistance':errorType,tip:errorType==='verb_form'&&q.concept==='A1.6'?'Use the correct form of hebben, then a past participle at the end. Regular participles often end in -d or -t; learn irregular forms with their verb.':errorType==='verb_form'&&q.concept==='F6'?'Conjugate the modal to match the subject; leave the action verb as an infinitive at the end.':tips[assisted&&!errorType?'assistance':errorType]||null,assisted});
 if(q.direction==='nl-en'||['choice','form','correct-sentence'].includes(q.kind))return result(normalize(raw)===normalize(q.answer),null,normalize(raw)===normalize(q.answer)?null:'translation');
 let expected=tokens(q.answer),got=alignAliases(tokens(raw),expected);
 if([q.answer,...(q.alternatives||[])].some(x=>normalize(got.join(' '))===normalize(x)))return result(true,true);
 if(got.length<expected.length)return result(false,false,'missing_word');
 if(got.length>expected.length)return result(false,false,'extra_word');
 if([...got].sort().join(' ')===[...expected].sort().join(' '))return result(false,true,'word_order');
 let spelling=false,grammarError=null,uncertain=false;
 for(let i=0;i<expected.length;i++){
  const a=expected[i],b=got[i];if(a===b)continue;
  const verbSlot=q.kind==='gap'?i===0:(q.verbSlots||[q.verbIndex]).includes(i);
  if(verbSlot&&(q.forms.includes(b)||knownWords.has(b)&&(a.endsWith('en')&&!b.endsWith('en')||a.startsWith('ge')&&!b.startsWith('ge'))||b===a+'t'||a===b+'t'||/[dt]$/.test(a)&&a.slice(0,-1)===b.slice(0,-1))){grammarError??='verb_form';continue;}
  if(['de','het','een'].includes(a)||['de','het','een'].includes(b)){grammarError??='article';continue;}
  if(['geen','niet'].includes(a)||['geen','niet'].includes(b)){grammarError??='negation';continue;}
  if(structural.has(a)||structural.has(b)){grammarError??=verbSlot?'verb_form':'subject';continue;}
  // A one-letter unknown typo can demonstrate structure, but NEVER a known word or changed verb ending.
  if(a.length>=4&&distance(a,b)===1&&!knownWords.has(b)&&(!verbSlot||a.slice(-1)===b.slice(-1)&&(!a.endsWith('en')||b.endsWith('en'))&&(!a.startsWith('ge')||b.startsWith('ge')))){spelling=true;lexicalErrors.push(i);continue;}
  uncertain=true;spelling=true;lexicalErrors.push(i);
 }
 return result(grammarError?false:uncertain?null:true,!spelling,grammarError||(uncertain?'vocabulary':spelling?'spelling':null));
}
