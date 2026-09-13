const root=document.querySelector('#content');

function decorateToday(){
  const concept=root?.querySelector('.card.concept');
  if(!concept||concept.querySelector('.course-progress-note'))return;
  const detail=[...concept.querySelectorAll('p')].find(p=>/practice attempts/.test(p.textContent||''));
  const status=concept.querySelector('.status')?.textContent?.trim()||'';
  const match=detail?.textContent?.match(/(\d+)\s+practice attempts/);
  if(!match)return;
  const attempts=Math.max(0,Number(match[1])||0),remaining=Math.max(0,40-attempts),pct=Math.min(100,attempts/40*100);
  let title='Building toward mastery proof';
  let copy=remaining?`${remaining} more practice ${remaining===1?'answer':'answers'} before mastery proof can open. Zin will keep mixing recognition, construction and independent Dutch production.`:'The practice requirement is complete. Mastery proof will become available when the session state allows it.';
  if(status==='Proof Ready'){title='Practice complete — mastery proof is ready';copy='Your next milestone is a 20-question mastery proof using unseen sentences and no word help.';}
  if(status==='Retention pending'){title='Mastery proved — now let it settle';copy='The next checkpoint is the retention test shown below. The next concept stays locked until retention is proved.';}
  if(status==='Retention Ready'){title='Retention check is ready';copy='Pass the retention test to complete this concept and unlock the next lesson.';}
  if(status==='Mastered'){title='Concept retained';copy='This concept is complete. Zin will move you into the next unlocked lesson and revisit this material later for maintenance.';}
  const box=document.createElement('div');box.className='course-progress-note';
  box.innerHTML=`<div class="row"><strong>${title}</strong><span class="course-progress-count">${Math.min(attempts,40)} / 40 practice</span></div><div class="course-progress-track" role="progressbar" aria-label="Practice toward mastery proof" aria-valuemin="0" aria-valuemax="40" aria-valuenow="${Math.min(attempts,40)}"><span style="width:${pct}%"></span></div><p class="small muted">${copy}</p>`;
  detail.insertAdjacentElement('afterend',box);

  const done=[...root.querySelectorAll('.card.summary p')].find(p=>/Today’s work is complete/.test(p.textContent||''));
  if(done&&!root.querySelector('.course-next-step')){
    const next=document.createElement('p');next.className='course-next-step small';
    next.textContent=status==='Proof Ready'?'Today is complete. Your mastery proof is the next milestone; Zin will not add extra normal questions today.':status==='Retention pending'?'Today is complete. Your saved progress is waiting for the retention date; the next concept remains locked until you pass it.':'Today is complete. Your evidence is saved and tomorrow continues from this point — no extra normal questions will be added today.';
    done.insertAdjacentElement('afterend',next);
  }
}

function decorate(){if(document.querySelector('[data-view="today"].active'))decorateToday();}
new MutationObserver(decorate).observe(root,{childList:true,subtree:true});
decorate();
