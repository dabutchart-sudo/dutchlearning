// Presentation-only teaching material. Examples always come from the practice pool.
const focus={
 'A1.7':['Use geen before an indefinite noun: geen fiets. Use niet for a description: niet groot.','For a place or time phrase, put niet before the phrase: niet in Utrecht.'],
 'A1.8':['Question word first, finite verb second, subject third: waar woon jij?','English “you” can mean jij or jullie. Check the Dutch subject before choosing the verb.'],
 'A1.9':['Choose ben, bent, is or zijn to match the subject.','Movement and change verbs here end with a past participle: wij zijn aangekomen.'],
 'A1.10':['Conjugate the verb part in second position.','Move the separable particle to the end: ik neem water mee.'],
 'A1.11':['The modal is the finite verb; match it to the subject.','Keep the action verb in its full infinitive form at the end.'],
 'A1.12':['A time or place phrase may come first. The finite verb still comes second.','After that verb, put the subject before the rest of the sentence.'],
 'A1.13':['Use the right form of hebben as the finite verb.','Put the past participle at the end, even when other words sit between the two verbs.'],
 'A1.14':['Yes/no questions start with the finite verb.','A question word comes before the finite verb: waar woon jij?'],
 'A1.15':['Use geen for an indefinite noun or amount.','Use niet to negate an action, description or place phrase.','Niets means “nothing”; it replaces the thing rather than negating a following noun.'],
 'A1.16':['Put the conjugated verb part in its normal position.','Put the separable particle near the end: zij belt haar moeder op.'],
 'A1.17':['Learn each noun with de or het.','Plural nouns normally take de; notice the useful -en and -s endings.'],
 'A1.18':['Choose ons for a singular het-word; use onze for de-words and plurals.','A describing adjective before a noun usually ends in -e: mijn nieuwe jas.'],
 'A1.19':['A singular quantity can take a singular verb; a plural quantity takes a plural verb.','Read the number with its unit or price as one useful phrase.'],
 'A1.20':['Use om for a clock time, op for a day or date, and in for a month.','Half negen is 8:30: Dutch half hours point to the coming hour.'],
 'A1.21':['Use naar for movement towards a place; use in, op or bij for location.','Use uit for coming from a place and van for a source or owner.','Keep the finite verb in second position even when a place phrase comes first.'],
 'A1.22':['Give a route in steps: rechtdoor, then links or rechts at a landmark.','For a fixed location, use links van, rechts van, naast or tegenover.'],
 'A1.23':['Ask with mag ik or ik wil graag, and add alstublieft in a shop or café.','Ask the price with wat kost or hoeveel kost. For help or a repetition, use kunt u.'],
 'A1.24':['Join two short ideas with en, maar, of or want. Each idea keeps its own subject and finite verb.','Eerst, daarna and dan can start a sentence. The finite verb still comes second: eerst drink ik koffie.'],
 'A1.25':['Name the person, the action, and one daily detail: home, work, food, transport or free time.','An appointment is een afspraak. Say the time with om: ik heb om drie uur een afspraak.'],
 'S1':['Say the problem in one reusable chunk: ik begrijp het niet, ik ben te laat, or mijn telefoon werkt niet.','Ask for help with ik heb hulp nodig. Add the reason with want.'],
 'S2':['Say your name with ik heet, and ask politely with hoe heet u?','Say where you come from with ik kom uit, and where you live with ik woon in.'],
 'S3':['Say the appointment with ik heb een afspraak, and the time with om.','Say you are coming with ik kom om. A second idea can join with en.']
};
const worked={
 'A1.7':[/\bniet\b/i,/\b(geen|niets)\b/i],
 'A1.8':[/^Waar\b/i,/^Wie\b/i],
 'A1.9':[/\bben\b/i,/\bzijn\b/i],
 'A1.10':[/\bop\.$/i,/\bmee\.$/i],
 'A1.11':[/\b(kan|kunt|kunnen)\b/i,/\b(moet|moeten)\b/i],
 'A1.12':[/^(Vandaag|Morgen)\b/i,/^(In|Bij|Op)\b/i],
 'A1.13':[/\bheb\b/i,/\bheeft\b/i],
 'A1.14':[/^(?!Waar|Wat|Wanneer|Waarom|Hoe|Wie)[^?]+\?$/i,/^(Waar|Wat|Wanneer|Waarom|Hoe|Wie)\b/i],
 'A1.15':[/\bgeen\b/i,/\bniet\b/i],
 'A1.16':[/\bop\.$/i,/\bmee\.$/i],
 'A1.17':[/\b(het|de)\b/i,/\b(bananen|sleutels|appels|boeken|fietsen|glazen)\b/i],
 'A1.18':[/^Ons\b/i,/\b(nieuwe|rode|groene|oude|kleine)\b/i],
 'A1.19':[/\beuro\b/i,/\b(kilo|liter|fles)\b/i],
 'A1.20':[/\bom\b/i,/\bop\b/i],
 'A1.21':[/\bnaar\b/i,/\b(in|op|bij)\b/i],
 'A1.23':[/\bmag ik\b/i,/\bkunt u\b/i],
 'A1.24':[/\bmaar\b/i,/\bwant\b/i],
 'A1.25':[/\bafspraak\b/i,/\bthuis\b/i],
 'S1':[/\bhulp nodig\b/i,/\bte laat\b/i],
 'S2':[/\bheet\b/i,/\bwoon/i],
 'S3':[/\bafspraak\b/i,/\bkom/i]
};

