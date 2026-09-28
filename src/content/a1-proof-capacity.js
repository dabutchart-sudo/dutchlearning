import {hash,normalize,tokens} from '../engine/util.js';

// Bilingual patterns are versioned content. Each expands across four distinct
// subjects; wording and translation are never generated at runtime.
const subjects=[['Ik','I',0],['Hij','He',1],['Zij','She',1],['Wij','We',2]];
const questions=[['hij','he'],['zij','she'],['jouw vader','your father'],['jouw moeder','your mother']];
const possessives=[['Mijn','My'],['Jouw','Your'],['Zijn','His'],['Haar','Her']];
const kinds=['choice','typed'];
const rows=[];

function add(concept,nl,en,verb,verbIndex,subject,slots,forms){
 if(!slots&&['A1.10','A1.11','A1.16'].includes(concept))slots=[verbIndex,tokens(nl).length-1];
 rows.push({id:`${concept}-capacity-${hash(normalize(nl)).toString(36)}`,
  concept,pool:'proof',nl,en,verb,verbIndex,verbSlots:slots||[verbIndex],forms,subject,
  family:`${concept}:${verb}`,vocabulary:[],difficulty:2,suitableKinds:kinds,
  expectedStructure:'independent written proof'});
}
function declarative(concept,specs){
 for(const [verb,forms,tail,english] of specs)for(const [subject,gloss,index] of subjects){
  const nl=`${subject} ${forms[index]} ${tail}.`;
  const en=`${gloss} ${english[index]}.`;
  add(concept,nl,en,verb,1,subject,null,forms);
 }
}
function auxiliary(concept,auxiliaryVerb,forms,specs){
 for(const [tail,english,lexicalVerb] of specs)for(const [subject,gloss,index] of subjects){
  const nl=`${subject} ${forms[index]} ${tail}.`;
  const en=`${gloss} ${english[index]}.`;
  const verb=lexicalVerb||auxiliaryVerb;
  add(concept,nl,en,verb,1,subject,[1,tokens(nl).length-1],forms);
 }
}
function interrogative(concept,specs){
 for(const [opening,verb,finite,tail,english] of specs)for(const [subject,gloss] of questions){
  const nl=`${opening} ${finite} ${subject}${tail?` ${tail}`:''}?`;
  const en=`${english[0]} ${gloss} ${english[1]}?`;
  add(concept,nl,en,verb,1,subject);
 }
}

declarative('A1.7',[
 ['werken',['werk','werkt','werken'],'zaterdag niet',['am not working on Saturday','is not working on Saturday','are not working on Saturday']],
 ['komen',['kom','komt','komen'],'vandaag niet',['am not coming today','is not coming today','are not coming today']],
 ['wonen',['woon','woont','wonen'],'niet in Utrecht',['do not live in Utrecht','does not live in Utrecht','do not live in Utrecht']],
 ['lezen',['lees','leest','lezen'],'die brief niet',['am not reading that letter','is not reading that letter','are not reading that letter']],
 ['drinken',['drink','drinkt','drinken'],'geen thee',['do not drink tea','does not drink tea','do not drink tea']],
 ['kopen',['koop','koopt','kopen'],'die jas niet',['am not buying that coat','is not buying that coat','are not buying that coat']],
 ['eten',['eet','eet','eten'],'geen vis',['do not eat fish','does not eat fish','do not eat fish']],
 ['spreken',['spreek','spreekt','spreken'],'vandaag geen Nederlands',['am not speaking Dutch today','is not speaking Dutch today','are not speaking Dutch today']],
 ['slapen',['slaap','slaapt','slapen'],'vanavond niet thuis',['am not sleeping at home tonight','is not sleeping at home tonight','are not sleeping at home tonight']],
 ['komen',['kom','komt','komen'],'morgen niet naar het kantoor',['am not coming to the office tomorrow','is not coming to the office tomorrow','are not coming to the office tomorrow']],
 ['lezen',['lees','leest','lezen'],'deze vraag niet',['am not reading this question','is not reading this question','are not reading this question']],
 ['maken',['maak','maakt','maken'],'dat plan niet',['am not making that plan','is not making that plan','are not making that plan']],
 ['zoeken',['zoek','zoekt','zoeken'],'de sleutel niet',['am not looking for the key','is not looking for the key','are not looking for the key']],
 ['zien',['zie','ziet','zien'],'de bus niet',['do not see the bus','does not see the bus','do not see the bus']],
 ['leren',['leer','leert','leren'],'deze woorden niet',['am not learning these words','is not learning these words','are not learning these words']],
 ['zien',['zie','ziet','zien'],'de trein niet',['do not see the train','does not see the train','do not see the train']]
]);

