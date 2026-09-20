export const PRODUCTION_HOST='dabutchart-sudo.github.io';

export function classifyOrigin(hostname=''){
 const host=String(hostname||'').trim().toLowerCase().replace(/^\[|\]$/g,'');
 return host===PRODUCTION_HOST?'production':'development';
}

export function environmentPresentation(hostname,version='V5.1.123'){
 const kind=classifyOrigin(hostname);
 const genuine=kind==='production';
 return {
  kind,
  genuine,
  subtitle:genuine?`Sentence construction · ${version}`:`Development · not for genuine study · ${version}`,
  appleTitle:genuine?'Zin':'Zin Dev',
  banner:genuine?null:'Development copy · GitHub Pages is the study origin. Progress here is separate.'
 };
}
