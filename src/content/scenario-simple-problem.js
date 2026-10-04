const kinds=['choice','wordbank','typed','gap','form','correct-sentence','correction','listening'];
const verbs={
 begrijpen:['begrijp','begrijpt','begrijpen'],
 zijn:['ben','bent','is','zijn'],
 werken:['werk','werkt','werken'],
 hebben:['heb','hebt','heeft','hebben']
};
const gloss={begrijpen:'understand',zijn:'be',werken:'work',hebben:'have'};
const word=v=>({id:`s1:${v}`,nl:v,en:gloss[v]||v,mature:false});
function row(pool,i,[nl,en,verb,verbIndex,subject]){return {id:`S1-${pool==='practice'?'p':'t'}-${String(i+1).padStart(2,'0')}`,concept:'S1',pool,nl,en,verb,verbIndex,verbSlots:[verbIndex],forms:verbs[verb],subject,family:`S1:${verb}`,vocabulary:[word(verb)],difficulty:pool==='practice'?1:2,suitableKinds:kinds,expectedStructure:'a simple problem: not understanding, being late, something not working, or needing help'};}
const build=(pool,rows)=>rows.map((x,i)=>row(pool,i,x));
const practice=[
 ['Ik begrijp het niet.','I do not understand.','begrijpen',1,'Ik'],
 ['Ik begrijp u niet.','I do not understand you. (polite)','begrijpen',1,'Ik'],
 ['Zij begrijpt het niet.','She does not understand.','begrijpen',1,'Zij'],
 ['De trein is te laat.','The train is late.','zijn',2,'De trein'],
 ['De bus is te laat.','The bus is late.','zijn',2,'De bus'],
 ['Ik ben te laat.','I am late.','zijn',1,'Ik'],
 ['Wij zijn te laat.','We are late.','zijn',1,'Wij'],
 ['Mijn telefoon werkt niet.','My phone does not work.','werken',2,'Mijn telefoon'],
 ['Mijn fiets werkt niet.','My bicycle does not work.','werken',2,'Mijn fiets'],
 ['Ik heb hulp nodig.','I need help.','hebben',1,'Ik'],
 ['Wij hebben hulp nodig.','We need help.','hebben',1,'Wij'],
 ['Ik heb hulp nodig, want mijn telefoon werkt niet.','I need help, because my phone does not work.','hebben',1,'Ik'],
 ['Ik begrijp het niet, maar ik heb hulp nodig.','I do not understand, but I need help.','begrijpen',1,'Ik'],
 ['De trein is te laat, en wij hebben hulp nodig.','The train is late, and we need help.','zijn',2,'De trein']
];
const proof=[
 ['Hij begrijpt het niet.','He does not understand.','begrijpen',1,'Hij'],
 ['Jij begrijpt het niet.','You do not understand. (speaking to one person)','begrijpen',1,'Jij'],
 ['Wij begrijpen het niet.','We do not understand.','begrijpen',1,'Wij'],
 ['Jullie begrijpen het niet.','You do not understand. (speaking to several people)','begrijpen',1,'Jullie'],
 ['Mijn moeder begrijpt het niet.','My mother does not understand.','begrijpen',2,'Mijn moeder'],
 ['De kinderen begrijpen het niet.','The children do not understand.','begrijpen',2,'De kinderen'],
 ['Ik begrijp hem niet.','I do not understand him.','begrijpen',1,'Ik'],
 ['Ik begrijp haar niet.','I do not understand her.','begrijpen',1,'Ik'],
 ['Zij begrijpt ons niet.','She does not understand us.','begrijpen',1,'Zij'],
 ['Hij is te laat.','He is late.','zijn',1,'Hij'],
 ['Zij is te laat.','She is late.','zijn',1,'Zij'],
 ['Jij bent te laat.','You are late. (speaking to one person)','zijn',1,'Jij'],
 ['Jullie zijn te laat.','You are late. (speaking to several people)','zijn',1,'Jullie'],
 ['Mijn broer is te laat.','My brother is late.','zijn',2,'Mijn broer'],
 ['Mijn vader is te laat.','My father is late.','zijn',2,'Mijn vader'],
 ['Onze trein is te laat.','Our train is late.','zijn',2,'Onze trein'],
 ['De volgende bus is te laat.','The next bus is late.','zijn',3,'De volgende bus'],
 ['Zijn telefoon werkt niet.','His phone does not work.','werken',2,'Zijn telefoon'],
 ['Haar fiets werkt niet.','Her bicycle does not work.','werken',2,'Haar fiets'],
 ['Onze telefoon werkt niet.','Our phone does not work.','werken',2,'Onze telefoon'],
 ['De oude fiets werkt niet.','The old bicycle does not work.','werken',3,'De oude fiets'],
 ['Zijn fiets werkt niet.','His bicycle does not work.','werken',2,'Zijn fiets'],
 ['Hij heeft hulp nodig.','He needs help.','hebben',1,'Hij'],
 ['Zij heeft hulp nodig.','She needs help.','hebben',1,'Zij'],
 ['Jij hebt hulp nodig.','You need help. (speaking to one person)','hebben',1,'Jij'],
 ['Jullie hebben hulp nodig.','You need help. (speaking to several people)','hebben',1,'Jullie'],
 ['Mijn moeder heeft hulp nodig.','My mother needs help.','hebben',2,'Mijn moeder'],
 ['De kinderen hebben hulp nodig.','The children need help.','hebben',2,'De kinderen'],
 ['Mijn vader heeft hulp nodig.','My father needs help.','hebben',2,'Mijn vader'],
 ['Ik heb hulp nodig, want ik begrijp het niet.','I need help, because I do not understand.','hebben',1,'Ik'],
 ['Wij hebben hulp nodig, want de trein is te laat.','We need help, because the train is late.','hebben',1,'Wij'],
 ['Hij heeft hulp nodig, want zijn telefoon werkt niet.','He needs help, because his phone does not work.','hebben',1,'Hij'],
 ['Zij begrijpt het niet, maar zij heeft hulp nodig.','She does not understand, but she needs help.','begrijpen',1,'Zij'],
 ['Ik ben te laat, en mijn telefoon werkt niet.','I am late, and my phone does not work.','zijn',1,'Ik'],
 ['Mijn fiets werkt niet, en ik heb hulp nodig.','My bicycle does not work, and I need help.','werken',2,'Mijn fiets'],
 ['Ik ben te laat, want de trein is te laat.','I am late, because the train is late.','zijn',1,'Ik'],
 ['Jij hebt hulp nodig, want jij bent te laat.','You need help, because you are late. (speaking to one person)','hebben',1,'Jij'],
 ['Wij zijn te laat, en wij hebben hulp nodig.','We are late, and we need help.','zijn',1,'Wij'],
 ['Haar telefoon werkt niet.','Her phone does not work.','werken',2,'Haar telefoon'],
 ['Mijn broer heeft hulp nodig, want hij is te laat.','My brother needs help, because he is late.','hebben',2,'Mijn broer']
];
export default {schemaVersion:1,id:'scenario-simple-problem',version:'1.0.0',title:'Scenario: a simple problem',levels:['A1'],concepts:[{id:'S1',title:'Explain a simple problem',level:'A1',prerequisites:['A1.25'],rule:'Explain a simple problem with a short chunk you can reuse: ik begrijp het niet, ik ben te laat, or mijn telefoon werkt niet. To ask for help, use ik heb hulp nodig. Add the reason with want, or a second idea with en or maar. Each idea keeps its own subject and finite verb.',example:'Ik heb hulp nodig, want mijn telefoon werkt niet.',translation:'I need help, because my phone does not work.',minPractice:40}],sentences:[...build('practice',practice),...build('proof',proof)]};
