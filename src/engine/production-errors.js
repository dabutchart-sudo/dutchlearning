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

export function classifyProductionError(expected,answer){
 const target=clean(expected),given=clean(answer);
 if(target===given)return 'none';
 if(!given)return 'recall';
 const targetWords=target.split(' '),givenWords=given.split(' ');
 if(targetWords.length!==givenWords.length)return 'recall';
 const compactTarget=target.replace(/\s/g,''),compactGiven=given.replace(/\s/g,''),maxLen=Math.max(compactTarget.length,compactGiven.length),threshold=Math.min(2,Math.max(1,Math.ceil(maxLen*.2)));
 return distance(compactTarget,compactGiven)<=threshold?'spelling':'recall';
}
