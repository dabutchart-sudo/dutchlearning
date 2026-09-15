const baseKinds=['choice','wordbank','typed','gap','form','correct-sentence','correction','listening'];
const gloss={gaan:'go',komen:'come',blijven:'stay',worden:'become',vertrekken:'leave',aankomen:'arrive',opstaan:'get up',meenemen:'take along',opbellen:'call',uitgaan:'go out',terugkomen:'come back',aandoen:'put on',uitdoen:'take off',afwassen:'wash up',opruimen:'tidy up',openmaken:'open',dichtdoen:'close'};
const word=verb=>({id:`a1y:${verb}`,nl:verb,en:gloss[verb]||verb,mature:false});
function record(concept,pool,index,[nl,en,verb,verbIndex,forms,subject,verbSlots]){
 return {id:`${concept}-${pool==='practice'?'p':'t'}-${String(index+1).padStart(2,'0')}`,concept,pool,nl,en,verb,verbIndex,verbSlots:verbSlots||[verbIndex],forms,subject,family:`${concept}:${verb}`,vocabulary:[word(verb)],difficulty:pool==='practice'?1:2,suitableKinds:baseKinds,expectedStructure:concept==='A1.9'?'subject finite-zijn remainder past-participle':'subject finite-verb remainder separable-particle'};
}
const build=(concept,practice,proof)=>[...practice.map((r,i)=>record(concept,'practice',i,r)),...proof.map((r,i)=>record(concept,'proof',i,r))];
const zijnForms=['ben','bent','is','zijn'];
const perfectPractice=[
 ['Ik ben naar huis gegaan.','I went home.','gaan',1,zijnForms,'Ik',[1,5]],
 ['Jij bent vroeg gekomen.','You came early.','komen',1,zijnForms,'Jij',[1,3]],
 ['Hij is thuis gebleven.','He stayed at home.','blijven',1,zijnForms,'Hij',[1,3]],
 ['Zij is leraar geworden.','She became a teacher.','worden',1,zijnForms,'Zij',[1,3]],
 ['Wij zijn om acht uur vertrokken.','We left at eight o’clock.','vertrekken',1,zijnForms,'Wij',[1,6]],
 ['Jullie zijn laat aangekomen.','You arrived late.','aankomen',1,zijnForms,'Jullie',[1,3]],
 ['De trein is vertrokken.','The train left.','vertrekken',2,zijnForms,'De trein',[2,3]],
 ['Mijn broer is gekomen.','My brother came.','komen',2,zijnForms,'Mijn broer',[2,3]],
 ['De kinderen zijn thuis gebleven.','The children stayed at home.','blijven',2,zijnForms,'De kinderen',[2,4]],
 ['Ik ben vroeg aangekomen.','I arrived early.','aankomen',1,zijnForms,'Ik',[1,3]]
];
const perfectProof=[
 ['Ik ben gisteren gegaan.','I went yesterday.','gaan',1,zijnForms,'Ik',[1,3]],
 ['Jij bent naar Amsterdam gegaan.','You went to Amsterdam.','gaan',1,zijnForms,'Jij',[1,4]],
 ['Hij is naar school gegaan.','He went to school.','gaan',1,zijnForms,'Hij',[1,4]],
 ['Zij is met de trein gegaan.','She went by train.','gaan',1,zijnForms,'Zij',[1,5]],
 ['Wij zijn naar buiten gegaan.','We went outside.','gaan',1,zijnForms,'Wij',[1,4]],
 ['Jullie zijn samen gegaan.','You went together.','gaan',1,zijnForms,'Jullie',[1,3]],
 ['Ik ben om negen uur gekomen.','I came at nine o’clock.','komen',1,zijnForms,'Ik',[1,6]],
 ['Jij bent alleen gekomen.','You came alone.','komen',1,zijnForms,'Jij',[1,3]],
 ['Hij is gisteren gekomen.','He came yesterday.','komen',1,zijnForms,'Hij',[1,3]],
 ['Zij is met haar broer gekomen.','She came with her brother.','komen',1,zijnForms,'Zij',[1,5]],
 ['Wij zijn op tijd gekomen.','We came on time.','komen',1,zijnForms,'Wij',[1,5]],
 ['De dokter is gekomen.','The doctor came.','komen',2,zijnForms,'De dokter',[2,3]],
 ['Ik ben vandaag thuis gebleven.','I stayed at home today.','blijven',1,zijnForms,'Ik',[1,4]],
 ['Jij bent lang gebleven.','You stayed a long time.','blijven',1,zijnForms,'Jij',[1,3]],
 ['Hij is in bed gebleven.','He stayed in bed.','blijven',1,zijnForms,'Hij',[1,4]],
 ['Zij is bij haar moeder gebleven.','She stayed with her mother.','blijven',1,zijnForms,'Zij',[1,5]],
 ['Wij zijn binnen gebleven.','We stayed inside.','blijven',1,zijnForms,'Wij',[1,3]],
 ['De hond is buiten gebleven.','The dog stayed outside.','blijven',2,zijnForms,'De hond',[2,4]],
 ['Ik ben moe geworden.','I became tired.','worden',1,zijnForms,'Ik',[1,3]],
 ['Jij bent rustig geworden.','You became calm.','worden',1,zijnForms,'Jij',[1,3]],
 ['Hij is vader geworden.','He became a father.','worden',1,zijnForms,'Hij',[1,3]],
 ['Zij is boos geworden.','She became angry.','worden',1,zijnForms,'Zij',[1,3]],
 ['Het weer is beter geworden.','The weather became better.','worden',2,zijnForms,'Het weer',[2,4]],
 ['Ik ben vroeg vertrokken.','I left early.','vertrekken',1,zijnForms,'Ik',[1,3]],
 ['Jij bent gisteren vertrokken.','You left yesterday.','vertrekken',1,zijnForms,'Jij',[1,3]],
 ['Hij is om zes uur vertrokken.','He left at six o’clock.','vertrekken',1,zijnForms,'Hij',[1,6]],
 ['Wij zijn samen vertrokken.','We left together.','vertrekken',1,zijnForms,'Wij',[1,3]],
 ['De bus is op tijd vertrokken.','The bus left on time.','vertrekken',2,zijnForms,'De bus',[2,6]],
 ['Ik ben veilig aangekomen.','I arrived safely.','aankomen',1,zijnForms,'Ik',[1,3]],
 ['Zij is gisteren aangekomen.','She arrived yesterday.','aankomen',1,zijnForms,'Zij',[1,3]],
 ['Wij zijn om tien uur aangekomen.','We arrived at ten o’clock.','aankomen',1,zijnForms,'Wij',[1,6]],
 ['De trein is vroeg aangekomen.','The train arrived early.','aankomen',2,zijnForms,'De trein',[2,4]]
];
const separablePractice=[
 ['Ik sta om zeven uur op.','I get up at seven o’clock.','opstaan',1,['sta','staat','staan'],'Ik'],
 ['Jij neemt je tas mee.','You take your bag with you.','meenemen',1,['neem','neemt','nemen'],'Jij'],
 ['Hij belt zijn moeder op.','He calls his mother.','opbellen',1,['bel','belt','bellen'],'Hij'],
 ['Zij gaat vanavond uit.','She is going out tonight.','uitgaan',1,['ga','gaat','gaan'],'Zij'],
 ['Wij komen morgen terug.','We come back tomorrow.','terugkomen',1,['kom','komt','komen'],'Wij'],
 ['Jullie doen je jas aan.','You put your coat on.','aandoen',1,['doe','doet','doen'],'Jullie'],
 ['De man doet zijn schoenen uit.','The man takes his shoes off.','uitdoen',2,['doe','doet','doen'],'De man'],
 ['Ik was na het eten af.','I wash up after the meal.','afwassen',1,['was','wast','wassen'],'Ik'],
 ['Wij ruimen de kamer op.','We tidy the room.','opruimen',1,['ruim','ruimt','ruimen'],'Wij'],
 ['Zij maakt de deur open.','She opens the door.','openmaken',1,['maak','maakt','maken'],'Zij']
];
const separableProof=[
 ['Ik sta elke dag vroeg op.','I get up early every day.','opstaan',1,['sta','staat','staan'],'Ik'],
 ['Jij staat op maandag vroeg op.','You get up early on Monday.','opstaan',1,['sta','staat','staan'],'Jij'],
 ['Hij staat om acht uur op.','He gets up at eight o’clock.','opstaan',1,['sta','staat','staan'],'Hij'],
 ['Wij staan samen op.','We get up together.','opstaan',1,['sta','staat','staan'],'Wij'],
 ['De kinderen staan vroeg op.','The children get up early.','opstaan',2,['sta','staat','staan'],'De kinderen'],
 ['Ik neem mijn boek mee.','I take my book with me.','meenemen',1,['neem','neemt','nemen'],'Ik'],
 ['Jij neemt water mee.','You take water with you.','meenemen',1,['neem','neemt','nemen'],'Jij'],
 ['Zij neemt haar fiets mee.','She takes her bicycle with her.','meenemen',1,['neem','neemt','nemen'],'Zij'],
 ['Wij nemen eten mee.','We take food with us.','meenemen',1,['neem','neemt','nemen'],'Wij'],
 ['Jullie nemen de sleutel mee.','You take the key with you.','meenemen',1,['neem','neemt','nemen'],'Jullie'],
 ['Ik bel mijn broer op.','I call my brother.','opbellen',1,['bel','belt','bellen'],'Ik'],
 ['Jij belt de dokter op.','You call the doctor.','opbellen',1,['bel','belt','bellen'],'Jij'],
 ['Zij belt haar vriend op.','She calls her friend.','opbellen',1,['bel','belt','bellen'],'Zij'],
 ['Wij bellen onze moeder op.','We call our mother.','opbellen',1,['bel','belt','bellen'],'Wij'],
 ['De leraar belt de school op.','The teacher calls the school.','opbellen',2,['bel','belt','bellen'],'De leraar'],
 ['Ik ga zaterdag uit.','I am going out on Saturday.','uitgaan',1,['ga','gaat','gaan'],'Ik'],
 ['Jij gaat vanavond uit.','You are going out tonight.','uitgaan',1,['ga','gaat','gaan'],'Jij'],
 ['Wij gaan na het eten uit.','We go out after the meal.','uitgaan',1,['ga','gaat','gaan'],'Wij'],
 ['Jullie gaan samen uit.','You go out together.','uitgaan',1,['ga','gaat','gaan'],'Jullie'],
 ['Mijn broer gaat vaak uit.','My brother often goes out.','uitgaan',2,['ga','gaat','gaan'],'Mijn broer'],
 ['Ik kom vanavond terug.','I come back tonight.','terugkomen',1,['kom','komt','komen'],'Ik'],
 ['Jij komt morgen terug.','You come back tomorrow.','terugkomen',1,['kom','komt','komen'],'Jij'],
 ['Hij komt om vijf uur terug.','He comes back at five o’clock.','terugkomen',1,['kom','komt','komen'],'Hij'],
 ['Wij komen zondag terug.','We come back on Sunday.','terugkomen',1,['kom','komt','komen'],'Wij'],
 ['De trein komt straks terug.','The train comes back soon.','terugkomen',2,['kom','komt','komen'],'De trein'],
 ['Ik doe mijn jas aan.','I put my coat on.','aandoen',1,['doe','doet','doen'],'Ik'],
 ['Zij doet haar schoenen aan.','She puts her shoes on.','aandoen',1,['doe','doet','doen'],'Zij'],
 ['Wij wassen na het ontbijt af.','We wash up after breakfast.','afwassen',1,['was','wast','wassen'],'Wij'],
 ['Hij ruimt zijn kamer op.','He tidies his room.','opruimen',1,['ruim','ruimt','ruimen'],'Hij'],
 ['Jullie ruimen de tafel op.','You clear the table.','opruimen',1,['ruim','ruimt','ruimen'],'Jullie'],
 ['Ik maak het raam open.','I open the window.','openmaken',1,['maak','maakt','maken'],'Ik'],
 ['De vrouw doet de deur dicht.','The woman closes the door.','dichtdoen',2,['doe','doet','doen'],'De vrouw']
];
export default {
 schemaVersion:1,id:'a1-core-expansion-2',version:'1.0.0',title:'A1 Core Expansion 2',levels:['A1'],
 concepts:[
  {id:'A1.9',title:'Perfect tense with zijn',level:'A1',prerequisites:['A1.8'],rule:'Some common movement and change-of-state verbs use zijn in the perfect tense. Conjugate zijn for the subject and put the past participle at the end: ik ben gegaan, zij is gekomen, wij zijn gebleven.',example:'Wij zijn vroeg aangekomen.',translation:'We arrived early.',minPractice:40},
  {id:'A1.10',title:'Separable verbs',level:'A1',prerequisites:['A1.9'],rule:'In a simple present-tense statement, a separable verb splits. Conjugate the main verb in second position and move its particle to the end: opstaan → ik sta vroeg op; meenemen → wij nemen water mee.',example:'Ik sta vroeg op.',translation:'I get up early.',minPractice:40}
 ],
 sentences:[...build('A1.9',perfectPractice,perfectProof),...build('A1.10',separablePractice,separableProof)]
};
