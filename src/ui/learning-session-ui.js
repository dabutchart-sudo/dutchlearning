const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function questionHeader({question,dailyCount,proof,extraIndex,extraSize,topicTitle}){
 const extra=question.phase==='extra';
 const total=proof?proof.questions.length:extra?extraSize:20;
 const current=proof?proof.index+1:extra?extraIndex:dailyCount+1;
 const label=proof?proof.type==='mastery'?'Mastery test':'Retention test':extra?'Extra practice':'Learning';
 const context=proof?`<details class="session-context"><summary>Test rules</summary><p>${proof.type==='mastery'?'Pass with 19/20 grammar overall and at least 9/10 in each direction.':'Retention requires 10/10 grammar.'} No word help is available.</p></details>`:extra?'<p class="session-context">Does not use today’s 20.</p>':'';
 return `<div class="session-head"><div class="session-step"><strong>${label} · ${current} / ${total}</strong><span class="session-topic" title="${esc(topicTitle)}">${esc(topicTitle)}</span></div><button id="pause" class="session-pause" type="button" aria-label="Pause; progress is saved" title="Pause"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button></div><div class="session-progress" role="progressbar" aria-label="${label} progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${current-1}"><span style="width:${Math.round((current-1)/total*100)}%"></span></div>${context}`;
}

export function answerFeedback(record,feedback){
 const title=record.grammar===true?(record.spelling===false?'Grammar correct · spelling to revisit':'Grammar correct'):record.grammar===null?'Vocabulary needs review':'Let’s revisit this pattern';
 const tone=record.grammar===true?(record.spelling===false?'warn':'ok'):'bad';
 const sentence=feedback.words.map(part=>part.changed?`<mark class="problem-char">${esc(part.text)}</mark>`:esc(part.text)).join(' ')+esc(feedback.punctuation);
 return `<div class="feedback ${tone}"><strong>${title}</strong><span class="correct" lang="nl">${sentence}</span><span class="meaning">${esc(feedback.meaning)}</span>${feedback.differences.length?`<p lang="nl">${feedback.differences.map(esc).join(' · ')}</p>`:''}${feedback.explanation?`<p>${esc(feedback.explanation)}</p>`:''}${feedback.patternTip?`<p class="tipbox">Pattern to revisit: ${esc(feedback.patternTip)}</p>`:''}${record.capitalization===false?'<p>Start the sentence with a capital letter. This is separate from grammar.</p>':''}<details class="session-evidence"><summary>How this answer counts</summary><div class="badges"><span class="badge">Grammar ${record.grammar===true?'✓':record.grammar===null?'unproven':'review'}</span>${record.spelling!==null?`<span class="badge">Spelling ${record.spelling?'✓':'review'}</span>`:''}${record.capitalization!==null?`<span class="badge">Capitalisation ${record.capitalization?'✓':'review'}</span>`:''}${record.assisted?'<span class="badge">Guidance used</span>':''}${record.independent?'<span class="badge">Independent Dutch writing</span>':''}</div>${record.assisted?'<p>Guidance supports practice, but this answer does not count as independent Dutch writing. Recall will return later.</p>':''}</details></div>`;
}
