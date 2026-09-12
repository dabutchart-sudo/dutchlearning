const MARKERS={Dutch:'🇳🇱',English:'🇬🇧'};

export function languageMarker(label){
 const language=String(label??'').trim();
 const marker=MARKERS[language];
 return marker?{language,marker}:null;
}
