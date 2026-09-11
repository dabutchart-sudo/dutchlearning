const clean=value=>String(value??'').trim().toLocaleLowerCase('nl-NL');
const normaliseType=value=>clean(value).replace(/[\s_-]+/g,' ');

const BLOCKED_TYPES=new Set([
 'article','conjunction','determiner','pronoun','preposition','interjection','particle',
 'auxiliary','auxiliary verb','modal','modal verb','number','numeral'
]);

export function visualSuitabilityForRecord(record={}){
 const override=record.visual_suitability??record.visualSuitability;
 if(override===true||clean(override)==='suitable')return {status:'suitable',reason:'explicit-suitable',requiresSemanticCheck:false};
 if(override===false||clean(override)==='unsuitable')return {status:'blocked',reason:'explicit-unsuitable',requiresSemanticCheck:false};
 const type=normaliseType(record.partofword??record.part_of_word??record.word_type??record.type_of_word);
 if(BLOCKED_TYPES.has(type))return {status:'blocked',reason:'function-word',requiresSemanticCheck:false};
 return {status:'review',reason:type?'semantic-review':'unknown-word-type',requiresSemanticCheck:true};
}

export function canRequestVisualSemanticCheck(record={}){
 return visualSuitabilityForRecord(record).status!=='blocked';
}
