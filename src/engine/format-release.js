import {QUESTION_FORMATS,RELEASE_LEVELS} from './question-formats.js';

export const FORMAT_CONTEXTS=Object.freeze(['experimental','practice','trial','core']);

const rank=level=>RELEASE_LEVELS.indexOf(level);

function assertKind(kind){
 if(!QUESTION_FORMATS[kind])throw Error(`Unknown question format: ${kind}`);
}

function assertLevel(level){
 if(!RELEASE_LEVELS.includes(level))throw Error(`Unknown format release level: ${level}`);
}

export function formatRelease(kind,overrides={}){
 assertKind(kind);
 const configured=overrides[kind]||{};
 const releaseLevel=configured.releaseLevel??QUESTION_FORMATS[kind].releaseLevel;
 assertLevel(releaseLevel);
 if(configured.enabled!==undefined&&typeof configured.enabled!=='boolean')throw Error(`${kind}: enabled must be true or false`);
 return Object.freeze({kind,releaseLevel,enabled:configured.enabled??true});
}

// Release levels are cumulative: a Trial format remains available in isolated
// Experimental and optional Practice routes, but cannot enter Core scheduling.
export function formatAvailable(kind,context,overrides={}){
 if(!FORMAT_CONTEXTS.includes(context))throw Error(`Unknown format context: ${context}`);
 const control=formatRelease(kind,overrides);
 return control.enabled&&rank(context)<=rank(control.releaseLevel);
}

export function transitionFormatRelease(current,nextLevel,{ownerAccepted=false}={}){
 if(!current?.kind)throw Error('A current format release is required.');
 assertKind(current.kind);assertLevel(current.releaseLevel);assertLevel(nextLevel);
 const change=rank(nextLevel)-rank(current.releaseLevel);
 if(change>1)throw Error('Formats must be promoted one release level at a time.');
 if(change===1&&!ownerAccepted)throw Error('Format promotion requires owner acceptance.');
 return Object.freeze({...current,releaseLevel:nextLevel});
}

export function setFormatEnabled(current,enabled){
 if(!current?.kind)throw Error('A current format release is required.');
 assertKind(current.kind);
 if(typeof enabled!=='boolean')throw Error('Format enabled must be true or false.');
 return Object.freeze({...current,enabled});
}
