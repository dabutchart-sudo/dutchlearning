const kinds=['choice','wordbank','typed','gap','form','correct-sentence','correction','listening'];
const verbs={
 hebben:['heb','hebt','heeft','hebben'],
 zijn:['ben','bent','is','zijn'],
 komen:['kom','komt','komen']
};
const gloss={hebben:'have',zijn:'be',komen:'come'};
const word=v=>({id:`s3:${v}`,nl:v,en:gloss[v]||v,mature:false});
function row(pool,i,[nl,en,verb,verbIndex,subject]){return {id:`S3-${pool==='practice'?'p':'t'}-${String(i+1).padStart(2,'0')}`,concept:'S3',pool,nl,en,verb,verbIndex,verbSlots:[verbIndex],forms:verbs[verb],subject,family:`S3:${verb}`,vocabulary:[word(verb)],difficulty:pool==='practice'?1:2,suitableKinds:kinds,expectedStructure:'a simple plan: an appointment, a clock time, or coming at that time'};}
const build=(pool,rows)=>rows.map((x,i)=>row(pool,i,x));
const practice=[
 ['Ik heb vandaag een afspraak.','I have an appointment today.','hebben',1,'Ik'],
 ['Ik heb om twee uur een afspraak.','I have an appointment at two.','hebben',1,'Ik'],
 ['Zij heeft om vijf uur een afspraak.','She has an appointment at five.','hebben',1,'Zij'],
 ['Wij hebben maandag een afspraak.','We have an appointment on Monday.','hebben',1,'Wij'],
 ['De afspraak is om half drie.','The appointment is at half past two.','zijn',2,'De afspraak'],
 ['Mijn afspraak is om elf uur.','My appointment is at eleven.','zijn',2,'Mijn afspraak'],
 ['Ik kom om twee uur.','I am coming at two.','komen',1,'Ik'],
 ['Zij komt om vijf uur.','She is coming at five.','komen',1,'Zij'],
 ['Komt u om half drie?','Are you coming at half past two? (polite)','komen',0,'u'],
 ['Wij komen om elf uur.','We are coming at eleven.','komen',1,'Wij'],
 ['Ik heb om twee uur een afspraak, en ik kom naar de dokter.','I have an appointment at two, and I am coming to the doctor.','hebben',1,'Ik'],
 ['Zij heeft om vijf uur een afspraak, en zij komt naar school.','She has an appointment at five, and she is coming to school.','hebben',1,'Zij'],
 ['Wij hebben maandag een afspraak, en wij komen om half drie.','We have an appointment on Monday, and we are coming at half past two.','hebben',1,'Wij'],
 ['De afspraak is om elf uur, en ik kom naar kantoor.','The appointment is at eleven, and I am coming to the office.','zijn',2,'De afspraak']
];
const proof=[
 ['Ik heb om zes uur een afspraak.','I have an appointment at six.','hebben',1,'Ik'],
 ['Ik heb om negen uur een afspraak.','I have an appointment at nine.','hebben',1,'Ik'],
 ['Ik heb om twaalf uur een afspraak.','I have an appointment at twelve.','hebben',1,'Ik'],
 ['Hij heeft om twee uur een afspraak.','He has an appointment at two.','hebben',1,'Hij'],
 ['Hij heeft om elf uur een afspraak.','He has an appointment at eleven.','hebben',1,'Hij'],
 ['Zij heeft om half drie een afspraak.','She has an appointment at half past two.','hebben',1,'Zij'],
 ['Zij heeft dinsdag een afspraak.','She has an appointment on Tuesday.','hebben',1,'Zij'],
 ['Wij hebben om vijf uur een afspraak.','We have an appointment at five.','hebben',1,'Wij'],
 ['Wij hebben woensdag een afspraak.','We have an appointment on Wednesday.','hebben',1,'Wij'],
 ['Jullie hebben om twee uur een afspraak.','You have an appointment at two. (speaking to several people)','hebben',1,'Jullie'],
 ['Jullie hebben zaterdag een afspraak.','You have an appointment on Saturday. (speaking to several people)','hebben',1,'Jullie'],
 ['Mijn moeder heeft om zes uur een afspraak.','My mother has an appointment at six.','hebben',2,'Mijn moeder'],
 ['Mijn vader heeft woensdag een afspraak.','My father has an appointment on Wednesday.','hebben',2,'Mijn vader'],
 ['Hebt u om negen uur een afspraak?','Do you have an appointment at nine? (polite)','hebben',0,'u'],
 ['De afspraak is om twee uur.','The appointment is at two.','zijn',2,'De afspraak'],
 ['De afspraak is om zes uur.','The appointment is at six.','zijn',2,'De afspraak'],
 ['Zijn afspraak is om vijf uur.','His appointment is at five.','zijn',2,'Zijn afspraak'],
 ['Haar afspraak is om elf uur.','Her appointment is at eleven.','zijn',2,'Haar afspraak'],
 ['Onze afspraak is om half drie.','Our appointment is at half past two.','zijn',2,'Onze afspraak'],
 ['De afspraak is op dinsdag.','The appointment is on Tuesday.','zijn',2,'De afspraak'],
 ['Ik kom om zes uur.','I am coming at six.','komen',1,'Ik'],
 ['Ik kom om negen uur.','I am coming at nine.','komen',1,'Ik'],
 ['Hij komt om twee uur.','He is coming at two.','komen',1,'Hij'],
 ['Hij komt om half drie.','He is coming at half past two.','komen',1,'Hij'],
 ['Zij komt om elf uur.','She is coming at eleven.','komen',1,'Zij'],
 ['Zij komt om twaalf uur.','She is coming at twelve.','komen',1,'Zij'],
 ['Wij komen om vijf uur.','We are coming at five.','komen',1,'Wij'],
 ['Wij komen om half acht.','We are coming at half past seven.','komen',1,'Wij'],
 ['Jullie komen om zes uur.','You are coming at six. (speaking to several people)','komen',1,'Jullie'],
 ['Mijn zus komt om negen uur.','My sister is coming at nine.','komen',2,'Mijn zus'],
 ['Komt u om twee uur?','Are you coming at two? (polite)','komen',0,'u'],
 ['Ik heb om zes uur een afspraak, en ik kom naar de dokter.','I have an appointment at six, and I am coming to the doctor.','hebben',1,'Ik'],
 ['Hij heeft om twee uur een afspraak, en hij komt naar school.','He has an appointment at two, and he is coming to school.','hebben',1,'Hij'],
 ['Zij komt om elf uur, en zij heeft een afspraak.','She is coming at eleven, and she has an appointment.','komen',1,'Zij'],
 ['Wij komen om vijf uur, en wij hebben een afspraak.','We are coming at five, and we have an appointment.','komen',1,'Wij'],
 ['De afspraak is om negen uur, en ik kom naar kantoor.','The appointment is at nine, and I am coming to the office.','zijn',2,'De afspraak'],
 ['Mijn moeder heeft om zes uur een afspraak, en zij komt naar de dokter.','My mother has an appointment at six, and she is coming to the doctor.','hebben',2,'Mijn moeder'],
 ['Ik kom om twaalf uur, en ik heb een afspraak.','I am coming at twelve, and I have an appointment.','komen',1,'Ik'],
 ['Jullie hebben zondag een afspraak, en jullie komen om half drie.','You have an appointment on Sunday, and you are coming at half past two. (speaking to several people)','hebben',1,'Jullie'],
 ['Hij komt om zes uur, en de afspraak is om zes uur.','He is coming at six, and the appointment is at six.','komen',1,'Hij']
];
export default {schemaVersion:1,id:'scenario-plans',version:'1.0.0',title:'Scenario: plans',levels:['A1'],concepts:[{id:'S3',title:'Arrange a simple plan',level:'A1',prerequisites:['S2'],rule:'Arrange a simple plan with a short chunk you can reuse: ik heb een afspraak. Say the time with om: ik heb om twee uur een afspraak. Say you are coming with ik kom om twee uur. A second idea can join with en. Each idea keeps its own subject and finite verb.',example:'Ik heb om twee uur een afspraak, en ik kom naar de dokter.',translation:'I have an appointment at two, and I am coming to the doctor.',minPractice:40}],sentences:[...build('practice',practice),...build('proof',proof)]};
