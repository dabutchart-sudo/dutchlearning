const kinds=['choice','wordbank','typed','gap','form','correct-sentence','correction','listening'];
const verbs={
 heten:['heet','heten'],
 komen:['kom','komt','komen'],
 wonen:['woon','woont','wonen']
};
const gloss={heten:'be called',komen:'come',wonen:'live'};
const word=v=>({id:`s2:${v}`,nl:v,en:gloss[v]||v,mature:false});
function row(pool,i,[nl,en,verb,verbIndex,subject]){return {id:`S2-${pool==='practice'?'p':'t'}-${String(i+1).padStart(2,'0')}`,concept:'S2',pool,nl,en,verb,verbIndex,verbSlots:[verbIndex],forms:verbs[verb],subject,family:`S2:${verb}`,vocabulary:[word(verb)],difficulty:pool==='practice'?1:2,suitableKinds:kinds,expectedStructure:'an introduction: a name, where someone comes from, or where someone lives'};}
const build=(pool,rows)=>rows.map((x,i)=>row(pool,i,x));
const practice=[
 ['Ik heet Jan.','I am called Jan.','heten',1,'Ik'],
 ['Zij heet Anna.','She is called Anna.','heten',1,'Zij'],
 ['Hij heet Tom.','He is called Tom.','heten',1,'Hij'],
 ['Zij heet Lisa.','She is called Lisa.','heten',1,'Zij'],
 ['Hoe heet u?','What is your name? (polite)','heten',1,'u'],
 ['Ik kom uit Nederland.','I come from the Netherlands.','komen',1,'Ik'],
 ['Zij komt uit Utrecht.','She comes from Utrecht.','komen',1,'Zij'],
 ['Mijn ouders komen uit Amsterdam.','My parents come from Amsterdam.','komen',2,'Mijn ouders'],
 ['Ik woon in Amsterdam.','I live in Amsterdam.','wonen',1,'Ik'],
 ['Hij woont in Rotterdam.','He lives in Rotterdam.','wonen',1,'Hij'],
 ['Mijn zus woont in Utrecht.','My sister lives in Utrecht.','wonen',2,'Mijn zus'],
 ['Ik heet Jan, en ik woon in Amsterdam.','I am called Jan, and I live in Amsterdam.','heten',1,'Ik'],
 ['Zij heet Anna, en zij komt uit Utrecht.','She is called Anna, and she comes from Utrecht.','heten',1,'Zij'],
 ['Ik kom uit Nederland, en ik woon in Amsterdam.','I come from the Netherlands, and I live in Amsterdam.','komen',1,'Ik']
];
const proof=[
 ['Ik heet Anna.','I am called Anna.','heten',1,'Ik'],
 ['Ik heet Tom.','I am called Tom.','heten',1,'Ik'],
 ['Ik heet Lisa.','I am called Lisa.','heten',1,'Ik'],
 ['Zij heet Tom.','She is called Tom.','heten',1,'Zij'],
 ['Hij heet Jan.','He is called Jan.','heten',1,'Hij'],
 ['Onze dokter heet Jan.','Our doctor is called Jan.','heten',2,'Onze dokter'],
 ['Mijn broer heet Jan.','My brother is called Jan.','heten',2,'Mijn broer'],
 ['Mijn zus heet Anna.','My sister is called Anna.','heten',2,'Mijn zus'],
 ['Mijn moeder heet Lisa.','My mother is called Lisa.','heten',2,'Mijn moeder'],
 ['Mijn vader heet Tom.','My father is called Tom.','heten',2,'Mijn vader'],
 ['Hoe heet zij?','What is her name?','heten',1,'zij'],
 ['Hoe heet hij?','What is his name?','heten',1,'hij'],
 ['Ik kom uit Utrecht.','I come from Utrecht.','komen',1,'Ik'],
 ['Mijn vader komt uit Amsterdam.','My father comes from Amsterdam.','komen',2,'Mijn vader'],
 ['Ik kom uit Rotterdam.','I come from Rotterdam.','komen',1,'Ik'],
 ['Hij komt uit Nederland.','He comes from the Netherlands.','komen',1,'Hij'],
 ['Zij komt uit Rotterdam.','She comes from Rotterdam.','komen',1,'Zij'],
 ['Zij komt uit Nederland.','She comes from the Netherlands.','komen',1,'Zij'],
 ['Hij komt uit Rotterdam.','He comes from Rotterdam.','komen',1,'Hij'],
 ['Wij komen uit Nederland.','We come from the Netherlands.','komen',1,'Wij'],
 ['Wij komen uit Utrecht.','We come from Utrecht.','komen',1,'Wij'],
 ['Jullie komen uit Amsterdam.','You come from Amsterdam. (speaking to several people)','komen',1,'Jullie'],
 ['Mijn moeder komt uit Utrecht.','My mother comes from Utrecht.','komen',2,'Mijn moeder'],
 ['De kinderen komen uit Amsterdam.','The children come from Amsterdam.','komen',2,'De kinderen'],
 ['Mijn moeder woont in Den Haag.','My mother lives in The Hague.','wonen',2,'Mijn moeder'],
 ['Ik woon in Den Haag.','I live in The Hague.','wonen',1,'Ik'],
 ['Mijn zus woont in Den Haag.','My sister lives in The Hague.','wonen',2,'Mijn zus'],
 ['Onze leraar woont in Utrecht.','Our teacher lives in Utrecht.','wonen',2,'Onze leraar'],
 ['Mijn broer woont in Utrecht.','My brother lives in Utrecht.','wonen',2,'Mijn broer'],
 ['Wij wonen in Rotterdam.','We live in Rotterdam.','wonen',1,'Wij'],
 ['Jullie wonen in Utrecht.','You live in Utrecht. (speaking to several people)','wonen',1,'Jullie'],
 ['Mijn broer woont in Amsterdam.','My brother lives in Amsterdam.','wonen',2,'Mijn broer'],
 ['Ik heet Tom, en ik woon in Utrecht.','I am called Tom, and I live in Utrecht.','heten',1,'Ik'],
 ['Hij heet Jan, en hij woont in Rotterdam.','He is called Jan, and he lives in Rotterdam.','heten',1,'Hij'],
 ['Zij komt uit Nederland, en zij woont in Utrecht.','She comes from the Netherlands, and she lives in Utrecht.','komen',1,'Zij'],
 ['Ik heet Lisa, en ik kom uit Amsterdam.','I am called Lisa, and I come from Amsterdam.','heten',1,'Ik'],
 ['Wij komen uit Rotterdam, en wij wonen in Utrecht.','We come from Rotterdam, and we live in Utrecht.','komen',1,'Wij'],
 ['Mijn zus heet Lisa, en zij woont in Amsterdam.','My sister is called Lisa, and she lives in Amsterdam.','heten',2,'Mijn zus'],
 ['Hij komt uit Utrecht, en hij heet Tom.','He comes from Utrecht, and he is called Tom.','komen',1,'Hij'],
 ['Ik woon in Amsterdam, en ik heet Jan.','I live in Amsterdam, and I am called Jan.','wonen',1,'Ik']
];
export default {schemaVersion:1,id:'scenario-introductions',version:'1.0.0',title:'Scenario: introductions',levels:['A1'],concepts:[{id:'S2',title:'Introduce yourself',level:'A1',prerequisites:['S1'],rule:'Introduce yourself with a short chunk you can reuse: ik heet Jan. Ask a polite name with hoe heet u? Say where you come from with ik kom uit, and where you live with ik woon in. A second idea can join with en. Each idea keeps its own subject and finite verb.',example:'Ik heet Jan, en ik woon in Amsterdam.',translation:'I am called Jan, and I live in Amsterdam.',minPractice:40}],sentences:[...build('practice',practice),...build('proof',proof)]};
