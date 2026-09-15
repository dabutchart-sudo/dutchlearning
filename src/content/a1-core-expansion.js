const kinds=['choice','wordbank','typed','gap','form','correct-sentence','correction','listening'];
const vocab={
 niet:{id:'a1x:niet',nl:'niet',en:'not',mature:false},
 waar:{id:'a1x:waar',nl:'waar',en:'where',mature:false},
 wat:{id:'a1x:wat',nl:'wat',en:'what',mature:false},
 wanneer:{id:'a1x:wanneer',nl:'wanneer',en:'when',mature:false},
 hoe:{id:'a1x:hoe',nl:'hoe',en:'how',mature:false},
 wie:{id:'a1x:wie',nl:'wie',en:'who',mature:false}
};
function sentence(concept,pool,index,[nl,en,verb,verbIndex,forms,subject,target]){
 return {id:`${concept}-${pool==='practice'?'p':'t'}-${String(index+1).padStart(2,'0')}`,concept,pool,nl,en,verb,verbIndex,verbSlots:[verbIndex],forms,subject,family:`${concept}:${verb}`,vocabulary:[vocab[target]],difficulty:pool==='practice'?1:2,suitableKinds:kinds,expectedStructure:concept==='A1.7'?'negation with niet':'question word finite-verb subject'};
}
function build(concept,practice,proof){return [...practice.map((row,i)=>sentence(concept,'practice',i,row)),...proof.map((row,i)=>sentence(concept,'proof',i,row))]}
const negationPractice=[
 ['Ik werk vandaag niet.','I am not working today.','werken',1,['werk','werkt','werken'],'Ik','niet'],
 ['Jij bent niet moe.','You are not tired.','zijn',1,['ben','bent','is','zijn'],'Jij','niet'],
 ['Hij woont niet in Utrecht.','He does not live in Utrecht.','wonen',1,['woon','woont','wonen'],'Hij','niet'],
 ['Zij komt morgen niet.','She is not coming tomorrow.','komen',1,['kom','komt','komen'],'Zij','niet'],
 ['Wij lezen het boek niet.','We are not reading the book.','lezen',1,['lees','leest','lezen'],'Wij','niet'],
 ['Jullie werken zondag niet.','You are not working on Sunday.','werken',1,['werk','werkt','werken'],'Jullie','niet'],
 ['De winkel is vandaag niet open.','The shop is not open today.','zijn',2,['ben','bent','is','zijn'],'De winkel','niet'],
 ['Mijn fiets is niet nieuw.','My bicycle is not new.','zijn',2,['ben','bent','is','zijn'],'Mijn fiets','niet'],
 ['Ik spreek niet snel.','I do not speak quickly.','spreken',1,['spreek','spreekt','spreken'],'Ik','niet'],
 ['Wij gaan vanavond niet.','We are not going tonight.','gaan',1,['ga','gaat','gaan'],'Wij','niet']
];
const negationProof=[
 ['Ik ben vandaag niet thuis.','I am not at home today.','zijn',1,['ben','bent','is','zijn'],'Ik','niet'],
 ['Jij werkt morgen niet.','You are not working tomorrow.','werken',1,['werk','werkt','werken'],'Jij','niet'],
 ['Hij is niet boos.','He is not angry.','zijn',1,['ben','bent','is','zijn'],'Hij','niet'],
 ['Zij woont niet in Amsterdam.','She does not live in Amsterdam.','wonen',1,['woon','woont','wonen'],'Zij','niet'],
 ['Wij eten vanavond niet thuis.','We are not eating at home tonight.','eten',1,['eet','eten'],'Wij','niet'],
 ['Jullie komen zaterdag niet.','You are not coming on Saturday.','komen',1,['kom','komt','komen'],'Jullie','niet'],
 ['De trein is niet laat.','The train is not late.','zijn',2,['ben','bent','is','zijn'],'De trein','niet'],
 ['Het water is niet koud.','The water is not cold.','zijn',2,['ben','bent','is','zijn'],'Het water','niet'],
 ['Mijn broer werkt hier niet.','My brother does not work here.','werken',2,['werk','werkt','werken'],'Mijn broer','niet'],
 ['Onze leraar spreekt niet langzaam.','Our teacher does not speak slowly.','spreken',2,['spreek','spreekt','spreken'],'Onze leraar','niet'],
 ['Ik lees de krant niet.','I am not reading the newspaper.','lezen',1,['lees','leest','lezen'],'Ik','niet'],
 ['Jij hebt mijn tas niet.','You do not have my bag.','hebben',1,['heb','hebt','heeft','hebben'],'Jij','niet'],
 ['Hij drinkt zijn thee niet.','He is not drinking his tea.','drinken',1,['drink','drinkt','drinken'],'Hij','niet'],
 ['Zij koopt de jas niet.','She is not buying the coat.','kopen',1,['koop','koopt','kopen'],'Zij','niet'],
 ['Wij nemen de bus niet.','We are not taking the bus.','nemen',1,['neem','neemt','nemen'],'Wij','niet'],
 ['Jullie zien de film niet.','You are not watching the film.','zien',1,['zie','ziet','zien'],'Jullie','niet'],
 ['De deur is niet dicht.','The door is not closed.','zijn',2,['ben','bent','is','zijn'],'De deur','niet'],
 ['Het station is niet ver.','The station is not far away.','zijn',2,['ben','bent','is','zijn'],'Het station','niet'],
 ['Mijn moeder is niet moe.','My mother is not tired.','zijn',2,['ben','bent','is','zijn'],'Mijn moeder','niet'],
 ['De kinderen slapen nog niet.','The children are not sleeping yet.','slapen',2,['slaap','slaapt','slapen'],'De kinderen','niet'],
 ['Ik ga maandag niet naar kantoor.','I am not going to the office on Monday.','gaan',1,['ga','gaat','gaan'],'Ik','niet'],
 ['Jij rijdt vandaag niet.','You are not driving today.','rijden',1,['rijd','rijdt','rijden'],'Jij','niet'],
 ['Hij wil de koffie niet.','He does not want the coffee.','willen',1,['wil','wilt','willen'],'Hij','niet'],
 ['Zij kan vanavond niet blijven.','She cannot stay tonight.','kunnen',1,['kan','kunt','kunnen'],'Zij','niet'],
 ['Wij moeten morgen niet werken.','We do not have to work tomorrow.','moeten',1,['moet','moeten'],'Wij','niet'],
 ['Jullie hoeven hier niet te wachten.','You do not need to wait here.','hoeven',1,['hoef','hoeft','hoeven'],'Jullie','niet'],
 ['De supermarkt sluit vandaag niet vroeg.','The supermarket is not closing early today.','sluiten',2,['sluit','sluiten'],'De supermarkt','niet'],
 ['Mijn telefoon werkt niet goed.','My phone does not work well.','werken',2,['werk','werkt','werken'],'Mijn telefoon','niet'],
 ['Het museum is maandag niet open.','The museum is not open on Monday.','zijn',2,['ben','bent','is','zijn'],'Het museum','niet'],
 ['Onze buren zijn vandaag niet thuis.','Our neighbours are not at home today.','zijn',2,['ben','bent','is','zijn'],'Onze buren','niet'],
 ['Ik begrijp die zin niet.','I do not understand that sentence.','begrijpen',1,['begrijp','begrijpt','begrijpen'],'Ik','niet'],
 ['Jij maakt het eten niet.','You are not making the food.','maken',1,['maak','maakt','maken'],'Jij','niet']
];
const questionPractice=[
 ['Waar woon jij?','Where do you live?','wonen',1,['woon','woont','wonen'],'jij','waar'],
 ['Wat lees jij?','What are you reading?','lezen',1,['lees','leest','lezen'],'jij','wat'],
 ['Wanneer werk jij?','When do you work?','werken',1,['werk','werkt','werken'],'jij','wanneer'],
 ['Hoe heet jij?','What is your name?','heten',1,['heet','heten'],'jij','hoe'],
 ['Wie is dat?','Who is that?','zijn',1,['ben','bent','is','zijn'],'dat','wie'],
 ['Waar werkt hij?','Where does he work?','werken',1,['werk','werkt','werken'],'hij','waar'],
 ['Wat koopt zij?','What is she buying?','kopen',1,['koop','koopt','kopen'],'zij','wat'],
 ['Wanneer komen jullie?','When are you coming?','komen',1,['kom','komt','komen'],'jullie','wanneer'],
 ['Hoe gaat het?','How is it going?','gaan',1,['ga','gaat','gaan'],'het','hoe'],
 ['Wie woont hier?','Who lives here?','wonen',1,['woon','woont','wonen'],'wie','wie']
];
const questionProof=[
 ['Waar woont zij?','Where does she live?','wonen',1,['woon','woont','wonen'],'zij','waar'],
 ['Waar wonen jullie?','Where do you live?','wonen',1,['woon','woont','wonen'],'jullie','waar'],
 ['Waar werkt jouw broer?','Where does your brother work?','werken',1,['werk','werkt','werken'],'jouw broer','waar'],
 ['Waar staat de fiets?','Where is the bicycle?','staan',1,['sta','staat','staan'],'de fiets','waar'],
 ['Waar ligt mijn tas?','Where is my bag?','liggen',1,['lig','ligt','liggen'],'mijn tas','waar'],
 ['Waar gaan wij heen?','Where are we going?','gaan',1,['ga','gaat','gaan'],'wij','waar'],
 ['Wat drink jij?','What are you drinking?','drinken',1,['drink','drinkt','drinken'],'jij','wat'],
 ['Wat maakt hij?','What is he making?','maken',1,['maak','maakt','maken'],'hij','wat'],
 ['Wat zoekt zij?','What is she looking for?','zoeken',1,['zoek','zoekt','zoeken'],'zij','wat'],
 ['Wat willen jullie?','What do you want?','willen',1,['wil','wilt','willen'],'jullie','wat'],
 ['Wat heeft de man?','What does the man have?','hebben',1,['heb','hebt','heeft','hebben'],'de man','wat'],
 ['Wat doet jouw moeder?','What does your mother do?','doen',1,['doe','doet','doen'],'jouw moeder','wat'],
 ['Wanneer begint de film?','When does the film start?','beginnen',1,['begin','begint','beginnen'],'de film','wanneer'],
 ['Wanneer vertrekt de trein?','When does the train leave?','vertrekken',1,['vertrek','vertrekt','vertrekken'],'de trein','wanneer'],
 ['Wanneer eten wij?','When are we eating?','eten',1,['eet','eten'],'wij','wanneer'],
 ['Wanneer komt jouw vriend?','When is your friend coming?','komen',1,['kom','komt','komen'],'jouw vriend','wanneer'],
 ['Wanneer sluit de winkel?','When does the shop close?','sluiten',1,['sluit','sluiten'],'de winkel','wanneer'],
 ['Wanneer gaan jullie naar huis?','When are you going home?','gaan',1,['ga','gaat','gaan'],'jullie','wanneer'],
 ['Hoe werkt dit?','How does this work?','werken',1,['werk','werkt','werken'],'dit','hoe'],
 ['Hoe gaat jouw dag?','How is your day going?','gaan',1,['ga','gaat','gaan'],'jouw dag','hoe'],
 ['Hoe komt hij naar school?','How does he get to school?','komen',1,['kom','komt','komen'],'hij','hoe'],
 ['Hoe maak jij koffie?','How do you make coffee?','maken',1,['maak','maakt','maken'],'jij','hoe'],
 ['Hoe laat begint het werk?','What time does work start?','beginnen',2,['begin','begint','beginnen'],'het werk','hoe'],
 ['Wie werkt vandaag?','Who is working today?','werken',1,['werk','werkt','werken'],'wie','wie'],
 ['Wie komt morgen?','Who is coming tomorrow?','komen',1,['kom','komt','komen'],'wie','wie'],
 ['Wie heeft de sleutel?','Who has the key?','hebben',1,['heb','hebt','heeft','hebben'],'wie','wie'],
 ['Wie leest de krant?','Who is reading the newspaper?','lezen',1,['lees','leest','lezen'],'wie','wie'],
 ['Wie woont naast jou?','Who lives next to you?','wonen',1,['woon','woont','wonen'],'wie','wie'],
 ['Wie maakt het eten?','Who is making the food?','maken',1,['maak','maakt','maken'],'wie','wie'],
 ['Waar wacht de bus?','Where is the bus waiting?','wachten',1,['wacht','wachten'],'de bus','waar'],
 ['Wat schrijft de leraar?','What is the teacher writing?','schrijven',1,['schrijf','schrijft','schrijven'],'de leraar','wat'],
 ['Waar is het station?','Where is the station?','zijn',1,['ben','bent','is','zijn'],'het station','waar']
];
export default {
 schemaVersion:1,id:'a1-core-expansion',version:'1.0.0',title:'A1 Core Expansion',levels:['A1'],
 concepts:[
  {id:'A1.7',title:'Negation with niet',level:'A1',prerequisites:['A1.6'],rule:'Use niet to negate an adjective, adverb, place/time phrase, definite noun, or the sentence as a whole. In a simple sentence, niet normally comes before the part you are negating or near the end when the whole action is negated.',example:'Het huis is niet groot.',translation:'The house is not big.',minPractice:40},
  {id:'A1.8',title:'Question words',level:'A1',prerequisites:['A1.7'],rule:'Put the question word first, then the finite verb, then the subject: waar woon jij? Use wie for who, wat for what, waar for where, wanneer for when, and hoe for how.',example:'Waar woon jij?',translation:'Where do you live?',minPractice:40}
 ],
 sentences:[...build('A1.7',negationPractice,negationProof),...build('A1.8',questionPractice,questionProof)]
};
