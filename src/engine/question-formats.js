export const CAPABILITIES=Object.freeze(['recognise','recall','construct','produce','listen','speak','interact','retain']);
export const SUPPORT_LEVELS=Object.freeze(['independent','supported','revealed']);
export const RELEASE_LEVELS=Object.freeze(['experimental','practice','trial','core']);

const attemptEvidence=Object.freeze(['kind','direction','phase','assisted','grammar','spelling','capitalization','lexicalErrors','vocabulary','errorType']);

function contract(capability,response,{support=['independent'],fallback='none',roles=['guided-practice'],notes=''}={}){
 return Object.freeze({capability,response,support:Object.freeze(support),releaseLevel:'core',roles:Object.freeze(roles),fallback,attemptEvidence,notes});
}

// Describes current production behaviour. It does not change scheduling, scoring,
// persistence, or which formats are available to the learner.
export const QUESTION_FORMATS=Object.freeze({
 choice:contract('recognise','select-meaning',{notes:'Dutch sentence to English meaning selection.'}),
 'correct-sentence':contract('recognise','select-sentence',{notes:'Choose the correct Dutch sentence from controlled alternatives.'}),
 wordbank:contract('construct','arrange-tiles',{support:['independent','revealed'],notes:'Visible Dutch tiles constrain sentence construction; answer reveal is recorded as assisted.'}),
 gap:contract('construct','type-gap',{support:['independent','revealed'],notes:'Accepts the missing form or a complete sentence; neither currently earns independent production evidence.'}),
 form:contract('construct','select-form',{notes:'Choose the missing Dutch form from controlled alternatives.'}),
 correction:contract('recall','type-suffix',{support:['independent','revealed'],notes:'Complete the hidden suffix of a Dutch form.'}),
 typed:contract('produce','type-sentence',{support:['independent','revealed'],roles:['guided-practice','independent-practice','proof'],notes:'Only correct, unassisted English-to-Dutch practice earns current independent evidence.'}),
 listening:contract('listen','select-meaning',{fallback:'convert-to-choice',notes:'Hidden Dutch audio to English meaning selection. Current learner-state progression also increments recognised.'}),
 speaking:contract('speak','record-sentence',{fallback:'convert-to-typed',notes:'English prompt to Dutch speech transcript. Current learner-state progression also increments recognised; transcript matching is not pronunciation assessment.'})
});

export const formatKinds=Object.freeze(Object.keys(QUESTION_FORMATS));

export function questionFormat(kind){return QUESTION_FORMATS[kind]||null;}

export function validateQuestionFormats(formats=QUESTION_FORMATS){
 const errors=[];
 for(const [kind,format] of Object.entries(formats)){
  if(!CAPABILITIES.includes(format.capability))errors.push(`${kind}: invalid capability`);
  if(!RELEASE_LEVELS.includes(format.releaseLevel))errors.push(`${kind}: invalid release level`);
  if(!format.response)errors.push(`${kind}: response is required`);
  if(!Array.isArray(format.roles)||!format.roles.length)errors.push(`${kind}: at least one role is required`);
  if(!Array.isArray(format.support)||!format.support.length||format.support.some(level=>!SUPPORT_LEVELS.includes(level)))errors.push(`${kind}: invalid support levels`);
  if(!format.fallback)errors.push(`${kind}: fallback is required`);
  if(!Array.isArray(format.attemptEvidence)||!format.attemptEvidence.length)errors.push(`${kind}: attempt evidence is required`);
 }
 return errors;
}