export function lessonMaterial(content,id){
 const concept=content.conceptById[id];
 const practice=content.sentences.filter(item=>item.concept===id&&item.pool==='practice');
 const examples=[];const seen=new Set();
 for(const pattern of worked[id]||[]){
  const item=practice.find(row=>pattern.test(row.nl)&&row.nl!==concept.example&&!seen.has(row.nl));
  if(item){examples.push({nl:item.nl,en:item.en,verb:item.verb});seen.add(item.nl);}
 }
 for(const item of practice){
  if(examples.length>=2)break;
  if(seen.has(item.nl)||item.nl===concept.example)continue;
  if(examples.length&&examples[0].verb===item.verb)continue;
  examples.push({nl:item.nl,en:item.en,verb:item.verb});seen.add(item.nl);
 }
 return {focus:focus[id]||[concept.rule],examples};
}

export function patternTipFor(id,nl,concept){
 const notes=focus[id]||[concept.rule];
 if(id==='A1.15')return /\bniets\b/i.test(nl)?notes[2]:/\bgeen\b/i.test(nl)?notes[0]:notes[1];
 if(id==='A1.20'&&/\bhalf\b/i.test(nl))return notes[1];
 if(id==='A1.21'&&/\b(uit|van)\b/i.test(nl))return notes[1];
 if(id==='A1.23'&&/\b(kost|kosten|euro|helpen|herhalen|keer)\b/i.test(nl))return notes[1];
 if(id==='A1.24'&&/\b(eerst|daarna|dan)\b/i.test(nl))return notes[1];
 if(id==='A1.25'&&/\bafspraak\b/i.test(nl))return notes[1];
 if(id==='S1'&&/\bhulp nodig\b/i.test(nl))return notes[1];
 if(id==='S2'&&/\b(kom|komt|komen|woon|woont|wonen)\b/i.test(nl))return notes[1];
 if(id==='S3'&&/\b(kom|komt|komen)\b/i.test(nl))return notes[1];
 if(id==='A1.14'&&/^(waar|wat|wanneer|waarom|hoe|wie)\b/i.test(nl))return notes[1];
 return notes[0];
}

export function guidanceFor(question,progress,concept,item){
 if(!['practice','maintenance'].includes(question.phase))return null;
 const attempts=progress?.practiceAttempts||0;
 return {prominent:question.phase==='practice'&&attempts<8,
  label:attempts<8?'See a pattern reminder':'Need a pattern reminder?',
  text:patternTipFor(question.concept,item?.nl||'',concept)};
}

export function dailyRecap(state,content,today){
 const attempts=state.attempts.filter(a=>a.date===today&&a.phase!=='extra');
 if((state.daily?.date!==today?0:state.daily.count)<20||attempts.length<20)return null;
 const recent=attempts.slice(-20);
 const independent=recent.filter(a=>a.independent).length;
 const supported=recent.filter(a=>a.assisted).length;
 const revisit=recent.filter(a=>a.grammar!==true||a.spelling===false).slice(-3).map(a=>({
  concept:a.concept,title:content.conceptById[a.concept]?.title||a.concept,
  sentence:a.correctSentence||content.byId[a.sourceId]?.nl||'',
  meaning:a.englishMeaning||content.byId[a.sourceId]?.en||''
 }));
 return {answered:recent.length,independent,supported,revisit};
}