interrogative('A1.8',[
 ['Waar','werken','werkt','vandaag',['Where does','work today']],
 ['Waar','werken','werkt','morgen',['Where does','work tomorrow']],
 ['Wanneer','komen','komt','naar school',['When does','come to school']],
 ['Wanneer','gaan','gaat','naar huis',['When does','go home']],
 ['Wat','lezen','leest','vandaag',['What does','read today']],
 ['Wat','kopen','koopt','in de winkel',['What does','buy in the shop']],
 ['Waar','wachten','wacht','op de bus',['Where does','wait for the bus']],
 ['Wanneer','eten','eet','thuis',['When does','eat at home']],
 ['Hoe','reizen','reist','naar Utrecht',['How does','travel to Utrecht']],
 ['Waar','drinken','drinkt','koffie',['Where does','drink coffee']],
 ['Wat','maken','maakt','morgen',['What does','make tomorrow']],
 ['Wanneer','leren','leert','Nederlands',['When does','study Dutch']],
 ['Waar','slapen','slaapt','vanavond',['Where does','sleep tonight']],
 ['Wat','zoeken','zoekt','in de tas',['What does','look for in the bag']],
 ['Wanneer','bellen','belt','de dokter',['When does','call the doctor']],
 ['Waar','spelen','speelt','vandaag',['Where does','play today']]
]);

auxiliary('A1.9','zijn',['ben','is','zijn'],[
 ['naar huis gegaan',['went home','went home','went home'],'gaan'],
 ['vroeg naar school gegaan',['went to school early','went to school early','went to school early'],'gaan'],
 ['in Utrecht gebleven',['stayed in Utrecht','stayed in Utrecht','stayed in Utrecht'],'blijven'],
 ['vandaag thuis gebleven',['stayed at home today','stayed at home today','stayed at home today'],'blijven'],
 ['laat gekomen',['arrived late','arrived late','arrived late'],'komen'],
 ['gisteren naar huis gekomen',['came home yesterday','came home yesterday','came home yesterday'],'komen'],
 ['om acht uur vertrokken',['left at eight','left at eight','left at eight'],'vertrekken'],
 ['na het ontbijt vertrokken',['left after breakfast','left after breakfast','left after breakfast'],'vertrekken'],
 ['bij het station aangekomen',['arrived at the station','arrived at the station','arrived at the station'],'aankomen'],
 ['vanavond aangekomen',['arrived tonight','arrived tonight','arrived tonight'],'aankomen'],
 ['weer beter geworden',['got better again','got better again','got better again'],'worden'],
 ['vroeg wakker geworden',['woke up early','woke up early','woke up early'],'worden'],
 ['naar Amsterdam gegaan',['went to Amsterdam','went to Amsterdam','went to Amsterdam'],'gaan'],
 ['na de les gebleven',['stayed after the lesson','stayed after the lesson','stayed after the lesson'],'blijven'],
 ['om negen uur gekomen',['arrived at nine','arrived at nine','arrived at nine'],'komen'],
 ['naar het hotel gegaan',['went to the hotel','went to the hotel','went to the hotel'],'gaan']
]);

declarative('A1.10',[
 ['opstaan',['sta','staat','staan'],'morgen vroeg op',['get up early tomorrow','gets up early tomorrow','get up early tomorrow']],
 ['opstaan',['sta','staat','staan'],'om acht uur op',['get up at eight','gets up at eight','get up at eight']],
 ['aankomen',['kom','komt','komen'],'vanavond aan',['arrive tonight','arrives tonight','arrive tonight']],
 ['aankomen',['kom','komt','komen'],'om negen uur aan',['arrive at nine','arrives at nine','arrive at nine']],
 ['meenemen',['neem','neemt','nemen'],'de jas mee',['bring the coat along','brings the coat along','bring the coat along']],
 ['meenemen',['neem','neemt','nemen'],'de tas mee',['bring the bag along','brings the bag along','bring the bag along']],
 ['opbellen',['bel','belt','bellen'],'mijn moeder op',['call my mother','calls my mother','call my mother']],
 ['opbellen',['bel','belt','bellen'],'de dokter op',['call the doctor','calls the doctor','call the doctor']],
 ['aandoen',['doe','doet','doen'],'de blauwe jas aan',['put on the blue coat','puts on the blue coat','put on the blue coat']],
 ['uitgaan',['ga','gaat','gaan'],'zaterdag uit',['go out on Saturday','goes out on Saturday','go out on Saturday']],
 ['terugkomen',['kom','komt','komen'],'morgen terug',['come back tomorrow','comes back tomorrow','come back tomorrow']],
 ['openmaken',['maak','maakt','maken'],'de deur open',['open the door','opens the door','open the door']],
 ['uitdoen',['doe','doet','doen'],'de schoenen uit',['take off the shoes','takes off the shoes','take off the shoes']],
 ['uitdoen',['doe','doet','doen'],'de jas uit',['take off the coat','takes off the coat','take off the coat']],
 ['terugbellen',['bel','belt','bellen'],'vanavond terug',['call back tonight','calls back tonight','call back tonight']],
 ['aandoen',['doe','doet','doen'],'de schoenen aan',['put on the shoes','puts on the shoes','put on the shoes']]
]);

