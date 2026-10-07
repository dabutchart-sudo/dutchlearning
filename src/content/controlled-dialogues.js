const response=(nl,en,sourceId)=>Object.freeze({nl,en,sourceId});

export const CONTROLLED_DIALOGUES=Object.freeze([
 Object.freeze({
  id:'s1-phone-help',concept:'S1',title:'Explain a phone problem',
  situation:'Your phone is not working. Explain the problem or ask for help.',
  turns:Object.freeze([
   Object.freeze({
    partner:Object.freeze({nl:'Wat is het probleem?',en:'What is the problem?'}),
    accepted:Object.freeze([
     response('Mijn telefoon werkt niet.','My phone is not working.','S1-p-08'),
     response('Ik heb hulp nodig.','I need help.','S1-p-10'),
     response('Ik heb hulp nodig, want mijn telefoon werkt niet.','I need help, because my phone is not working.','S1-p-12')
    ]),
    phraseHints:Object.freeze(['Mijn telefoon…','Ik heb hulp…'])
   })
  ])
 })
]);
