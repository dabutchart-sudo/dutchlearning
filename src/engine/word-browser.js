export const WORD_BROWSER_LIMIT=60;

const norm=value=>String(value??'').trim().toLocaleLowerCase('nl-NL');
const text=card=>[card?.dutch,card?.english,card?.partofword,card?.dutch_sentence,card?.english_sentence].map(norm).join(' ');

export function searchableCards(cards=[],query='',options={}){
  const limit=Math.max(1,Number(options.limit)||WORD_BROWSER_LIMIT);
  const q=norm(query);
  const active=cards.filter(card=>card&&!card.suspended);
  const matched=q?active.filter(card=>text(card).includes(q)):active;
  return matched
    .slice()
    .sort((a,b)=>String(a.dutch??'').localeCompare(String(b.dutch??''),'nl',{sensitivity:'base'}))
    .slice(0,limit);
}

export function wordBrowserSummary(cards=[]){
  const active=cards.filter(card=>card&&!card.suspended);
  return {
    total:cards.length,
    active:active.length,
    withSentence:active.filter(card=>card.dutch_sentence||card.english_sentence).length,
    withImage:active.filter(card=>card.image_url).length,
  };
}