declarative('A1.11',[
 ['kunnen',['kan','kan','kunnen'],'vandaag werken',['can work today','can work today','can work today']],
 ['kunnen',['kan','kan','kunnen'],'goed fietsen',['can cycle well','can cycle well','can cycle well']],
 ['kunnen',['kan','kan','kunnen'],'Nederlands leren',['can learn Dutch','can learn Dutch','can learn Dutch']],
 ['kunnen',['kan','kan','kunnen'],'de vraag lezen',['can read the question','can read the question','can read the question']],
 ['moeten',['moet','moet','moeten'],'morgen werken',['have to work tomorrow','has to work tomorrow','have to work tomorrow']],
 ['moeten',['moet','moet','moeten'],'de deur sluiten',['have to close the door','has to close the door','have to close the door']],
 ['moeten',['moet','moet','moeten'],'vroeg vertrekken',['have to leave early','has to leave early','have to leave early']],
 ['moeten',['moet','moet','moeten'],'de keuken opruimen',['have to tidy the kitchen','has to tidy the kitchen','have to tidy the kitchen']],
 ['willen',['wil','wil','willen'],'vanavond koken',['want to cook tonight','wants to cook tonight','want to cook tonight']],
 ['willen',['wil','wil','willen'],'een boek lezen',['want to read a book','wants to read a book','want to read a book']],
 ['willen',['wil','wil','willen'],'naar school gaan',['want to go to school','wants to go to school','want to go to school']],
 ['willen',['wil','wil','willen'],'koffie drinken',['want to drink coffee','wants to drink coffee','want to drink coffee']],
 ['mogen',['mag','mag','mogen'],'hier zitten',['may sit here','may sit here','may sit here']],
 ['mogen',['mag','mag','mogen'],'de fiets kopen',['may buy the bicycle','may buy the bicycle','may buy the bicycle']],
 ['mogen',['mag','mag','mogen'],'vandaag uitgaan',['may go out today','may go out today','may go out today']],
 ['kunnen',['kan','kan','kunnen'],'de dokter bellen',['can call the doctor','can call the doctor','can call the doctor']]
]);

function inversion(concept,specs){
 for(const [front,englishFront,verb,forms,tail,english] of specs)for(const [subject,gloss,index] of subjects){
  const nl=`${front} ${forms[index]} ${subject.toLowerCase()} ${tail}.`;
  const en=`${englishFront} ${gloss==='I'?'I':gloss.toLowerCase()} ${english[index]}.`;
  add(concept,nl,en,verb,tokens(front).length,subject.toLowerCase(),null,forms);
 }
}
inversion('A1.12',[
 ['Vandaag','Today','werken',['werk','werkt','werken'],'thuis',['work at home','works at home','work at home']],
 ['Morgen','Tomorrow','komen',['kom','komt','komen'],'vroeg',['come early','comes early','come early']],
 ['Vanavond','Tonight','eten',['eet','eet','eten'],'samen',['eat together','eats together','eat together']],
 ['Op maandag','On Monday','leren',['leer','leert','leren'],'Nederlands',['study Dutch','studies Dutch','study Dutch']],
 ['Na de les','After the lesson','gaan',['ga','gaat','gaan'],'naar huis',['go home','goes home','go home']],
 ['In Utrecht','In Utrecht','wonen',['woon','woont','wonen'],'bij het station',['live near the station','lives near the station','live near the station']],
 ['Op dinsdag','On Tuesday','fietsen',['fiets','fietst','fietsen'],'naar school',['cycle to school','cycles to school','cycle to school']],
 ['Op vrijdag','On Friday','kopen',['koop','koopt','kopen'],'brood',['buy bread','buys bread','buy bread']],
 ['Vandaag','Today','lezen',['lees','leest','lezen'],'de krant',['read the newspaper','reads the newspaper','read the newspaper']],
 ['Morgen','Tomorrow','bellen',['bel','belt','bellen'],'de dokter',['call the doctor','calls the doctor','call the doctor']],
 ['Vanavond','Tonight','drinken',['drink','drinkt','drinken'],'thee',['drink tea','drinks tea','drink tea']],
 ['In Amsterdam','In Amsterdam','werken',['werk','werkt','werken'],'morgen',['work tomorrow','works tomorrow','work tomorrow']],
 ['Na het ontbijt','After breakfast','vertrekken',['vertrek','vertrekt','vertrekken'],'vroeg',['leave early','leaves early','leave early']],
 ['Op zaterdag','On Saturday','spelen',['speel','speelt','spelen'],'in het park',['play in the park','plays in the park','play in the park']],
 ['Vandaag','Today','maken',['maak','maakt','maken'],'een plan',['make a plan','makes a plan','make a plan']],
 ['Morgen','Tomorrow','wachten',['wacht','wacht','wachten'],'bij de deur',['wait by the door','waits by the door','wait by the door']]
]);

