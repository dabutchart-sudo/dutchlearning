export const normalize=s=>String(s??'').normalize('NFC').toLowerCase().trim().replace(/[.!?,;:]/g,'').replace(/\s+/g,' ');
export const tokens=s=>normalize(s).split(' ').filter(Boolean);
export const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function dayKey(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export const addDays=(date,n)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return dayKey(d)};
export function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function shuffle(a,seed=Date.now()){a=[...a];let x=hash(String(seed))||1;for(let i=a.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a;}
export const pct=(a,b)=>b?`${Math.round(100*a/b)}%`:'—';
export function distance(a,b){let r=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,r[j]+1,r[j-1]+(a[i-1]!==b[j-1]));r=next}return r[b.length]}

// Display tokens preserve case; scoring tokens deliberately do not.
export const sentenceCase=s=>String(s).replace(/\p{L}/u,c=>c.toLocaleUpperCase('nl'));
export const displayTokens=s=>String(s).normalize('NFC').trim().replace(/[.!?,;:]/g,'').split(/\s+/).filter(Boolean);
