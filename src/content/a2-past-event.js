import {displayTokens,normalize,tokens} from '../engine/util.js';

// A2.1 reports a finished event. Proof lines are the plain pattern.
// Practice adds even, samen, snel, heel, vers or a place so a practice line is never a proof line.
const kinds=['choice','wordbank','typed','gap','form','correct-sentence','correction','listening'];
const gloss={
 ik:'I',hij:'he',zij:'she',wij:'we',het:'it',
 heb:'have',heeft:'has',hebben:'have',ben:'am',is:'is',zijn:'are',
 was:'was',waren:'were',had:'had',hadden:'had',
 gewerkt:'worked',gekocht:'bought',gemaakt:'made',geschreven:'written',gedronken:'drunk',gekookt:'cooked',gespeeld:'played',gegaan:'gone',
 gisteren:'yesterday',lang:'for a long time',heel:'very',vers:'fresh',even:'for a bit',samen:'together',snel:'quickly',
 brood:'bread',soep:'soup',koffie:'coffee',brief:'letter',foto:'photo',
 een:'a',naar:'to',huis:'home',school:'school',park:'park',
 te:'too',laat:'late',ziek:'ill',thuis:'at home',druk:'busy',koud:'cold',
 afspraak:'appointment',geen:'no',tijd:'time',
 werkte:'worked',werkten:'worked',speelde:'played',speelden:'played',maakte:'made',maakten:'made',
 buiten:'outside',op:'at',kantoor:'office',in:'in',de:'the'
};
const hebben=['heb','hebt','heeft','hebben'];
const zijn=['ben','bent','is','zijn'];
const was=['was','waren'];
const had=['had','hadden'];
const werken=['werkte','werkten'];
const spelen=['speelde','speelden'];
const maken=['maakte','maakten'];
const people=[
 ['Ik','I',{hebben:'heb',zijn:'ben',was:'was',had:'had',werken:'werkte',spelen:'speelde',maken:'maakte'},false],
 ['Hij','He',{hebben:'heeft',zijn:'is',was:'was',had:'had',werken:'werkte',spelen:'speelde',maken:'maakte'},false],
 ['Zij','She',{hebben:'heeft',zijn:'is',was:'was',had:'had',werken:'werkte',spelen:'speelde',maken:'maakte'},false],
 ['Wij','We',{hebben:'hebben',zijn:'zijn',was:'waren',had:'hadden',werken:'werkten',spelen:'speelden',maken:'maakten'},true]
];

function vocabulary(nl){
 return tokens(nl).map(word=>{
  const en=gloss[word];
  if(!en)throw Error(`A2.1 is missing an English meaning for ${word}`);
  return {id:`a21:${word}`,nl:word,en,mature:false};
 });
}
function locate(nl,forms){
 const parts=displayTokens(nl),finite=forms.map(normalize);
 const verbIndex=parts.findIndex(part=>finite.includes(normalize(part)));
 if(verbIndex<0)throw Error(`A2.1 has no finite verb in ${nl}`);
 const participle=parts.findIndex(part=>/^ge/.test(normalize(part)));
 return {verbIndex,verbSlots:participle>=0?[verbIndex,participle]:[verbIndex]};
}
function row(pool,i,[nl,en,verb,forms]){
 const place=locate(nl,forms);
 return {id:`A2.1-${pool==='practice'?'p':'t'}-${String(i+1).padStart(3,'0')}`,concept:'A2.1',pool,nl,en,verb,forms,...place,subject:displayTokens(nl)[0],family:`A2.1:${verb}`,vocabulary:vocabulary(nl),difficulty:pool==='practice'?1:2,suitableKinds:kinds,expectedStructure:'a finished event in the perfect or the simple past'};
}
function expand(kind,tail,english){
 return people.map(([nl,en,form,plural])=>{
  const finite=form[kind];
  const be=plural?'were':'was';
  const sentence={
   hebben:`${nl} ${finite} gisteren ${tail}.`,
   zijn:`${nl} ${finite} gisteren ${tail}.`,
   was:`${nl} ${finite} gisteren ${tail}.`,
   had:`${nl} ${finite} gisteren ${tail}.`,
   werken:`${nl} ${finite} gisteren ${tail}.`,
   spelen:`${nl} ${finite} gisteren ${tail}.`,
   maken:`${nl} ${finite} gisteren ${tail}.`
  }[kind];
  const meaning=kind==='was'?`${en} ${be} ${english} yesterday.`:`${en} ${english} yesterday.`;
  const forms={hebben,zijn,was,had,werken,spelen,maken}[kind];
  const verb={hebben:'hebben',zijn:'zijn',was:'zijn',had:'hebben',werken:'werken',spelen:'spelen',maken:'maken'}[kind];
  return [sentence,meaning,verb,forms];
 });
}

