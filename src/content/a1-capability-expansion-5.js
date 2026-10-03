const kinds=['choice','wordbank','typed','gap','form','correct-sentence','correction','listening'];
const verbs={
 mogen:['mag','mogen'],
 willen:['wil','wilt','willen'],
 kunnen:['kan','kunt','kunnen'],
 kosten:['kost','kosten'],
 zeggen:['zeg','zegt','zeggen'],
 nemen:['neem','neemt','nemen']
};
const gloss={mogen:'may',willen:'want',kunnen:'can',kosten:'cost',zeggen:'say',nemen:'take'};
const word=v=>({id:`a1cap5:${v}`,nl:v,en:gloss[v]||v,mature:false});
function row(pool,i,[nl,en,verb,verbIndex,subject]){return {id:`A1.23-${pool==='practice'?'p':'t'}-${String(i+1).padStart(2,'0')}`,concept:'A1.23',pool,nl,en,verb,verbIndex,verbSlots:[verbIndex],forms:verbs[verb],subject,family:`A1.23:${verb}`,vocabulary:[word(verb)],difficulty:pool==='practice'?1:2,suitableKinds:kinds,expectedStructure:'polite request, order, price, help or repetition'};}
const build=(pool,rows)=>rows.map((x,i)=>row(pool,i,x));
const practice=[
 ['Mag ik een koffie, alstublieft?','May I have a coffee, please?','mogen',0,'ik'],
 ['Mag ik de rekening, alstublieft?','May I have the bill, please?','mogen',0,'ik'],
 ['Ik wil graag een broodje.','I would like a sandwich.','willen',1,'Ik'],
 ['Kan ik hier betalen?','Can I pay here?','kunnen',0,'ik'],
 ['Wij willen graag twee kaartjes.','We would like two tickets.','willen',1,'Wij'],
 ['Wat kost een koffie?','What does a coffee cost?','kosten',1,'een koffie'],
 ['Hoeveel kost dit brood?','How much does this bread cost?','kosten',1,'dit brood'],
 ['Kunt u mij helpen?','Can you help me? (polite)','kunnen',0,'u'],
 ['Kunt u dat herhalen, alstublieft?','Can you repeat that, please? (polite)','kunnen',0,'u'],
 ['Zegt u dat nog een keer, alstublieft?','Could you say that once more, please? (polite)','zeggen',0,'u'],
 ['Ik neem een thee, alstublieft.','I\'ll have a tea, please.','nemen',1,'Ik'],
 ['Ik wil geen suiker, alstublieft.','I don\'t want any sugar, please.','willen',1,'Ik']
];
const proof=[
 ['Mag ik een thee, alstublieft?','May I have a tea, please?','mogen',0,'ik'],
 ['Mag ik een broodje, alstublieft?','May I have a sandwich, please?','mogen',0,'ik'],
 ['Mag ik twee koffie, alstublieft?','May I have two coffees, please?','mogen',0,'ik'],
 ['Mag ik water, alstublieft?','May I have some water, please?','mogen',0,'ik'],
 ['Mag ik een appel, alstublieft?','May I have an apple, please?','mogen',0,'ik'],
 ['Ik wil graag soep.','I would like soup.','willen',1,'Ik'],
 ['Ik wil graag een appel.','I would like an apple.','willen',1,'Ik'],
 ['Zij wil graag thee.','She would like tea.','willen',1,'Zij'],
 ['Hij wil graag een broodje.','He would like a sandwich.','willen',1,'Hij'],
 ['Wij willen graag water.','We would like water.','willen',1,'Wij'],
 ['Jullie willen graag koffie.','You would like coffee. (speaking to several people)','willen',1,'Jullie'],
 ['Ik neem een koffie, alstublieft.','I\'ll have a coffee, please.','nemen',1,'Ik'],
 ['Wij nemen twee broodjes.','We\'ll have two sandwiches.','nemen',1,'Wij'],
 ['Zij neemt een thee.','She\'ll have a tea.','nemen',1,'Zij'],
 ['Hij neemt een broodje.','He\'ll have a sandwich.','nemen',1,'Hij'],
 ['Kan ik de rekening betalen?','Can I pay the bill?','kunnen',0,'ik'],
 ['Mogen wij hier zitten?','May we sit here?','mogen',0,'wij'],
 ['Mag ik nog een koffie?','May I have another coffee?','mogen',0,'ik'],
 ['Wat kost de soep?','What does the soup cost?','kosten',1,'de soep'],
 ['Wat kost een broodje?','What does a sandwich cost?','kosten',1,'een broodje'],
 ['Wat kost een kaartje?','What does a ticket cost?','kosten',1,'een kaartje'],
 ['Hoeveel kost de koffie?','How much does the coffee cost?','kosten',1,'de koffie'],
 ['Hoeveel kost een thee?','How much does a tea cost?','kosten',1,'een thee'],
 ['Een thee kost twee euro.','A tea costs two euros.','kosten',2,'Een thee'],
 ['Een broodje kost drie euro.','A sandwich costs three euros.','kosten',2,'Een broodje'],
 ['Twee kaartjes kosten zes euro.','Two tickets cost six euros.','kosten',2,'Twee kaartjes'],
 ['De soep kost vijf euro.','The soup costs five euros.','kosten',2,'De soep'],
 ['Dit brood kost twee euro.','This bread costs two euros.','kosten',2,'Dit brood'],
 ['Kunt u ons helpen?','Can you help us? (polite)','kunnen',0,'u'],
 ['Kunt u langzaam spreken?','Can you speak slowly? (polite)','kunnen',0,'u'],
 ['Kunt u dat nog een keer zeggen?','Can you say that once more? (polite)','kunnen',0,'u'],
 ['Zegt u dat langzaam, alstublieft?','Could you say that slowly, please? (polite)','zeggen',0,'u'],
 ['Kunt u dat alstublieft herhalen?','Can you please repeat that? (polite)','kunnen',0,'u'],
 ['Zegt u dat nog een keer?','Could you say that once more? (polite)','zeggen',0,'u'],
 ['Ik wil geen melk, alstublieft.','I don\'t want any milk, please.','willen',1,'Ik'],
 ['Ik neem de koffie niet.','I won\'t have the coffee.','nemen',1,'Ik'],
 ['Wij willen geen thee.','We don\'t want tea.','willen',1,'Wij'],
 ['Hij wil geen koffie.','He doesn\'t want coffee.','willen',1,'Hij'],
 ['Mag ik twee kaartjes, alstublieft?','May I have two tickets, please?','mogen',0,'ik'],
 ['Mogen wij nog een koffie, alstublieft?','May we have another coffee, please?','mogen',0,'wij']
];
export default {schemaVersion:1,id:'a1-capability-expansion-5',version:'1.0.0',title:'A1 Capability Expansion 5',levels:['A1'],concepts:[{id:'A1.23',title:'Requests and service Dutch',level:'A1',prerequisites:['A1.22'],rule:'In a shop or café, ask with mag ik and add alstublieft: mag ik een koffie, alstublieft? To say what you would like, use ik wil graag. Ask the price with wat kost or hoeveel kost. For help or a repetition, use kunt u: kunt u mij helpen? and kunt u dat herhalen?',example:'Mag ik een koffie, alstublieft?',translation:'May I have a coffee, please.',minPractice:40}],sentences:[...build('practice',practice),...build('proof',proof)]};