auxiliary('A1.13','hebben',['heb','heeft','hebben'],[
 ['koffie gedronken',['drank coffee','drank coffee','drank coffee']],
 ['de krant gelezen',['read the newspaper','read the newspaper','read the newspaper']],
 ['brood gekocht',['bought bread','bought bread','bought bread']],
 ['thuis gewerkt',['worked at home','worked at home','worked at home']],
 ['soep gemaakt',['made soup','made soup','made soup']],
 ['de dokter gebeld',['called the doctor','called the doctor','called the doctor']],
 ['de vraag gehoord',['heard the question','heard the question','heard the question']],
 ['de sleutel gevonden',['found the key','found the key','found the key']],
 ['Nederlands geleerd',['studied Dutch','studied Dutch','studied Dutch']],
 ['de brief geschreven',['wrote the letter','wrote the letter','wrote the letter']],
 ['de film gezien',['saw the film','saw the film','saw the film']],
 ['gisteren gekookt',['cooked yesterday','cooked yesterday','cooked yesterday']],
 ['samen gedanst',['danced together','danced together','danced together']],
 ['de tas gekocht',['bought the bag','bought the bag','bought the bag']],
 ['mijn moeder gesproken',['spoke to my mother','spoke to my mother','spoke to my mother']],
 ['een plan gemaakt',['made a plan','made a plan','made a plan']]
]);

function yesNo(concept,specs){
 for(const [verb,finite,tail,english] of specs)for(const [subject,gloss] of questions){
  const nl=`${finite} ${subject} ${tail}?`;
  const en=`${english[0]} ${gloss} ${english[1]}?`;
  add(concept,nl,en,verb,0,subject);
 }
}
yesNo('A1.14',[
 ['werken','Werkt','vandaag',['Does','work today']],
 ['wonen','Woont','in Utrecht',['Does','live in Utrecht']],
 ['komen','Komt','morgen',['Is','coming tomorrow']],
 ['gaan','Gaat','naar school',['Is','going to school']],
 ['lezen','Leest','de krant',['Is','reading the newspaper']],
 ['kopen','Koopt','een fiets',['Is','buying a bicycle']],
 ['eten','Eet','vanavond thuis',['Is','eating at home tonight']],
 ['drinken','Drinkt','koffie',['Does','drink coffee']],
 ['leren','Leert','Nederlands',['Is','studying Dutch']],
 ['slapen','Slaapt','hier',['Is','sleeping here']],
 ['bellen','Belt','de dokter',['Is','calling the doctor']],
 ['wachten','Wacht','bij de deur',['Is','waiting by the door']],
 ['maken','Maakt','een plan',['Is','making a plan']],
 ['zien','Ziet','de trein',['Does','see the train']],
 ['hebben','Heeft','een hond',['Does','have a dog']],
 ['zijn','Is','thuis',['Is','at home']],
 ['begrijpen','Begrijpt','de vraag',['Does','understand the question']],
 ['spreken','Spreekt','Nederlands',['Does','speak Dutch']]
]);

