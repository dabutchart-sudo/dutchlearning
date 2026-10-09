export function proofResultLabel(report){
 const test=report.type==='mastery'?'mastery test':'retention test';
 return `${report.concept} ${test}`;
}
export function proofResultHeadline(report){
 return report.passed?'You passed':'This test was not passed';
}
export function proofResultScore(report){
 const nl=report.directions['nl-en'],en=report.directions['en-nl'];
 const mark=report.type==='mastery'
  ?'A mastery test passes at 19 of 20, with at least 9 of 10 in each direction.'
  :'A retention test passes at 10 of 10.';
 return `${report.correct} of ${report.total} answers were correct. Dutch to English: ${nl.correct} of ${nl.total}. English to Dutch: ${en.correct} of ${en.total}. ${mark}`;
}
export function proofResultSummary(report){
 return `${proofResultLabel(report)}: ${report.passed?'Passed':'Not passed'}, ${report.correct} of ${report.total}`;
}
export function proofResultIsToday(report,today){
 return (report.studyDate||report.completedAt?.slice(0,10))===today;
}
