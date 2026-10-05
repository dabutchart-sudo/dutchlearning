// Two-line exchanges for optional listening Practice (DAB-187).
// Every Dutch word is already used by a practice sentence in the exchange's topic
// or an earlier topic (checked in tests). None of these lines is a proof sentence.
// Each exchange has two wrong meanings: one changes a detail of the first turn,
// the other a detail of the second, so the learner must follow both turns.
const x=(id,concept,[first,second],[firstEn,secondEn],[wrongFirst,wrongSecond])=>Object.freeze({
 id:`exchange:${id}`,concept,
 turns:Object.freeze([Object.freeze({nl:first,en:firstEn}),Object.freeze({nl:second,en:secondEn})]),
 meaning:`${firstEn} — ${secondEn}`,
 wrongMeanings:Object.freeze([`${wrongFirst} — ${secondEn}`,`${firstEn} — ${wrongSecond}`])
});

export const LISTENING_EXCHANGES=Object.freeze([
 x('a1-2-tea','A1.2',['Drinkt zij thee?','Zij drinkt water.'],['Does she drink tea?','She drinks water.'],['Does she drink coffee?','She drinks coffee.']),
 x('a1-2-book','A1.2',['Lees jij een boek?','Ik lees de krant.'],['Are you reading a book?','I am reading the newspaper.'],['Are you writing a book?','I am reading a letter.']),
 x('a1-2-shop','A1.2',['Zoek jij een winkel?','Ik zoek het station.'],['Are you looking for a shop?','I am looking for the station.'],['Are you looking for a house?','I am looking for the museum.']),
 x('a1-2-bike','A1.2',['Koop jij een fiets?','Ik koop een auto.'],['Are you buying a bike?','I am buying a car.'],['Are you selling a bike?','I am buying a house.']),
 x('a1-2-dog','A1.2',['Ziet hij de hond?','Hij ziet de kat.'],['Does he see the dog?','He sees the cat.'],['Does she see the dog?','He sees the child.']),

 x('a1-8-live','A1.8',['Waar woon jij?','Ik woon bij de winkel.'],['Where do you live?','I live near the shop.'],['Where do you work?','I live near the museum.']),
 x('a1-8-read','A1.8',['Wat lees jij?','Ik lees een boek.'],['What are you reading?','I am reading a book.'],['What are you writing?','I am reading the newspaper.']),
 x('a1-8-work','A1.8',['Wanneer werk jij?','Ik werk vandaag.'],['When do you work?','I work today.'],['Where do you work?','I work tomorrow.']),
 x('a1-8-cook','A1.8',['Wie kookt vanavond?','Mijn zus kookt vanavond.'],['Who is cooking tonight?','My sister is cooking tonight.'],['Who is eating tonight?','My sister is cooking today.']),
 x('a1-8-where-work','A1.8',['Waar werkt hij?','Hij werkt op het station.'],['Where does he work?','He works at the station.'],['When does he work?','He works in the garden.']),

 x('a1-14-home','A1.14',['Werk jij vandaag thuis?','Ik werk vandaag in de stad.'],['Are you working at home today?','I am working in the city today.'],['Are you working at home tomorrow?','I am working in the city tomorrow.']),
 x('a1-14-bike','A1.14',['Heb jij een fiets?','Ik heb geen fiets.'],['Do you have a bike?','I do not have a bike.'],['Do you have a car?','I do not have a car.']),
 x('a1-14-when','A1.14',['Wanneer werken jullie?','Wij werken morgen.'],['When are you working?','We are working tomorrow.'],['Where are you working?','We are working today.']),
 x('a1-14-why','A1.14',['Waarom leert zij Nederlands?','Zij werkt in Utrecht.'],['Why is she learning Dutch?','She works in Utrecht.'],['Why is he learning Dutch?','She lives in Utrecht.']),
 x('a1-14-school','A1.14',['Hoe ga jij naar school?','Ik loop naar school.'],['How do you get to school?','I walk to school.'],['How do you get home?','I run to school.']),

 x('a1-23-coffee','A1.23',['Mag ik een koffie, alstublieft?','Een koffie kost drie euro.'],['May I have a coffee, please?','A coffee costs three euros.'],['May I have a tea, please?','A coffee costs two euros.']),
 x('a1-23-cost','A1.23',['Wat kost een koffie?','Een koffie kost twee euro.'],['What does a coffee cost?','A coffee costs two euros.'],['What does a tea cost?','A coffee costs three euros.']),
 x('a1-23-pay','A1.23',['Kan ik hier betalen?','U kunt hier betalen.'],['Can I pay here?','You can pay here.'],['Can I eat here?','You can wait here.']),
 x('a1-23-bill','A1.23',['Mag ik de rekening, alstublieft?','De rekening is twaalf euro.'],['May I have the bill, please?','The bill is twelve euros.'],['May I have a coffee, please?','The bill is ten euros.']),

 x('a1-24-sugar','A1.24',['Wil je koffie of wil je thee?','Ik wil thee, maar ik wil geen suiker.'],['Would you like coffee or tea?','I would like tea, but no sugar.'],['Would you like coffee or water?','I would like coffee, but no sugar.']),
 x('a1-24-first','A1.24',['Wat doe jij vandaag?','Eerst werk ik, daarna ga ik naar huis.'],['What are you doing today?','First I work, then I go home.'],['What are you doing tomorrow?','First I go home, then I work.']),
 x('a1-24-home','A1.24',['Waarom blijf jij thuis?','Ik blijf thuis, want ik ben moe.'],['Why are you staying at home?','I am staying at home because I am tired.'],['Why is she staying at home?','I am staying at home because I am ill.']),
 x('a1-24-drink','A1.24',['Wat drinken jullie?','Ik drink koffie en zij drinkt thee.'],['What are you all drinking?','I am drinking coffee and she is drinking tea.'],['What are you all eating?','I am drinking tea and she is drinking coffee.']),

 x('s1-help','S1',['Kunt u mij helpen?','Mijn telefoon werkt niet.'],['Can you help me?','My phone is not working.'],['Can you repeat that?','My bike is not working.']),
 x('s1-train','S1',['Waar is de trein?','De trein is te laat.'],['Where is the train?','The train is late.'],['Where is the bus?','The bus is late.']),
 x('s1-understand','S1',['Begrijpt zij het?','Ik begrijp het niet.'],['Does she understand?','I do not understand.'],['Does he understand?','I understand.']),
 x('s1-problem','S1',['Wat is het probleem?','Ik heb hulp nodig, want mijn fiets werkt niet.'],['What is the problem?','I need help, because my bike is not working.'],['What is the plan?','I need help, because my phone is not working.']),

 x('s2-name','S2',['Hoe heet u?','Ik heet Jan.'],['What is your name?','My name is Jan.'],['Where do you live?','My name is Tom.']),
 x('s2-live','S2',['Waar woon jij?','Ik woon in Amsterdam.'],['Where do you live?','I live in Amsterdam.'],['Where do you work?','I live in Rotterdam.']),
 x('s2-tom','S2',['Hoe heet jij?','Ik heet Jan, en ik woon in Amsterdam.'],['What is your name?','My name is Jan, and I live in Amsterdam.'],['Where do you live?','My name is Jan, and I live in Utrecht.']),
 x('s2-sister','S2',['Wie is dat?','Dat is mijn zus. Zij heet Lisa.'],['Who is that?','That is my sister. She is called Lisa.'],['Where is that?','That is my mother. She is called Lisa.']),

 x('s3-when','S3',['Wanneer is de afspraak?','De afspraak is om half drie.'],['When is the appointment?','The appointment is at half past two.'],['Where is the appointment?','The appointment is at two o’clock.']),
 x('s3-come','S3',['Komt u om half drie?','Ik kom om twee uur.'],['Are you coming at half past two?','I am coming at two o’clock.'],['Are you coming at eleven o’clock?','I am coming at five o’clock.']),
 x('s3-monday','S3',['Heb jij vandaag een afspraak?','Ik heb maandag een afspraak.'],['Do you have an appointment today?','I have an appointment on Monday.'],['Does she have an appointment today?','I have an appointment tomorrow.']),
 x('s3-eleven','S3',['Wanneer komen jullie?','Wij komen om elf uur.'],['When are you coming?','We are coming at eleven o’clock.'],['When is she coming?','We are coming at five o’clock.'])
]);
