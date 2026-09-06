import {freshState,blankProgress} from './learner.js';
import {dayKey,addDays,normalize} from './util.js';
export const STORAGE_KEY='dutch_sentence_trainer_v5';
export function validateState(s,content){
 if(!s||s.schemaVersion!==5||!Array.isArray(s.attempts)||!Array.isArray(s.exposures)||!s.progress||!s.daily||!/^\d{4}-\d{2}-\d{2}$/.test(s.daily.date)||!Number.isInteger(s.daily.count)||s.daily.count<0||s.daily.count>20)throw Error('This is not a valid V5 progress backup.');
 for(const c of content.concepts)if(!s.progress[c.id])s.progress[c.id]=blankProgress();
 if(s.pending&&!content.byId[s.pending.sourceId])throw Error('Backup needs a content pack that is not installed.');
 if(s.proof&&(!Array.isArray(s.proof.questions)||s.proof.questions.some(q=>!content.byId[q.sourceId])))throw Error('Invalid test in backup.');
 if(!s.words||!Array.isArray(s.retries)||!s.settings||!s.learnerId||!s.deviceId)throw Error('Backup is incomplete.');
 return s;
}
export function migrateLegacy(old,content,now=new Date()){
 const s=freshState(content,now);s.migration={from:'V4A/V4B',at:now.toISOString(),note:'Practice and completed proof retained. Unfinished V4 tests are not certified.'};
 for(const c of content.concepts){const p=old.progress?.[c.id];if(!p)continue;const target=s.progress[c.id];target.practiceAttempts=Number(p.practiceAttempts)||0;target.taught=target.practiceAttempts>0;target.recognised=target.taught?4:0;target.constructed=target.taught?4:0;target.independent=(old.attempts||[]).filter(a=>a.concept===c.id&&a.direction==='en-nl'&&a.kind==='typed'&&a.grammar&&!a.assisted).length;
  if(p.masteredAt){target.masteredAt=p.masteredAt;target.status='mastered';target.nextMaintenance=dayKey(now);}
  else if(p.testPassedAt){target.retentionDue=addDays(p.testPassedAt,3);target.status='retention-wait';}
  else if(target.practiceAttempts>=40){target.status='proof-ready';}
 }
 for(const a of old.attempts||[]){s.attempts.push({...a,id:'legacy-'+s.attempts.length,legacy:true,independent:a.direction==='en-nl'&&a.kind==='typed'&&!a.assisted&&a.grammar,spelling:a.spelling??null});if(a.expected&&a.direction==='en-nl')s.exposures.push({nl:normalize(a.expected),verb:a.inf||'',subject:'',family:'legacy',words:[]});if(a.prompt&&a.direction==='nl-en')s.exposures.push({nl:normalize(a.prompt),verb:a.inf||'',subject:'',family:'legacy',words:[]});}
 // V4 counted UTC dates. Conservatively use both its daily counter and today's attempt ledger.
 s.daily.count=Math.min(20,Math.max(s.attempts.filter(a=>a.date===dayKey(now)).length,old.daily?.date===dayKey(now)?old.daily.answers?.length||0:0));
 return s;
}
export function createRepository(storage,content,{key=STORAGE_KEY,now=()=>new Date()}={}){
 return {
  load(){const raw=storage.getItem(key);if(raw)return validateState(JSON.parse(raw),content);if(key===STORAGE_KEY){for(const prior of ['dutch_sentence_trainer_v4b','dutch_sentence_trainer_v4a']){const legacy=storage.getItem(prior);if(legacy){const state=migrateLegacy(JSON.parse(legacy),content,now());storage.setItem(key,JSON.stringify(state));return state}}}return freshState(content,now());},
  save(state){validateState(state,content);storage.setItem(key,JSON.stringify(state));},
  export(state){return JSON.stringify(state,null,2)},
  import(text){const s=validateState(JSON.parse(text),content);this.save(s);return s;}
 };
}