declarative('A1.15',[
 ['werken',['werk','werkt','werken'],'vandaag niet',['am not working today','is not working today','are not working today']],
 ['wonen',['woon','woont','wonen'],'niet in Utrecht',['do not live in Utrecht','does not live in Utrecht','do not live in Utrecht']],
 ['lezen',['lees','leest','lezen'],'die brief niet',['am not reading that letter','is not reading that letter','are not reading that letter']],
 ['drinken',['drink','drinkt','drinken'],'geen melk',['do not drink milk','does not drink milk','do not drink milk']],
 ['kopen',['koop','koopt','kopen'],'geen fiets',['am not buying a bicycle','is not buying a bicycle','are not buying a bicycle']],
 ['eten',['eet','eet','eten'],'geen vlees',['do not eat meat','does not eat meat','do not eat meat']],
 ['spreken',['spreek','spreekt','spreken'],'geen Frans',['do not speak French','does not speak French','do not speak French']],
 ['komen',['kom','komt','komen'],'morgen niet',['am not coming tomorrow','is not coming tomorrow','are not coming tomorrow']],
 ['gaan',['ga','gaat','gaan'],'niet naar school',['am not going to school','is not going to school','are not going to school']],
 ['begrijpen',['begrijp','begrijpt','begrijpen'],'de vraag niet',['do not understand the question','does not understand the question','do not understand the question']],
 ['maken',['maak','maakt','maken'],'geen plan',['am not making a plan','is not making a plan','are not making a plan']],
 ['hebben',['heb','heeft','hebben'],'geen tijd',['do not have time','does not have time','do not have time']],
 ['zoeken',['zoek','zoekt','zoeken'],'de sleutel niet',['am not looking for the key','is not looking for the key','are not looking for the key']],
 ['zien',['zie','ziet','zien'],'de bus niet',['do not see the bus','does not see the bus','do not see the bus']],
 ['zien',['zie','ziet','zien'],'de trein niet',['do not see the train','does not see the train','do not see the train']],
 ['slapen',['slaap','slaapt','slapen'],'vanavond niet thuis',['am not sleeping at home tonight','is not sleeping at home tonight','are not sleeping at home tonight']]
]);
declarative('A1.15',[
 ['lezen',['lees','leest','lezen'],'de krant vandaag niet',['am not reading the newspaper today','is not reading the newspaper today','are not reading the newspaper today']],
 ['kopen',['koop','koopt','kopen'],'de fiets morgen niet',['am not buying the bicycle tomorrow','is not buying the bicycle tomorrow','are not buying the bicycle tomorrow']],
 ['eten',['eet','eet','eten'],'vanavond geen brood',['am not eating bread tonight','is not eating bread tonight','are not eating bread tonight']],
 ['drinken',['drink','drinkt','drinken'],'vandaag geen thee',['am not drinking tea today','is not drinking tea today','are not drinking tea today']],
 ['hebben',['heb','heeft','hebben'],'morgen geen les',['do not have a lesson tomorrow','does not have a lesson tomorrow','do not have a lesson tomorrow']],
 ['werken',['werk','werkt','werken'],'deze week niet thuis',['am not working at home this week','is not working at home this week','are not working at home this week']],
 ['spreken',['spreek','spreekt','spreken'],'nu geen Nederlands',['am not speaking Dutch now','is not speaking Dutch now','are not speaking Dutch now']],
 ['gaan',['ga','gaat','gaan'],'morgen niet naar de markt',['am not going to the market tomorrow','is not going to the market tomorrow','are not going to the market tomorrow']],
 ['kopen',['koop','koopt','kopen'],'geen brood voor mijn moeder',['am not buying bread for my mother','is not buying bread for my mother','are not buying bread for my mother']],
 ['wonen',['woon','woont','wonen'],'niet bij de school',['do not live near the school','does not live near the school','do not live near the school']],
 ['begrijpen',['begrijp','begrijpt','begrijpen'],'deze woorden niet',['do not understand these words','does not understand these words','do not understand these words']],
 ['maken',['maak','maakt','maken'],'vandaag geen soep',['am not making soup today','is not making soup today','are not making soup today']]
]);

