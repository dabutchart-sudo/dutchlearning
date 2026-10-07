import {CONTROLLED_DIALOGUES} from '../content/controlled-dialogues.js';
import {formatAvailable} from './format-release.js';
import {normalize} from './util.js';

export const CONTROLLED_DIALOGUE_RELEASE=Object.freeze({dialogue:Object.freeze({releaseLevel:'practice',enabled:true})});

function learnedConcepts(state){
 return new Set(Object.entries(state.progress||{}).filter(([,progress])=>progress&&(progress.taught||progress.lessonAcknowledged||progress.practiceAttempts>0||progress.masteredAt)).map(([id])=>id));
}

export function controlledDialoguePool(state,conceptId,dialogues=CONTROLLED_DIALOGUES){
 if(!conceptId||!learnedConcepts(state).has(conceptId))return [];
 return dialogues.filter(dialogue=>dialogue.concept===conceptId&&dialogue.turns.length>=1&&dialogue.turns.length<=2);
}

export function controlledDialogueOffer(state,conceptId,release=CONTROLLED_DIALOGUE_RELEASE,dialogues=CONTROLLED_DIALOGUES){
 if(!formatAvailable('dialogue','practice',release))return null;
 const pool=controlledDialoguePool(state,conceptId,dialogues);
 if(!pool.length)return null;
 return Object.freeze({conceptId,count:pool.length});
}

export function startControlledDialogue(state,{conceptId,dialogueId,release=CONTROLLED_DIALOGUE_RELEASE,dialogues=CONTROLLED_DIALOGUES}={}){
 if(!formatAvailable('dialogue','practice',release))throw Error('Optional dialogue practice is currently unavailable.');
 if(!conceptId||!learnedConcepts(state).has(conceptId))throw Error('Complete the first teaching step before starting dialogue practice.');
 const pool=controlledDialoguePool(state,conceptId,dialogues);
 const dialogue=dialogueId?pool.find(item=>item.id===dialogueId):pool[0];
 if(!dialogue)throw Error('This topic has no controlled dialogue yet.');
 return Object.freeze({releaseLevel:'practice',capability:'interact',format:'dialogue',conceptId,dialogue,turnIndex:0,responses:Object.freeze([]),repair:null});
}

export function currentDialogueTurn(session){return session?.dialogue?.turns?.[session.turnIndex]||null;}

export function answerControlledDialogue(session,raw,{usedClarify=false,usedPhraseSupport=false}={}){
 const turn=currentDialogueTurn(session);
 if(!turn)throw Error('Dialogue practice is already complete.');
 const answer=String(raw??'').trim();
 if(!answer)throw Error('Type a Dutch reply first.');
 const accepted=turn.accepted.find(option=>normalize(option.nl)===normalize(answer));
 const support=usedClarify||usedPhraseSupport||session.repair?.usedClarify||session.repair?.usedPhraseSupport?'supported':'independent';
 if(!accepted&&!session.repair){
  return Object.freeze({...session,repair:Object.freeze({answer,usedClarify:Boolean(usedClarify),usedPhraseSupport:Boolean(usedPhraseSupport)})});
 }
 const first=session.repair;
 const result=Object.freeze({
  turnIndex:session.turnIndex,answer,correct:Boolean(accepted),accepted:accepted?.nl||null,
  capability:'interact',support,releaseLevel:'practice',interactionEvidence:Boolean(accepted),
  repaired:Boolean(first&&accepted),firstAnswer:first?.answer||null,countsTowardProgress:false
 });
 return Object.freeze({...session,turnIndex:session.turnIndex+1,responses:Object.freeze([...session.responses,result]),repair:null});
}

export function controlledDialogueSummary(session){
 const responses=session?.responses||[];
 return Object.freeze({
  total:responses.length,appropriate:responses.filter(response=>response.correct).length,
  independent:responses.filter(response=>response.correct&&response.support==='independent').length,
  supported:responses.filter(response=>response.correct&&response.support==='supported').length,
  repaired:responses.filter(response=>response.repaired).length,countsTowardProgress:false
 });
}
