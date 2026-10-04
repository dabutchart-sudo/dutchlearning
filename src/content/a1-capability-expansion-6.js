const kinds=['choice','wordbank','typed','gap','form','correct-sentence','correction','listening'];
const verbs={
 drinken:['drink','drinkt','drinken'],
 willen:['wil','wilt','willen'],
 nemen:['neem','neemt','nemen'],
 blijven:['blijf','blijft','blijven'],
 gaan:['ga','gaat','gaan'],
 werken:['werk','werkt','werken'],
 betalen:['betaal','betaalt','betalen'],
 eten:['eet','eten'],
 kopen:['koop','koopt','kopen'],
 lezen:['lees','leest','lezen'],
 kunnen:['kan','kunt','kunnen'],
 komen:['kom','komt','komen'],
 hebben:['heb','hebt','heeft','hebben']
};
const gloss={drinken:'drink',willen:'want',nemen:'take',blijven:'stay',gaan:'go',werken:'work',betalen:'pay',eten:'eat',kopen:'buy',lezen:'read',kunnen:'can',komen:'come',hebben:'have'};
const word=v=>({id:`a1cap6:${v}`,nl:v,en:gloss[v]||v,mature:false});
function row(pool,i,[nl,en,verb,verbIndex,subject]){return {id:`A1.24-${pool==='practice'?'p':'t'}-${String(i+1).padStart(2,'0')}`,concept:'A1.24',pool,nl,en,verb,verbIndex,verbSlots:[verbIndex],forms:verbs[verb],subject,family:`A1.24:${verb}`,vocabulary:[word(verb)],difficulty:pool==='practice'?1:2,suitableKinds:kinds,expectedStructure:'two short ideas joined or sequenced'};}
const build=(pool,rows)=>rows.map((x,i)=>row(pool,i,x));
const practice=[
 ['Ik drink koffie en zij drinkt thee.','I drink coffee and she drinks tea.','drinken',1,'Ik'],
 ['Ik wil koffie, maar ik wil geen suiker.','I want coffee, but I do not want any sugar.','willen',1,'Ik'],
 ['Ik neem koffie of thee.','I will have coffee or tea.','nemen',1,'Ik'],
 ['Ik blijf thuis, want ik ben moe.','I am staying home, because I am tired.','blijven',1,'Ik'],
 ['Eerst drink ik koffie.','First I drink coffee.','drinken',1,'ik'],
 ['Daarna eet ik een broodje.','After that I eat a sandwich.','eten',1,'ik'],
 ['Dan ga ik naar huis.','Then I go home.','gaan',1,'ik'],
 ['Ik ga naar het station en ik neem de trein.','I go to the station and I take the train.','gaan',1,'Ik'],
 ['Hij wil thee, maar hij drinkt koffie.','He wants tea, but he drinks coffee.','willen',1,'Hij'],
 ['Wil je koffie of wil je thee?','Do you want coffee or do you want tea? (speaking to one person)','willen',0,'je'],
 ['Zij werkt vandaag, want de winkel is open.','She is working today, because the shop is open.','werken',1,'Zij'],
 ['Eerst betaal ik de rekening.','First I pay the bill.','betalen',1,'ik'],
 ['Daarna gaan wij naar huis.','After that we go home.','gaan',1,'wij']
];
const proof=[
 ['Ik eet een broodje en hij drinkt melk.','I eat a sandwich and he drinks milk.','eten',1,'Ik'],
 ['Wij gaan naar huis en zij blijft hier.','We go home and she stays here.','gaan',1,'Wij'],
 ['Ik lees een boek en jij leest de krant.','I read a book and you read the newspaper. (speaking to one person)','lezen',1,'Ik'],
 ['Hij koopt brood en zij koopt melk.','He buys bread and she buys milk.','kopen',1,'Hij'],
 ['Ik neem de bus en jij neemt de trein.','I take the bus and you take the train. (speaking to one person)','nemen',1,'Ik'],
 ['Wij drinken thee en de kinderen eten soep.','We drink tea and the children eat soup.','drinken',1,'Wij'],
 ['Ik werk morgen en mijn broer werkt vandaag.','I work tomorrow and my brother works today.','werken',1,'Ik'],
 ['Ik wil thee, maar zij wil koffie.','I want tea, but she wants coffee.','willen',1,'Ik'],
 ['Hij blijft thuis, maar zij gaat naar school.','He stays at home, but she goes to school.','blijven',1,'Hij'],
 ['Wij willen brood, maar de winkel is niet open.','We want bread, but the shop is not open.','willen',1,'Wij'],
 ['Ik neem de trein, maar jij neemt de bus.','I take the train, but you take the bus. (speaking to one person)','nemen',1,'Ik'],
 ['Zij drinkt koffie, maar hij drinkt thee.','She drinks coffee, but he drinks tea.','drinken',1,'Zij'],
 ['Ik kan komen, maar ik kan niet blijven.','I can come, but I cannot stay.','kunnen',1,'Ik'],
 ['Jij wilt soep, maar ik wil een broodje.','You want soup, but I want a sandwich. (speaking to one person)','willen',1,'Jij'],
 ['Ik neem water of melk.','I will have water or milk.','nemen',1,'Ik'],
 ['Wil je water of wil je melk?','Do you want water or do you want milk? (speaking to one person)','willen',0,'je'],
 ['Wij gaan vandaag of morgen.','We are going today or tomorrow.','gaan',1,'Wij'],
 ['Neem je de bus of neem je de trein?','Are you taking the bus or the train? (speaking to one person)','nemen',0,'je'],
 ['Hij koopt appels of bananen.','He buys apples or bananas.','kopen',1,'Hij'],
 ['Zij leest een boek of de krant.','She reads a book or the newspaper.','lezen',1,'Zij'],
 ['Ik neem de bus, want ik heb geen fiets.','I take the bus, because I do not have a bicycle.','nemen',1,'Ik'],
 ['Wij eten thuis, want het restaurant is niet open.','We eat at home, because the restaurant is not open.','eten',1,'Wij'],
 ['Zij gaat naar de winkel, want zij wil brood.','She goes to the shop, because she wants bread.','gaan',1,'Zij'],
 ['Hij komt niet, want hij is moe.','He is not coming, because he is tired.','komen',1,'Hij'],
 ['Jij blijft hier, want de bus komt later.','You are staying here, because the bus comes later. (speaking to one person)','blijven',1,'Jij'],
 ['Eerst eet ik soep.','First I eat soup.','eten',1,'ik'],
 ['Eerst neem ik de bus.','First I take the bus.','nemen',1,'ik'],
 ['Eerst koop ik brood.','First I buy bread.','kopen',1,'ik'],
 ['Daarna drink ik thee.','After that I drink tea.','drinken',1,'ik'],
 ['Daarna gaan zij naar school.','After that they go to school.','gaan',1,'zij'],
 ['Daarna neemt hij de trein.','After that he takes the train.','nemen',1,'hij'],
 ['Eerst kopen wij kaartjes.','First we buy tickets.','kopen',1,'wij'],
 ['Daarna eten wij soep.','After that we eat soup.','eten',1,'wij'],
 ['Ik heb koffie, maar ik heb geen melk.','I have coffee, but I do not have any milk.','hebben',1,'Ik'],
 ['Mijn zus komt vandaag en mijn broer komt morgen.','My sister is coming today and my brother is coming tomorrow.','komen',2,'Mijn zus'],
 ['De kinderen eten brood en zij drinken water.','The children eat bread and they drink water.','eten',2,'De kinderen'],
 ['Ik wil graag thee, maar ik wil geen suiker.','I would like tea, but I do not want any sugar.','willen',1,'Ik'],
 ['Ik blijf thuis of ik ga naar de winkel.','I stay at home, or I go to the shop.','blijven',1,'Ik'],
 ['Wij betalen de rekening en daarna gaan wij naar huis.','We pay the bill, and after that we go home.','betalen',1,'Wij'],
 ['Dan drink ik water.','Then I drink water.','drinken',1,'ik']
];
export default {schemaVersion:1,id:'a1-capability-expansion-6',version:'1.0.0',title:'A1 Capability Expansion 6',levels:['A1'],concepts:[{id:'A1.24',title:'Connecting ideas',level:'A1',prerequisites:['A1.23'],rule:'Join two short ideas with en, maar, of or want. Each idea keeps its own subject and finite verb: ik wil koffie, maar ik wil geen suiker. Want gives a reason and does not send the verb to the end. For a sequence, use eerst, daarna or dan. When one of those words starts the sentence, the finite verb still comes second: eerst drink ik koffie.',example:'Ik wil koffie, maar ik wil geen suiker.',translation:'I want coffee, but I do not want any sugar.',minPractice:40}],sentences:[...build('practice',practice),...build('proof',proof)]};