declarative('A1.16',[
 ['opstaan',['sta','staat','staan'],'om zeven uur op',['get up at seven','gets up at seven','get up at seven']],
 ['opstaan',['sta','staat','staan'],'morgen vroeg op',['get up early tomorrow','gets up early tomorrow','get up early tomorrow']],
 ['aankomen',['kom','komt','komen'],'om acht uur aan',['arrive at eight','arrives at eight','arrive at eight']],
 ['aankomen',['kom','komt','komen'],'vanavond aan',['arrive tonight','arrives tonight','arrive tonight']],
 ['meenemen',['neem','neemt','nemen'],'de boeken mee',['bring the books along','brings the books along','bring the books along']],
 ['meenemen',['neem','neemt','nemen'],'de jas mee',['bring the coat along','brings the coat along','bring the coat along']],
 ['opbellen',['bel','belt','bellen'],'de dokter op',['call the doctor','calls the doctor','call the doctor']],
 ['opbellen',['bel','belt','bellen'],'mijn moeder op',['call my mother','calls my mother','call my mother']],
 ['aandoen',['doe','doet','doen'],'de jas aan',['put on the coat','puts on the coat','put on the coat']],
 ['uitgaan',['ga','gaat','gaan'],'vanavond uit',['go out tonight','goes out tonight','go out tonight']],
 ['terugkomen',['kom','komt','komen'],'morgen terug',['come back tomorrow','comes back tomorrow','come back tomorrow']],
 ['openmaken',['maak','maakt','maken'],'de deur open',['open the door','opens the door','open the door']],
 ['opruimen',['ruim','ruimt','ruimen'],'de keuken op',['tidy the kitchen','tidies the kitchen','tidy the kitchen']],
 ['uitdoen',['doe','doet','doen'],'de schoenen uit',['take off the shoes','takes off the shoes','take off the shoes']],
 ['terugbellen',['bel','belt','bellen'],'morgen terug',['call back tomorrow','calls back tomorrow','call back tomorrow']],
 ['aandoen',['doe','doet','doen'],'de schoenen aan',['put on the shoes','puts on the shoes','put on the shoes']]
]);
declarative('A1.16',[
 ['opstaan',['sta','staat','staan'],'op zaterdag vroeg op',['get up early on Saturday','gets up early on Saturday','get up early on Saturday']],
 ['opstaan',['sta','staat','staan'],'na het ontbijt op',['get up after breakfast','gets up after breakfast','get up after breakfast']],
 ['aankomen',['kom','komt','komen'],'morgen bij het station aan',['arrive at the station tomorrow','arrives at the station tomorrow','arrive at the station tomorrow']],
 ['aankomen',['kom','komt','komen'],'na de les aan',['arrive after the lesson','arrives after the lesson','arrive after the lesson']],
 ['meenemen',['neem','neemt','nemen'],'de boeken morgen mee',['bring the books along tomorrow','brings the books along tomorrow','bring the books along tomorrow']],
 ['meenemen',['neem','neemt','nemen'],'de bloemen naar huis mee',['take the flowers home','takes the flowers home','take the flowers home']],
 ['opbellen',['bel','belt','bellen'],'de dokter morgenmiddag op',['call the doctor tomorrow afternoon','calls the doctor tomorrow afternoon','call the doctor tomorrow afternoon']],
 ['opbellen',['bel','belt','bellen'],'mijn vader morgen op',['call my father tomorrow','calls my father tomorrow','call my father tomorrow']],
 ['aandoen',['doe','doet','doen'],'de jas vandaag aan',['put on the coat today','puts on the coat today','put on the coat today']],
 ['aandoen',['doe','doet','doen'],'de schoenen morgen aan',['put on the shoes tomorrow','puts on the shoes tomorrow','put on the shoes tomorrow']],
 ['terugkomen',['kom','komt','komen'],'na de les terug',['come back after the lesson','comes back after the lesson','come back after the lesson']],
 ['terugkomen',['kom','komt','komen'],'zaterdag terug',['come back on Saturday','comes back on Saturday','come back on Saturday']],
 ['openmaken',['maak','maakt','maken'],'het raam vandaag open',['open the window today','opens the window today','open the window today']],
 ['openmaken',['maak','maakt','maken'],'de winkel morgen open',['open the shop tomorrow','opens the shop tomorrow','open the shop tomorrow']],
 ['uitgaan',['ga','gaat','gaan'],'op vrijdagavond uit',['go out on Friday evening','goes out on Friday evening','go out on Friday evening']],
 ['terugbellen',['bel','belt','bellen'],'na de les terug',['call back after the lesson','calls back after the lesson','call back after the lesson']]
]);

declarative('A1.17',[
 ['hebben',['heb','heeft','hebben'],'een boek',['have a book','has a book','have a book']],
 ['hebben',['heb','heeft','hebben'],'de sleutel',['have the key','has the key','have the key']],
 ['hebben',['heb','heeft','hebben'],'twee fietsen',['have two bicycles','has two bicycles','have two bicycles']],
 ['hebben',['heb','heeft','hebben'],'drie boeken',['have three books','has three books','have three books']],
 ['hebben',['heb','heeft','hebben'],'een jas',['have a coat','has a coat','have a coat']],
 ['kopen',['koop','koopt','kopen'],'een appel',['buy an apple','buys an apple','buy an apple']],
 ['kopen',['koop','koopt','kopen'],'het brood',['buy the bread','buys the bread','buy the bread']],
 ['kopen',['koop','koopt','kopen'],'vier bananen',['buy four bananas','buys four bananas','buy four bananas']],
 ['kopen',['koop','koopt','kopen'],'de kaarten',['buy the cards','buys the cards','buy the cards']],
 ['kopen',['koop','koopt','kopen'],'een kaartje',['buy a ticket','buys a ticket','buy a ticket']],
 ['lezen',['lees','leest','lezen'],'een brief',['read a letter','reads a letter','read a letter']],
 ['lezen',['lees','leest','lezen'],'de krant',['read the newspaper','reads the newspaper','read the newspaper']],
 ['lezen',['lees','leest','lezen'],'twee boeken',['read two books','reads two books','read two books']],
 ['zien',['zie','ziet','zien'],'het huis',['see the house','sees the house','see the house']],
 ['zien',['zie','ziet','zien'],'de kinderen',['see the children','sees the children','see the children']],
 ['zoeken',['zoek','zoekt','zoeken'],'de sleutels',['look for the keys','looks for the keys','look for the keys']]
]);
declarative('A1.17',[
 ['hebben',['heb','heeft','hebben'],'de boeken voor de les',['have the books for the lesson','has the books for the lesson','have the books for the lesson']],
 ['hebben',['heb','heeft','hebben'],'een nieuwe fiets',['have a new bicycle','has a new bicycle','have a new bicycle']],
 ['kopen',['koop','koopt','kopen'],'de appels voor mijn moeder',['buy the apples for my mother','buys the apples for my mother','buy the apples for my mother']],
 ['kopen',['koop','koopt','kopen'],'een nieuwe jas',['buy a new coat','buys a new coat','buy a new coat']],
 ['lezen',['lees','leest','lezen'],'de brieven thuis',['read the letters at home','reads the letters at home','read the letters at home']],
 ['lezen',['lees','leest','lezen'],'het boek in de trein',['read the book on the train','reads the book on the train','read the book on the train']],
 ['zien',['zie','ziet','zien'],'de huizen bij het station',['see the houses near the station','sees the houses near the station','see the houses near the station']],
 ['zoeken',['zoek','zoekt','zoeken'],'een kaartje voor de trein',['look for a ticket for the train','looks for a ticket for the train','look for a ticket for the train']]
]);

