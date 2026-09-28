import {tokens} from '../engine/util.js';

// Extra, independently phrased contexts for words that otherwise first appear
// in scored proof. Keep these as reviewed content, rather than deriving a near
// copy of a proof sentence at runtime.
const contexts={
 'A1.7':[
  ['Mijn broer spreekt niet goed Nederlands.','My brother does not speak Dutch well.','spreken',2,'Mijn broer'],
  ['Mijn moeder begrijpt deze woorden niet.','My mother does not understand these words.','begrijpen',2,'Mijn moeder'],
  ['Ik begrijp deze zin niet.','I do not understand this sentence.','begrijpen',1,'Ik'],
  ['Mijn zus wil zaterdag niet blijven.','My sister does not want to stay on Saturday.','willen',2,'Mijn zus',[2,6]],
  ['Wij hoeven vandaag niet te werken.','We do not need to work today.','hoeven',1,'Wij',[1,5]],
  ['De buren wonen hier niet.','The neighbours do not live here.','wonen',2,'De buren'],
  ['De bus stopt maandag niet.','The bus does not stop on Monday.','stoppen',2,'De bus'],
  ['De film is niet goed.','The film is not good.','zijn',2,'De film'],
  ['Ik kom woensdag niet laat.','I am not arriving late on Wednesday.','komen',1,'Ik'],
  ['Het is vandaag niet koud.','It is not cold today.','zijn',1,'Het'],
  ['De deur is vandaag niet dicht.','The door is not closed today.','zijn',2,'De deur'],
  ['Amsterdam is niet ver.','Amsterdam is not far away.','zijn',1,'Amsterdam'],
  ['Wij gaan vandaag niet naar het kantoor.','We are not going to the office today.','gaan',1,'Wij'],
  ['Mijn ouders eten de vis niet.','My parents do not eat the fish.','eten',2,'Mijn ouders'],
  ['Onze vrienden komen niet vroeg.','Our friends are not coming early.','komen',2,'Onze vrienden'],
  ['Dat is niet goed.','That is not good.','zijn',1,'Dat'],
  ['De ingang is niet hier.','The entrance is not here.','zijn',2,'De ingang'],
  ['Deze week werk ik niet.','I am not working this week.','werken',2,'ik'],
  ['Ik werk niet met mijn broer.','I do not work with my brother.','werken',1,'Ik'],
  ['Ik ga nog niet naar de supermarkt.','I am not going to the supermarket yet.','gaan',1,'Ik'],
  ['Wij willen vandaag niet spreken.','We do not want to speak today.','willen',1,'Wij',[1,5]]
 ],
 'A1.8':[
  ['Waar spreekt de student Nederlands?','Where does the student speak Dutch?','spreken',1,'de student'],
  ['Wat doet jouw vriend vandaag?','What is your friend doing today?','doen',1,'jouw vriend'],
  ['Wanneer gaat de familie naar school?','When is the family going to school?','gaan',1,'de familie'],
  ['Waar gaat de dokter heen?','Where is the doctor going?','gaan',1,'de dokter'],
  ['Wie koopt dit voor jou?','Who is buying this for you?','kopen',1,'wie'],
  ['Waar is de groente vandaag?','Where are the vegetables today?','zijn',1,'de groente'],
  ['Wat koopt de student de volgende dag?','What does the student buy the next day?','kopen',1,'de student'],
  ['Wat staat naast je fiets?','What is standing next to your bicycle?','staan',1,'Wat'],
  ['Wie gaat vandaag mee?','Who is coming along today?','gaan',1,'Wie']
 ],
 'A1.9':[
  ['Ik ben gisteren met mijn zus naar huis gegaan.','I went home with my sister yesterday.','gaan',1,'Ik',[1,9]],
  ['Wij zijn samen buiten gebleven.','We stayed outside together.','blijven',1,'Wij',[1,4]],
  ['Hij is veilig naar binnen gegaan.','He went inside safely.','gaan',1,'Hij',[1,6]],
  ['Zij is na negen uur thuisgekomen.','She came home after nine o’clock.','komen',1,'Zij',[1,6]],
  ['Ik ben alleen naar bed gegaan.','I went to bed alone.','gaan',1,'Ik',[1,6]],
  ['De gasten zijn lang in Utrecht gebleven.','The guests stayed in Utrecht for a long time.','blijven',2,'De gasten',[2,4]],
  ['Wij zijn om half zes vertrokken.','We left at half past five.','vertrekken',1,'Wij',[1,6]],
  ['Hij is zonder jas naar huis gegaan.','He went home without a coat.','gaan',1,'Hij',[1,8]],
  ['Zij is tot tien uur gebleven.','She stayed until ten o’clock.','blijven',1,'Zij',[1,6]],
  ['Mijn broer is heel vroeg gekomen.','My brother came very early.','komen',2,'Mijn broer',[2,5]],
  ['Hij is weer beter geworden.','He got better again.','worden',1,'Hij'],
  ['Wij zijn de hele avond in Utrecht gebleven.','We stayed in Utrecht the whole evening.','blijven',1,'Wij']
 ],
 'A1.10':[
  ['Wij staan elke ochtend om vijf uur op.','We get up at five o’clock every morning.','opstaan',1,'Wij',[1,8]],
  ['Ik doe mijn blauwe jas straks aan.','I will put on my blue coat soon.','aandoen',1,'Ik',[1,7]],
  ['Zij ruimt de tafel vanmiddag op.','She clears the table this afternoon.','opruimen',1,'Zij',[1,6]],
  ['Wij wassen elke dag de fles af.','We wash the bottle every day.','afwassen',1,'Wij',[1,7]],
  ['Hij komt na de lunch terug.','He comes back after lunch.','terugkomen',1,'Hij',[1,6]],
  ['Zij maakt eerst de nieuwe fles open.','She opens the new bottle first.','openmaken',1,'Zij',[1,7]],
  ['Wij ruimen de keuken vaak op.','We often tidy the kitchen.','opruimen',1,'Wij',[1,6]],
  ['Ik neem de bloemen mee.','I take the flowers along.','meenemen',1,'Ik',[1,5]],
  ['Jullie bellen na drie dagen terug.','You call back after three days.','terugbellen',1,'Jullie',[1,6]],
  ['Ik doe vrijdagavond de deur dicht.','I close the door on Friday evening.','dichtdoen',1,'Ik',[1,5]]
 ],
 'A1.11':[
  ['Jij kunt nu fietsen.','You can cycle now.','kunnen',1,'Jij',[1,3]],
  ['Wij moeten de keuken opruimen.','We have to tidy the kitchen.','moeten',1,'Wij',[1,4]],
  ['Jij wilt vandaag wandelen.','You want to walk today.','willen',1,'Jij',[1,3]],
  ['Zij mag hier niet parkeren.','She may not park here.','mogen',1,'Zij',[1,4]],
  ['Ik wil een koekje eten.','I want to eat a biscuit.','willen',1,'Ik',[1,5]],
  ['Wij moeten nu stoppen.','We have to stop now.','moeten',1,'Wij',[1,4]],
  ['Jij kunt de deur openmaken.','You can open the door.','kunnen',1,'Jij',[1,5]],
  ['Hij mag zijn jas aandoen.','He may put on his coat.','mogen',1,'Hij',[1,5]],
  ['Zij wil vanavond uitgaan.','She wants to go out tonight.','willen',1,'Zij',[1,4]],
  ['Wij kunnen de nieuwe tafel daar zetten.','We can put the new table there.','kunnen',1,'Wij',[1,7]],
  ['Ik wil langer kijken.','I want to watch for longer.','willen',1,'Ik',[1,3]],
  ['Hij moet meer werken.','He has to work more.','moeten',1,'Hij',[1,4]],
  ['Wij willen morgen vroeg opstaan.','We want to get up early tomorrow.','willen',1,'Wij']
 ],
 'A1.12':[
  ['Dinsdag fietst mijn zus naar school.','On Tuesday my sister cycles to school.','fietsen',1,'mijn zus'],
  ['Vrijdag wandelen wij na de lunch.','On Friday we walk after lunch.','wandelen',1,'wij'],
  ['Vandaag blijft mijn broer in de keuken.','Today my brother stays in the kitchen.','blijven',1,'mijn broer'],
  ['Om twaalf uur begint de les.','The lesson begins at twelve o’clock.','beginnen',3,'de les'],
  ['Elke ochtend lezen wij veel.','Every morning we read a lot.','lezen',2,'wij'],
  ['Na de les leert onze klas nieuwe woorden.','After the lesson our class learns new words.','leren',3,'onze klas'],
  ['In deze straat wacht mijn oma.','My grandmother waits on this street.','wachten',3,'mijn oma'],
  ['In de middag belt mijn oma de tandarts.','In the afternoon my grandmother calls the dentist.','bellen',3,'mijn oma'],
  ['In het weekend slapen de kinderen langer.','At the weekend the children sleep longer.','slapen',3,'de kinderen'],
  ['Vandaag ruim ik de keuken op.','Today I tidy the kitchen.','opruimen',1,'ik',[1,5]],
  ['Na de les maken zij hun huiswerk.','After the lesson they do their homework.','maken',3,'zij'],
  ['Morgen kopen wij een nieuwe tafel.','Tomorrow we buy a new table.','kopen',1,'wij']
 ],
 'A1.13':[
  ['Mijn broer heeft die muziek gehoord.','My brother heard that music.','hebben',2,'Mijn broer'],
  ['Ik heb mijn sleutel gevonden.','I found my key.','hebben',1,'Ik'],
  ['Wij hebben rijst met groente gekookt.','We cooked rice with vegetables.','hebben',1,'Wij'],
  ['Mijn vader heeft televisie gekeken.','My father watched television.','hebben',2,'Mijn vader'],
  ['Hij heeft vandaag veel gedaan.','He did a lot today.','hebben',1,'Hij'],
  ['De kinderen hebben voetbal gespeeld.','The children played football.','hebben',2,'De kinderen'],
  ['Wij hebben met de leraar gesproken.','We spoke with the teacher.','hebben',1,'Wij'],
  ['Mijn zus heeft melk gedronken.','My sister drank milk.','hebben',2,'Mijn zus'],
  ['We hebben vandaag soep gegeten.','We ate soup today.','hebben',1,'We'],
  ['Ze hebben gisteren samen gewerkt.','They worked together yesterday.','hebben',1,'Ze'],
  ['Vanmorgen heb ik een foto gemaakt.','This morning I took a photograph.','hebben',1,'ik'],
  ['Ik heb een e-mail geschreven.','I wrote an email.','hebben',1,'Ik'],
  ['Mijn ouders hebben boodschappen gekocht.','My parents bought groceries.','hebben',2,'Mijn ouders'],
  ['Onze moeder heeft een verhaal verteld.','Our mother told a story.','hebben',2,'Onze moeder']
 ],
 'A1.15':[
  ['Mijn broer spreekt geen Duits.','My brother does not speak German.','spreken',2,'Mijn broer'],
  ['Hij begrijpt mij niet.','He does not understand me.','begrijpen',1,'Hij'],
  ['Wij drinken vandaag geen melk.','We are not drinking milk today.','drinken',1,'Wij'],
  ['Wij begrijpen deze woorden niet.','We do not understand these words.','begrijpen',1,'Wij'],
  ['Onze leraar spreekt geen Frans.','Our teacher does not speak French.','spreken',2,'Onze leraar']
 ],
 'A1.16':[
  ['Jullie komen morgenmiddag terug.','You return tomorrow afternoon.','terugkomen',1,'Jullie'],
  ['Wij nemen de jassen mee.','We take the coats along.','meenemen',1,'Wij'],
  ['Zij zet de televisie na het eten aan.','She turns on the television after eating.','aanzetten',1,'Zij'],
  ['Vanmorgen doe ik mijn jas aan.','This morning I put on my coat.','aandoen',1,'ik']
 ],
 'A1.17':[
  ['Het hotel is klein.','The hotel is small.','zijn',2,'Het hotel'],
  ['Dit boek is interessant.','This book is interesting.','zijn',2,'Dit boek'],
  ['Mijn kleine huis is warm.','My small house is warm.','zijn',3,'Mijn kleine huis'],
  ['Het meisje koopt vier bananen.','The girl buys four bananas.','kopen',2,'Het meisje'],
  ['De tafels staan bij de deur.','The tables stand by the door.','staan',2,'De tafels'],
  ['Mijn sleutels zijn hier.','My keys are here.','zijn',2,'Mijn sleutels'],
  ['Mijn kinderen hebben tassen.','My children have bags.','hebben',2,'Mijn kinderen'],
  ['De mannen lezen kranten.','The men read newspapers.','lezen',2,'De mannen'],
  ['Wij kopen kaarten.','We buy cards.','kopen',1,'Wij'],
  ['Mijn moeder koopt glazen.','My mother buys drinking glasses.','kopen',2,'Mijn moeder'],
  ['Deze huizen hebben grote ramen.','These houses have big windows.','hebben',2,'Deze huizen'],
  ['Jullie lezen brieven.','You read letters.','lezen',1,'Jullie'],
  ['De winkels zijn dichtbij.','The shops are nearby.','zijn',2,'De winkels'],
  ['Mijn moeder koopt een kaartje.','My mother buys a ticket.','kopen',2,'Mijn moeder'],
  ['Mijn hond is klein.','My dog is small.','zijn',2,'Mijn hond']
 ],
 'A1.18':[
  ['Mijn huis is licht en mooi.','My house is bright and beautiful.','zijn',2,'Mijn huis'],
  ['Jouw fiets is rood.','Your bicycle is red.','zijn',2,'Jouw fiets'],
  ['Mijn tas is zwaar.','My bag is heavy.','zijn',2,'Mijn tas'],
  ['Zijn auto is zwart.','His car is black.','zijn',2,'Zijn auto'],
  ['Haar nieuwe jas is groen.','Her new coat is green.','zijn',3,'Haar nieuwe jas'],
  ['Mijn moeder heeft een groene jas.','My mother has a green coat.','hebben',2,'Mijn moeder'],
  ['Jouw vader heeft een oude tas.','Your father has an old bag.','hebben',2,'Jouw vader'],
  ['Zijn hond is lief.','His dog is sweet.','zijn',2,'Zijn hond']
 ],
 'A1.19':[
  ['Mijn broer heeft honderd euro.','My brother has one hundred euros.','hebben',2,'Mijn broer'],
  ['Ik koop twee broden.','I buy two loaves.','kopen',1,'Ik'],
  ['Wij hebben zestien eieren.','We have sixteen eggs.','hebben',1,'Wij'],
  ['Ik neem drie koppen koffie.','I take three cups of coffee.','nemen',1,'Ik'],
  ['Jij hebt vijftien euro.','You have fifteen euros.','hebben',1,'Jij'],
  ['Mijn vader heeft dertig euro.','My father has thirty euros.','hebben',2,'Mijn vader'],
  ['Mijn moeder heeft vijftig euro.','My mother has fifty euros.','hebben',2,'Mijn moeder'],
  ['Wij willen twee koffies.','We want two coffees.','willen',1,'Wij'],
  ['Ik koop een kilo tomaten.','I buy a kilogram of tomatoes.','kopen',1,'Ik'],
  ['De helft kost drie euro.','Half costs three euros.','kosten',2,'De helft'],
  ['Ik koop één broodje.','I buy one bread roll.','kopen',1,'Ik']
 ],
 'A1.20':[
  ['De les begint om elf uur.','The lesson begins at eleven o’clock.','beginnen',2,'De les'],
  ['Mijn afspraak is op donderdag.','My appointment is on Thursday.','zijn',2,'Mijn afspraak'],
  ['De cursus begint op vijftien april.','The course begins on 15 April.','beginnen',2,'De cursus'],
  ['Mijn verjaardag is in juni.','My birthday is in June.','zijn',2,'Mijn verjaardag'],
  ['Wij vertrekken in augustus.','We leave in August.','vertrekken',1,'Wij'],
  ['Ik werk in september.','I work in September.','werken',1,'Ik']
 ],
 'A1.21':[
  ['Wij gaan naar de bibliotheek.','We are going to the library.','gaan',1,'Wij'],
  ['Mijn broer woont in Den Haag.','My brother lives in The Hague.','wonen',2,'Mijn broer'],
  ['De hond zit op de stoel.','The dog is sitting on the chair.','zitten',2,'De hond'],
  ['Mijn sleutels liggen op de tafel.','My keys are lying on the table.','liggen',2,'Mijn sleutels'],
  ['De kopjes staan in de keuken.','The cups are in the kitchen.','staan',2,'De kopjes'],
  ['Mijn jas hangt aan de kapstok.','My coat is hanging on the coat rack.','hangen',2,'Mijn jas'],
  ['Mijn moeder werkt bij de bakker.','My mother works at the bakery.','werken',2,'Mijn moeder'],
  ['Mijn zus komt uit Groningen.','My sister comes from Groningen.','komen',2,'Mijn zus'],
  ['Ik zet het glas bij de deur.','I put the glass by the door.','zetten',1,'Ik'],
  ['Zij legt haar tas op de tafel.','She puts her bag on the table.','leggen',1,'Zij'],
  ['Wij gaan naar het restaurant.','We are going to the restaurant.','gaan',1,'Wij']
 ]
};

export function fairPracticeRows(existing){
 const rows=[];
 for(const [concept,specs] of Object.entries(contexts))for(const [index,[nl,en,verb,verbIndex,subject,verbSlots]] of specs.entries()){
  const model=existing.find(s=>s.concept===concept&&s.verb===verb&&s.pool==='practice')
   ||existing.find(s=>s.concept===concept&&s.verb===verb);
  if(!model)throw Error(`${concept}: no model metadata for ${verb}`);
  const questionWord=tokens(nl)[0];
  const questionGloss={waar:'where',wat:'what',wanneer:'when',hoe:'how',wie:'who'};
  const vocabulary=concept==='A1.8'?[{id:`a1x:${questionWord}`,nl:questionWord,en:questionGloss[questionWord],mature:false}]
   :model.vocabulary.filter(w=>!w.supportOnly);
  rows.push({...model,id:`${concept}-fair-p-${String(index+1).padStart(2,'0')}`,pool:'practice',nl,en,verb,verbIndex,
   verbSlots:['A1.9','A1.13','A1.16'].includes(concept)||verbSlots?[verbIndex,tokens(nl).length-1]:[verbIndex],subject,
   vocabulary});
 }
 return rows;
}
