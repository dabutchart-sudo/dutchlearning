import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {lessonMaterial} from '../src/ui/teaching-support.js';

const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
// Each assessed family must have a lesson note and representative practice.
// This is a content guard, with naturalness and ambiguous answers still requiring human review.
const families={
 'A1.7':[[/\bniet\b/i,0],[/\b(geen|niets)\b/i,0]],
 'A1.8':[[/^(Waar|Wat|Wanneer|Hoe|Wie)\b/i,0]],
 'A1.9':[[/\b(ben|bent|is|zijn)\b/i,0]],
 'A1.10':[[/\b(op|aan|mee|uit|terug|open|dicht|af)\.$/i,1]],
 'A1.11':[[/\b(kan|kunt|kunnen|moet|moeten|wil|wilt|willen|mag|mogen)\b/i,0]],
 'A1.12':[[/^(Vandaag|Morgen|Vanavond|Op|Na|Om|Daar|Later|Zaterdag|Zondag|Deze|Elke|Voor|In|Bij)\b/i,0]],
 'A1.13':[[/\b(heb|hebt|heeft|hebben)\b/i,0]],
 'A1.14':[[/^(Waar|Wat|Wanneer|Waarom|Hoe|Wie)\b/i,1],[/^[^ ]+\s[^?]+\?$/i,0]],
 'A1.15':[[/\bgeen\b/i,0],[/\bniet\b/i,1],[/\bniets\b/i,2]],
 'A1.16':[[/\b(op|aan|mee|uit|terug|open|dicht|af)\.$/i,1]],
 'A1.17':[[/\bde\b/i,0],[/\bhet\b/i,0],[/\been\b/i,0],[/\b(bananen|sleutels|appels|boeken|fietsen|glazen)\b/i,1]],
 'A1.18':[[/\b(mijn|jouw|zijn|haar|ons|onze)\b/i,0]],
 'A1.19':[[/\b(euro|kilo|liter|fles|kaartje|kaartjes|broodje|broodjes|kop|koppen|glazen|eieren|appels|bananen|tomaten)\b/i,1],[/\b(een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|twintig|dertig|vijftig|honderd)\b/i,0]],
 'A1.20':[[/\b(om|half|kwart|uur)\b/i,1],[/\b(op|in|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\b/i,0]],
 'A1.21':[[/\b(naar|in|op|bij|uit|van|aan)\b/i,0]]
};

test('every current A1.7–A1.21 proof sentence maps to a taught family with representative practice',()=>{
 for(const [id,specs] of Object.entries(families)){
  const lesson=lessonMaterial(content,id);
  const practice=content.sentences.filter(row=>row.concept===id&&row.pool==='practice');
  const proof=content.sentences.filter(row=>row.concept===id&&row.pool==='proof');
  for(const row of proof)assert.ok(specs.some(([pattern])=>pattern.test(row.nl)),`${row.id}: no taught grammar family`);
  for(const [pattern,note] of specs){
   assert.ok(lesson.focus[note],`${id}: no teaching note for ${pattern}`);
   if(proof.some(row=>pattern.test(row.nl)))assert.ok(practice.some(row=>pattern.test(row.nl)),`${id}: ${pattern} assessed without practice`);
  }
 }
});