for(const [noun,adjective,englishNoun,englishAdjective] of [
 ['huis','klein','house','small'],['huis','groot','house','big'],['fiets','nieuw','bicycle','new'],
 ['fiets','rood','bicycle','red'],['jas','warm','coat','warm'],['jas','blauw','coat','blue'],
 ['tas','zwaar','bag','heavy'],['tas','mooi','bag','beautiful'],['kamer','licht','room','bright'],
 ['kamer','groot','room','big'],['auto','oud','car','old'],['auto','zwart','car','black'],
 ['boek','interessant','book','interesting'],['boek','nieuw','book','new'],
 ['hond','klein','dog','small'],['hond','lief','dog','sweet']
])for(const [possessive,englishPossessive] of possessives){
 const nl=`${possessive} ${noun} is ${adjective}.`;
 const en=`${englishPossessive} ${englishNoun} is ${englishAdjective}.`;
 add('A1.18',nl,en,'zijn',2,`${possessive} ${noun}`);
}
for(const [possessive,englishPossessive] of possessives){
 add('A1.18',`${possessive} jas is nieuw.`,`${englishPossessive} coat is new.`,'zijn',2,`${possessive} jas`);
}

declarative('A1.19',[
 ['kopen',['koop','koopt','kopen'],'twee broodjes',['buy two bread rolls','buys two bread rolls','buy two bread rolls']],
 ['kopen',['koop','koopt','kopen'],'drie appels',['buy three apples','buys three apples','buy three apples']],
 ['kopen',['koop','koopt','kopen'],'vier bananen',['buy four bananas','buys four bananas','buy four bananas']],
 ['kopen',['koop','koopt','kopen'],'vijf broden',['buy five loaves of bread','buys five loaves of bread','buy five loaves of bread']],
 ['kopen',['koop','koopt','kopen'],'twee kaartjes',['buy two tickets','buys two tickets','buy two tickets']],
 ['kopen',['koop','koopt','kopen'],'een kilo kaas',['buy a kilogram of cheese','buys a kilogram of cheese','buy a kilogram of cheese']],
 ['kopen',['koop','koopt','kopen'],'een kilo tomaten',['buy a kilogram of tomatoes','buys a kilogram of tomatoes','buy a kilogram of tomatoes']],
 ['nemen',['neem','neemt','nemen'],'een liter melk',['take a litre of milk','takes a litre of milk','take a litre of milk']],
 ['nemen',['neem','neemt','nemen'],'twee koppen koffie',['take two cups of coffee','takes two cups of coffee','take two cups of coffee']],
 ['nemen',['neem','neemt','nemen'],'drie flessen water',['take three bottles of water','takes three bottles of water','take three bottles of water']],
 ['hebben',['heb','heeft','hebben'],'twintig euro',['have twenty euros','has twenty euros','have twenty euros']],
 ['hebben',['heb','heeft','hebben'],'vijftig euro',['have fifty euros','has fifty euros','have fifty euros']],
 ['hebben',['heb','heeft','hebben'],'zestien eieren',['have sixteen eggs','has sixteen eggs','have sixteen eggs']],
 ['willen',['wil','wil','willen'],'een halve kilo kaas',['want half a kilogram of cheese','wants half a kilogram of cheese','want half a kilogram of cheese']],
 ['willen',['wil','wil','willen'],'twee koffies',['want two coffees','wants two coffees','want two coffees']],
 ['willen',['wil','wil','willen'],'drie broodjes',['want three bread rolls','wants three bread rolls','want three bread rolls']]
]);

