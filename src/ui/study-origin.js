import {environmentPresentation} from '../engine/study-origin.js';

function readVersion(doc){
 const fromTitle=(doc.title||'').match(/V\d+\.\d+\.\d+/);
 if(fromTitle)return fromTitle[0];
 const fromBrand=(doc.querySelector('.brand p')?.textContent||'').match(/V\d+\.\d+\.\d+/);
 return fromBrand?fromBrand[0]:'V5.1.122';
}

export function applyStudyOrigin(doc=document,hostname=globalThis.location?.hostname||''){
 const view=environmentPresentation(hostname,readVersion(doc));
 doc.body?.classList?.toggle('is-development',!view.genuine);
 doc.body?.classList?.toggle('is-production',view.genuine);
 if(doc.body?.dataset)doc.body.dataset.studyOrigin=view.kind;
 const subtitle=doc.querySelector?.('.brand p');
 if(subtitle)subtitle.textContent=view.subtitle;
 if(view.banner&&!doc.querySelector?.('.study-origin-banner')){
  const banner=doc.createElement('div');
  banner.className='study-origin-banner';
  banner.setAttribute('role','status');
  banner.textContent=view.banner;
  const topbar=doc.querySelector('.topbar');
  if(topbar)topbar.prepend(banner);
  else doc.body?.prepend?.(banner);
 }
 if(!view.genuine){
  if(doc.title&&!String(doc.title).includes('Development'))doc.title=String(doc.title).replace(/^Zin/,'Zin Development');
  const apple=doc.querySelector?.('meta[name="apple-mobile-web-app-title"]');
  if(apple)apple.setAttribute('content',view.appleTitle);
 }
}

if(globalThis.document)applyStudyOrigin();
