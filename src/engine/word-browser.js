export const WORD_BROWSER_LIMIT=100;

const norm=value=>String(value??'').trim().toLocaleLowerCase('nl-NL');
const text=card=>[card?.dutch,card?.english,card?.partofword,card?.dutch_sentence,card?.english_sentence].map(norm).join(' ');

export function searchableCards(cards=[],query='',options={}){
  const limit=Math.max(1,Number(options.limit)||WORD_BROWSER_LIMIT);
  const q=norm(query),filter=options.filter||'all',sort=options.sort||'dutch',today=options.today||new Date().toLocaleDateString('en-CA');
  let list=cards.filter(Boolean);
  if(filter==='frozen')list=list.filter(card=>card.suspended);
  else{
    list=list.filter(card=>!card.suspended);
    if(filter==='new')list=list.filter(card=>card.type==='new');
    if(filter==='due')list=list.filter(card=>card.type!=='new'&&card.due_date&&String(card.due_date).slice(0,10)<=today);
  }
  if(q)list=list.filter(card=>text(card).includes(q));
  const compareText=key=>(a,b)=>String(a[key]??'').localeCompare(String(b[key]??''),'nl',{sensitivity:'base'});
  if(sort==='english')list.sort(compareText('english'));
  else if(sort==='recent')list.sort((a,b)=>String(b.last_reviewed||'').localeCompare(String(a.last_reviewed||''))||compareText('dutch')(a,b));
  else list.sort(compareText('dutch'));
  return list.slice(0,limit);
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
