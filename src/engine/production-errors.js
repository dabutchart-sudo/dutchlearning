const clean=value=>String(value??'').trim().toLocaleLowerCase('nl-NL').replace(/[.!?]+$/,'').replace(/\s+/g,' ');

function distance(a,b){
 const x=[...a],y=[...b],row=Array.from({length:y.length+1},(_,i)=>i);
 for(let i=1;i<=x.length;i++){
  let prev=row[0];row[0]=i;
  for(let j=1;j<=y.length;j++){
   const old=row[j],cost=x[i-1]===y[j-1]?0:1;
   row[j]=Math.min(row[j]+1,row[j-1]+1,prev+cost);prev=old;
  }
 }
 return row[y.length];
}

function tokenLooksLikeSpelling(target,given){
 if(target===given)return true;
 const d=distance(target,given),maxLen=Math.max(target.length,given.length);
 if(maxLen<=4){
  if(d!==1)return false;
  if(target.length!==given.length)return true;
  return target[0]===given[0];
 }
 const threshold=Math.min(2,Math.max(1,Math.ceil(maxLen*.2)));
 return d<=threshold;
}

export function classifyProductionError(expected,answer){
 const target=clean(expected),given=clean(answer);
 if(target===given)return 'none';
 if(!given)return 'recall';
 const targetWords=target.split(' '),givenWords=given.split(' ');
 if(targetWords.length!==givenWords.length)return 'recall';
 let changed=0,totalDistance=0;
 for(let i=0;i<targetWords.length;i++){
  if(targetWords[i]===givenWords[i])continue;
  changed++;
  if(!tokenLooksLikeSpelling(targetWords[i],givenWords[i]))return 'recall';
  totalDistance+=distance(targetWords[i],givenWords[i]);
 }
 if(!changed)return 'none';
 const compactLength=Math.max(target.replace(/\s/g,'').length,given.replace(/\s/g,'').length);
 const totalThreshold=Math.min(2,Math.max(1,Math.ceil(compactLength*.2)));
 return totalDistance<=totalThreshold?'spelling':'recall';
}
