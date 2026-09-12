const clean=value=>String(value??'').trim();

export function normalizeGeneratedVisual(value={}){
 const cardId=clean(value.cardId||value.card_id||value.id),generationId=clean(value.generationId||value.generation_id),imageUrl=clean(value.imageUrl||value.image_url),alt=clean(value.alt),model=clean(value.model),status=clean(value.status).toLowerCase();
 if(!cardId)throw new Error('Generated visual response is missing a card id.');
 let parsed;
 try{parsed=new URL(imageUrl);}catch{throw new Error('Generated visual response has an invalid image URL.');}
 if(parsed.protocol!=='https:')throw new Error('Generated visual response image URL must use HTTPS.');
 if(status==='awaiting_review'&&!generationId)throw new Error('Generated visual awaiting review is missing a generation id.');
 return {cardId,generationId:generationId||null,imageUrl:parsed.toString(),alt:alt||'Visual memory cue',model:model||null,status:status||null};
}

export function validateGeneratedVisual(value={},expectedCardId){
 const visual=normalizeGeneratedVisual(value);
 if(expectedCardId!==undefined&&expectedCardId!==null&&visual.cardId!==String(expectedCardId))throw new Error('Generated visual response returned an unexpected card id.');
 return visual;
}