const proof=[
 ...expand('hebben','lang gewerkt','worked for a long time'),
 ...expand('hebben','brood gekocht','bought bread'),
 ...expand('hebben','soep gemaakt','made soup'),
 ...expand('hebben','een brief geschreven','wrote a letter'),
 ...expand('hebben','koffie gedronken','drank coffee'),
 ...expand('hebben','soep gekookt','cooked soup'),
 ...expand('hebben','buiten gespeeld','played outside'),
 ...expand('hebben','een foto gemaakt','took a photo'),
 ...expand('zijn','naar huis gegaan','went home'),
 ...expand('zijn','naar school gegaan','went to school'),
 ...expand('zijn','naar het park gegaan','went to the park'),
 ...expand('was','te laat','late'),
 ...expand('was','ziek','ill'),
 ...expand('was','thuis','at home'),
 ...expand('was','druk','busy'),
 ...expand('was','op kantoor','at the office'),
 ...expand('had','een afspraak','had an appointment'),
 ...expand('had','geen tijd','had no time'),
 ...expand('werken','thuis','worked at home'),
 ...expand('werken','op kantoor','worked at the office'),
 ...expand('spelen','buiten','played outside'),
 ...expand('spelen','in het park','played in the park'),
 ...expand('maken','een foto','took a photo')
];
const practice=[
 ['Ik heb gisteren heel lang gewerkt.','I worked for a very long time yesterday.','hebben',hebben],
 ['Hij heeft gisteren heel lang gewerkt.','He worked for a very long time yesterday.','hebben',hebben],
 ['Hij heeft gisteren vers brood gekocht.','He bought fresh bread yesterday.','hebben',hebben],
 ['Zij heeft gisteren thuis soep gemaakt.','She made soup at home yesterday.','hebben',hebben],
 ['Wij hebben gisteren samen een brief geschreven.','We wrote a letter together yesterday.','hebben',hebben],
 ['Ik heb gisteren even koffie gedronken.','I drank coffee for a bit yesterday.','hebben',hebben],
 ['Zij heeft gisteren snel soep gekookt.','She cooked soup quickly yesterday.','hebben',hebben],
 ['Ik heb gisteren even buiten gespeeld.','I played outside for a bit yesterday.','hebben',hebben],
 ['Zij heeft gisteren buiten een foto gemaakt.','She took a photo outside yesterday.','hebben',hebben],
 ['Ik ben gisteren even naar huis gegaan.','I went home for a bit yesterday.','zijn',zijn],
 ['Hij is gisteren te laat naar school gegaan.','He went to school late yesterday.','zijn',zijn],
 ['Wij zijn gisteren samen naar het park gegaan.','We went to the park together yesterday.','zijn',zijn],
 ['Ik was gisteren te laat op kantoor.','I was late at the office yesterday.','zijn',was],
 ['Hij was gisteren heel ziek.','He was very ill yesterday.','zijn',was],
 ['Wij waren gisteren samen thuis.','We were at home together yesterday.','zijn',was],
 ['Zij was gisteren druk op kantoor.','She was busy at the office yesterday.','zijn',was],
 ['Het was gisteren heel koud.','It was very cold yesterday.','zijn',was],
 ['Wij waren gisteren samen op kantoor.','We were at the office together yesterday.','zijn',was],
 ['Ik had gisteren een afspraak op school.','I had an appointment at school yesterday.','hebben',had],
 ['Wij hadden gisteren even geen tijd.','We had no time for a bit yesterday.','hebben',had],
 ['Ik werkte gisteren even thuis.','I worked at home for a bit yesterday.','werken',werken],
 ['Wij werkten gisteren samen op kantoor.','We worked at the office together yesterday.','werken',werken],
 ['Zij speelde gisteren even buiten.','She played outside for a bit yesterday.','spelen',spelen],
 ['Wij speelden gisteren samen in het park.','We played in the park together yesterday.','spelen',spelen],
 ['Ik maakte gisteren een foto in het park.','I took a photo in the park yesterday.','maken',maken],
 ['Wij maakten gisteren samen een foto.','We took a photo together yesterday.','maken',maken]
];

export default {schemaVersion:1,id:'a2-past-event',version:'1.0.0',title:'A2 past events',levels:['A2'],concepts:[{
 id:'A2.1',title:'Report a simple past event',level:'A2',prerequisites:['S3'],requiresA1Checkpoint:true,minPractice:40,
 rule:'Report one finished event with hebben or zijn and the participle at the end: ik heb gewerkt. Use zijn for going: ik ben gegaan. was and had are already past. In a short story, the past verb can stand alone: ik werkte. \'t kofschip chooses that ending. A stem ending in t, k, f, s, ch or p takes -te, so werken becomes werkte. Other stems take -de, so spelen becomes speelde.',
 example:'Ik heb gisteren heel lang gewerkt.',
 translation:'I worked for a very long time yesterday.'
}],sentences:[...practice.map((item,i)=>row('practice',i,item)),...proof.map((item,i)=>row('proof',i,item))]};
