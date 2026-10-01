import {tokens,normalize} from '../engine/util.js';

// Additional reviewed practice contexts for breadth and assessed-pattern gaps after DAB-176.
// Each row uses an already-taught verb and keeps proof wording untouched.
const contexts={
 'A1.7':[
  ['De kinderen eten geen kaas.','The children do not eat cheese.','eten',2,'De kinderen'],
  ['Mijn vader koopt vandaag niets.','My father is buying nothing today.','kopen',2,'Mijn vader']
 ],
 'A1.14':[
  ['Leest jouw broer een boek?','Is your brother reading a book?','lezen',0,'jouw broer'],
  ['Gaan wij morgen naar school?','Are we going to school tomorrow?','gaan',0,'wij'],
  ['Spreekt de dokter Nederlands?','Does the doctor speak Dutch?','spreken',0,'de dokter'],
  ['Eten de kinderen vanavond thuis?','Are the children eating at home tonight?','eten',0,'de kinderen'],
  ['Heb jij een fiets?','Do you (one person) have a bicycle?','hebben',0,'jij'],
  ['Waar werkt jouw moeder?','Where does your mother work?','werken',1,'jouw moeder'],
  ['Wat leest mijn zus?','What is my sister reading?','lezen',1,'mijn zus'],
  ['Wanneer komt onze trein?','When is our train coming?','komen',1,'onze trein'],
  ['Waarom gaan de kinderen naar huis?','Why are the children going home?','gaan',1,'de kinderen'],
  ['Hoe gaat jouw broer naar school?','How does your brother go to school?','gaan',1,'jouw broer']
 ],
 'A1.15':[
  ['Mijn vader werkt op zondag niet.','My father does not work on Sunday.','werken',2,'Mijn vader'],
  ['De kinderen drinken geen thee.','The children do not drink tea.','drinken',2,'De kinderen'],
  ['Jij woont niet in Den Haag.','You (one person) do not live in The Hague.','wonen',1,'Jij'],
  ['Onze buren kopen geen bloemen.','Our neighbours do not buy flowers.','kopen',2,'Onze buren'],
  ['Zij leest de brief niet.','She is not reading the letter.','lezen',1,'Zij']
 ],
 'A1.16':[
  ['Mijn zus staat op maandag vroeg op.','My sister gets up early on Monday.','opstaan',2,'Mijn zus'],
  ['Wij bellen onze vrienden vanavond op.','We call our friends tonight.','opbellen',1,'Wij'],
  ['Hij neemt zijn blauwe jas mee.','He takes his blue coat along.','meenemen',1,'Hij'],
  ['Ik maak de winkel op zaterdag open.','I open the shop on Saturday.','openmaken',1,'Ik'],
  ['Jullie gaan na het werk uit.','You (several people) go out after work.','uitgaan',1,'Jullie'],
  ['De bus komt om half tien aan.','The bus arrives at half past nine.','aankomen',2,'De bus']
 ],
 'A1.18':[
  ['Onze nieuwe fietsen zijn blauw.','Our new bicycles are blue.','zijn',3,'Onze nieuwe fietsen'],
  ['Ons kleine huis is warm.','Our small house is warm.','zijn',3,'Ons kleine huis']
 ],
 'A1.20':[
  ['De bus vertrekt om half acht.','The bus leaves at half past seven.','vertrekken',2,'De bus'],
  ['Mijn verjaardag is op vijf mei.','My birthday is on the fifth of May.','zijn',2,'Mijn verjaardag'],
  ['Wij werken op dinsdag.','We work on Tuesday.','werken',1,'Wij'],
  ['De film begint om kwart voor negen.','The film starts at quarter to nine.','beginnen',2,'De film']
 ]
};

export function teachingPracticeRows(existing){
 const used=new Set(existing.map(item=>normalize(item.nl)));
 const rows=[];
 for(const [concept,specs] of Object.entries(contexts))for(const [index,[nl,en,verb,verbIndex,subject]] of specs.entries()){
  if(used.has(normalize(nl)))throw Error(`${concept}: practice sentence overlaps existing course text: ${nl}`);
  const model=existing.find(item=>item.concept===concept&&item.pool==='practice'&&item.verb===verb)
   ||existing.find(item=>item.pool==='practice'&&item.verb===verb);
  if(!model)throw Error(`${concept}: missing practice model for ${verb}`);
  rows.push({...model,id:`${concept}-teaching-p-${String(index+1).padStart(2,'0')}`,concept,nl,en,verb,verbIndex,
   verbSlots:concept==='A1.16'?[verbIndex,tokens(nl).length-1]:[verbIndex],subject,pool:'practice',
   family:`${concept}:${verb}`,expectedStructure:concept==='A1.14'?'question word or finite-verb first':model.expectedStructure});
  used.add(normalize(nl));
 }
 return rows;
}
