const root=document.querySelector('#content');

function milestoneCopy(status,attempts=0){
  const remaining=Math.max(0,40-attempts);
  if(status==='Proof Ready')return 'Practice complete · mastery proof ready';
  if(status==='Retention pending')return 'Mastery proved · waiting for retention';
  if(status==='Retention Ready')return 'Retention check ready · pass to unlock next lesson';
  if(status==='Mastered')return 'Retained · concept complete';
  if(status==='Locked')return 'Locked until the previous concept is retained';
  return remaining?`${remaining} practice ${remaining===1?'answer':'answers'} until mastery-proof eligibility`:'Practice requirement complete';
}

function progressBox({status,attempts=0,compact=false}){
  const safe=Math.min(40,Math.max(0,attempts)),pct=safe/40*100;
  const title=status==='Proof Ready'?'Practice complete — mastery proof is ready':status==='Retention pending'?'Mastery proved — now let it settle':status==='Retention Ready'?'Retention check is ready':status==='Mastered'?'Concept retained':'Building toward mastery proof';
  const copy=milestoneCopy(status,attempts);
  return `<div class="course-progress-note${compact?' compact':''}"><div class="row"><strong>${title}</strong><span class="course-progress-count">${safe} / 40 practice</span></div><div class="course-progress-track" role="progressbar" aria-label="Practice toward mastery proof" aria-valuemin="0" aria-valuemax="40" aria-valuenow="${safe}"><span style="width:${pct}%"></span></div><p class="small muted">${copy}</p></div>`;
}

function decorateToday(){
  const concept=root?.querySelector('.card.concept');
  if(!concept||concept.querySelector('.course-progress-note'))return;
  const detail=[...concept.querySelectorAll('p')].find(p=>/practice attempts/.test(p.textContent||''));
  const status=concept.querySelector('.status')?.textContent?.trim()||'';
  const match=detail?.textContent?.match(/(\d+)\s+practice attempts/);
  if(!match)return;
  const attempts=Math.max(0,Number(match[1])||0);
  detail.insertAdjacentHTML('afterend',progressBox({status,attempts}));

  const note=concept.querySelector('.course-progress-note p');
  if(note){
    if(status==='Proof Ready')note.textContent='Your next milestone is a 20-question mastery proof using unseen sentences and no word help.';
    if(status==='Retention pending')note.textContent='The next checkpoint is the retention test shown below. The next concept stays locked until retention is proved.';
    if(status==='Retention Ready')note.textContent='Pass the retention test to complete this concept and unlock the next lesson.';
    if(status==='Mastered')note.textContent='This concept is complete. Zin will move you into the next unlocked lesson and revisit this material later for maintenance.';
    if(status==='Learning'){const remaining=Math.max(0,40-attempts);note.textContent=remaining?`${remaining} more practice ${remaining===1?'answer':'answers'} before mastery proof can open. Zin will keep mixing recognition, construction and independent Dutch production.`:'The practice requirement is complete. Mastery proof will become available when the session state allows it.';}
  }

  const done=[...root.querySelectorAll('.card.summary p')].find(p=>/Today’s work is complete/.test(p.textContent||''));
  if(done&&!root.querySelector('.course-next-step')){
    const next=document.createElement('p');next.className='course-next-step small';
    next.textContent=status==='Proof Ready'?'Today is complete. Your mastery proof is the next milestone; Zin will not add extra normal questions today.':status==='Retention pending'?'Today is complete. Your saved progress is waiting for the retention date; the next concept remains locked until you pass it.':'Today is complete. Your evidence is saved and tomorrow continues from this point — no extra normal questions will be added today.';
    done.insertAdjacentElement('afterend',next);
  }
}

function decorateCourse(){
  if(!root||root.querySelector('.course-journey-note'))return;
  const grid=root.querySelector('.course-grid');
  if(grid){
    const intro=grid.previousElementSibling;
    if(intro){
      const journey=document.createElement('div');journey.className='course-journey-note';
      journey.innerHTML='<strong>How a concept becomes retained</strong><p class="small muted">Learn → practise across study days → mastery proof → wait 3 days → retention proof → unlock the next lesson.</p>';
      intro.append(journey);
    }
    grid.querySelectorAll('.course-item').forEach(item=>{
      const status=item.querySelector('.status')?.textContent?.trim()||'';
      const detail=item.querySelector('.muted.small');
      const match=detail?.textContent?.match(/(\d+)\s+practice attempts/);
      const attempts=match?Number(match[1])||0:0;
      if(detail&&status!=='Locked')detail.textContent=milestoneCopy(status,attempts);
    });
    return;
  }
  const card=root.querySelector('.card.evidence-card');
  const status=card?.querySelector('.status')?.textContent?.trim()||'';
  const detail=card?[...card.querySelectorAll('p')].find(p=>/\/40 practice attempts/.test(p.textContent||'')):null;
  const match=detail?.textContent?.match(/(\d+)\/40 practice attempts/);
  if(card&&detail&&match&&!card.querySelector('.course-progress-note'))detail.insertAdjacentHTML('afterend',progressBox({status,attempts:Number(match[1])||0,compact:true}));
}

function decorate(){
  if(document.querySelector('[data-view="today"].active'))decorateToday();
  if(document.querySelector('[data-view="curriculum"].active'))decorateCourse();
}
new MutationObserver(decorate).observe(root,{childList:true,subtree:true});
decorate();
