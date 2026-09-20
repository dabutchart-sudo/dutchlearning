const kinds=['choice','wordbank','typed','gap','form','correct-sentence','correction','listening'];
const verbs={
 gaan:['ga','gaat','gaan'],wonen:['woon','woont','wonen'],liggen:['lig','ligt','liggen'],werken:['werk','werkt','werken'],
 komen:['kom','komt','komen'],zijn:['ben','bent','is','zijn'],spelen:['speel','speelt','spelen'],eten:['eet','eten'],
 staan:['sta','staat','staan'],zitten:['zit','zitten'],lopen:['loop','loopt','lopen'],fietsen:['fiets','fietst','fietsen'],
 wachten:['wacht','wachten'],blijven:['blijf','blijft','blijven'],zetten:['zet','zetten'],hangen:['hang','hangt','hangen'],
 leggen:['leg','legt','leggen'],rijden:['rijd','rijdt','rijden']
};
const gloss={gaan:'go',wonen:'live',liggen:'lie',werken:'work',komen:'come',zijn:'be',spelen:'play',eten:'eat',staan:'stand',zitten:'sit',lopen:'walk',fietsen:'cycle',wachten:'wait',blijven:'stay',zetten:'put',hangen:'hang',leggen:'lay',rijden:'drive'};
const word=v=>({id:`a1cap3:${v}`,nl:v,en:gloss[v]||v,mature:false});
function row(concept,pool,i,[nl,en,verb,verbIndex,subject]){return {id:`${concept}-${pool==='practice'?'p':'t'}-${String(i+1).padStart(2,'0')}`,concept,pool,nl,en,verb,verbIndex,verbSlots:[verbIndex],forms:verbs[verb],subject,family:`${concept}:${verb}`,vocabulary:[word(verb)],difficulty:pool==='practice'?1:2,suitableKinds:kinds,expectedStructure:'subject finite-verb place-preposition remainder'};}
const build=(id,p,t)=>[...p.map((x,i)=>row(id,'practice',i,x)),...t.map((x,i)=>row(id,'proof',i,x))];
const p21=[
 ['Ik ga naar huis.','I am going home.','gaan',1,'Ik'],
 ['Wij wonen in Utrecht.','We live in Utrecht.','wonen',1,'Wij'],
 ['Het boek ligt op de tafel.','The book is lying on the table.','liggen',2,'Het boek'],
 ['Ik werk bij de school.','I work at the school.','werken',1,'Ik'],
 ['Zij komt uit Amsterdam.','She comes from Amsterdam.','komen',1,'Zij'],
 ['De tas is van mijn zus.','The bag is my sister’s.','zijn',2,'De tas'],
 ['Hij gaat naar de winkel.','He is going to the shop.','gaan',1,'Hij'],
 ['De kinderen spelen in het park.','The children are playing in the park.','spelen',2,'De kinderen'],
 ['Mijn jas ligt op de stoel.','My coat is lying on the chair.','liggen',2,'Mijn jas'],
 ['Wij eten bij onze vrienden.','We are eating at our friends’ house.','eten',1,'Wij']
];
const t21=[
 ['Ik ga naar school.','I am going to school.','gaan',1,'Ik'],
 ['Jij gaat naar de markt.','You are going to the market.','gaan',1,'Jij'],
 ['Hij gaat naar kantoor.','He is going to the office.','gaan',1,'Hij'],
 ['Zij gaat naar de bibliotheek.','She is going to the library.','gaan',1,'Zij'],
 ['Wij gaan naar het station.','We are going to the station.','gaan',1,'Wij'],
 ['Jullie gaan naar het museum.','You are going to the museum.','gaan',1,'Jullie'],
 ['Ik woon in Rotterdam.','I live in Rotterdam.','wonen',1,'Ik'],
 ['Jij woont in een klein huis.','You live in a small house.','wonen',1,'Jij'],
 ['Hij woont in Den Haag.','He lives in The Hague.','wonen',1,'Hij'],
 ['Wij wonen in een nieuw huis.','We live in a new house.','wonen',1,'Wij'],
 ['Het kind zit in de auto.','The child is sitting in the car.','zitten',2,'Het kind'],
 ['De sleutels liggen in de tas.','The keys are lying in the bag.','liggen',2,'De sleutels'],
 ['Mijn telefoon ligt op het bed.','My phone is lying on the bed.','liggen',2,'Mijn telefoon'],
 ['De kopjes staan op de tafel.','The cups are standing on the table.','staan',2,'De kopjes'],
 ['De jas hangt op de kapstok.','The coat is hanging on the coat rack.','hangen',2,'De jas'],
 ['Ik werk bij de bakker.','I work at the baker’s.','werken',1,'Ik'],
 ['Zij werkt bij de dokter.','She works at the doctor’s.','werken',1,'Zij'],
 ['Wij wachten bij de deur.','We are waiting by the door.','wachten',1,'Wij'],
 ['Hij wacht bij het station.','He is waiting at the station.','wachten',1,'Hij'],
 ['Ik kom uit Groningen.','I come from Groningen.','komen',1,'Ik'],
 ['Jij komt uit de winkel.','You are coming out of the shop.','komen',1,'Jij'],
 ['Hij komt uit het huis.','He is coming out of the house.','komen',1,'Hij'],
 ['Wij komen uit de trein.','We are coming out of the train.','komen',1,'Wij'],
 ['De fiets is van mijn broer.','The bicycle is my brother’s.','zijn',2,'De fiets'],
 ['Het huis is van onze ouders.','The house is our parents’.','zijn',2,'Het huis'],
 ['Deze sleutel is van jou.','This key is yours.','zijn',2,'Deze sleutel'],
 ['Ik loop naar het park.','I am walking to the park.','lopen',1,'Ik'],
 ['Zij fietst naar school.','She is cycling to school.','fietsen',1,'Zij'],
 ['Hij rijdt naar Amsterdam.','He is driving to Amsterdam.','rijden',1,'Hij'],
 ['Wij blijven in het hotel.','We are staying in the hotel.','blijven',1,'Wij'],
 ['Ik zet het glas op de tafel.','I put the glass on the table.','zetten',1,'Ik'],
 ['Zij legt het boek op de stoel.','She puts the book on the chair.','leggen',1,'Zij'],
 ['De kinderen lopen naar huis.','The children are walking home.','lopen',2,'De kinderen'],
 ['Mijn vader werkt in de tuin.','My father is working in the garden.','werken',2,'Mijn vader'],
 ['Onze tas staat bij de deur.','Our bag is standing by the door.','staan',2,'Onze tas'],
 ['Het kind speelt bij het water.','The child is playing by the water.','spelen',2,'Het kind'],
 ['Ik eet in de keuken.','I am eating in the kitchen.','eten',1,'Ik'],
 ['Jullie wonen bij het park.','You live near the park.','wonen',1,'Jullie'],
 ['De brief is van mijn moeder.','The letter is from my mother.','zijn',2,'De brief'],
 ['Wij gaan uit het restaurant.','We are leaving the restaurant.','gaan',1,'Wij']
];
export default {schemaVersion:1,id:'a1-capability-expansion-3',version:'1.0.0',title:'A1 Capability Expansion 3',levels:['A1'],concepts:[{id:'A1.21',title:'Place and movement',level:'A1',prerequisites:['A1.20'],rule:'Use naar when you move towards a place: ik ga naar huis. Use in when you are inside, op when something is on a surface, and bij when you are at or near a place. Uit is leaving or coming from a place; van marks who something belongs to, or a source. The finite verb stays second: het boek ligt op de tafel.',example:'Ik ga naar huis.',translation:'I am going home.',minPractice:40}],sentences:build('A1.21',p21,t21)};