declarative('A1.20',[
 ['werken',['werk','werkt','werken'],'op maandag',['work on Monday','works on Monday','work on Monday']],
 ['werken',['werk','werkt','werken'],'op dinsdag',['work on Tuesday','works on Tuesday','work on Tuesday']],
 ['werken',['werk','werkt','werken'],'in september',['work in September','works in September','work in September']],
 ['komen',['kom','komt','komen'],'om acht uur',['come at eight','comes at eight','come at eight']],
 ['komen',['kom','komt','komen'],'om half tien',['come at half past nine','comes at half past nine','come at half past nine']],
 ['komen',['kom','komt','komen'],'op donderdag',['come on Thursday','comes on Thursday','come on Thursday']],
 ['gaan',['ga','gaat','gaan'],'op vrijdag naar school',['go to school on Friday','goes to school on Friday','go to school on Friday']],
 ['gaan',['ga','gaat','gaan'],'om negen uur naar huis',['go home at nine','goes home at nine','go home at nine']],
 ['gaan',['ga','gaat','gaan'],'in mei naar Utrecht',['go to Utrecht in May','goes to Utrecht in May','go to Utrecht in May']],
 ['vertrekken',['vertrek','vertrekt','vertrekken'],'om elf uur',['leave at eleven','leaves at eleven','leave at eleven']],
 ['vertrekken',['vertrek','vertrekt','vertrekken'],'in augustus',['leave in August','leaves in August','leave in August']],
 ['leren',['leer','leert','leren'],'op zaterdag Nederlands',['study Dutch on Saturday','studies Dutch on Saturday','study Dutch on Saturday']],
 ['bellen',['bel','belt','bellen'],'de dokter op woensdag',['call the doctor on Wednesday','calls the doctor on Wednesday','call the doctor on Wednesday']],
 ['wachten',['wacht','wacht','wachten'],'tot tien uur',['wait until ten','waits until ten','wait until ten']],
 ['koken',['kook','kookt','koken'],'op zondag',['cook on Sunday','cooks on Sunday','cook on Sunday']],
 ['lezen',['lees','leest','lezen'],'om zeven uur',['read at seven','reads at seven','read at seven']]
]);

declarative('A1.21',[
 ['wonen',['woon','woont','wonen'],'in Utrecht',['live in Utrecht','lives in Utrecht','live in Utrecht']],
 ['wonen',['woon','woont','wonen'],'in Amsterdam',['live in Amsterdam','lives in Amsterdam','live in Amsterdam']],
 ['wonen',['woon','woont','wonen'],'bij het station',['live near the station','lives near the station','live near the station']],
 ['gaan',['ga','gaat','gaan'],'naar school',['go to school','goes to school','go to school']],
 ['gaan',['ga','gaat','gaan'],'naar de markt',['go to the market','goes to the market','go to the market']],
 ['gaan',['ga','gaat','gaan'],'naar de bibliotheek',['go to the library','goes to the library','go to the library']],
 ['komen',['kom','komt','komen'],'uit Groningen',['come from Groningen','comes from Groningen','come from Groningen']],
 ['komen',['kom','komt','komen'],'uit Amsterdam',['come from Amsterdam','comes from Amsterdam','come from Amsterdam']],
 ['werken',['werk','werkt','werken'],'bij de bakker',['work at the bakery','works at the bakery','work at the bakery']],
 ['werken',['werk','werkt','werken'],'bij de school',['work at the school','works at the school','work at the school']],
 ['zitten',['zit','zit','zitten'],'op de stoel',['sit on the chair','sits on the chair','sit on the chair']],
 ['staan',['sta','staat','staan'],'bij de deur',['stand by the door','stands by the door','stand by the door']],
 ['staan',['sta','staat','staan'],'in de keuken',['stand in the kitchen','stands in the kitchen','stand in the kitchen']],
 ['zitten',['zit','zit','zitten'],'in de keuken',['sit in the kitchen','sits in the kitchen','sit in the kitchen']],
 ['zetten',['zet','zet','zetten'],'de tas bij de deur',['put the bag by the door','puts the bag by the door','put the bag by the door']],
 ['wachten',['wacht','wacht','wachten'],'bij het restaurant',['wait by the restaurant','waits by the restaurant','wait by the restaurant']]
]);

export default {schemaVersion:1,id:'a1-proof-capacity',version:'1.0.0',title:'A1 Fresh Proof Capacity',levels:['A1'],concepts:[],sentences:rows};
