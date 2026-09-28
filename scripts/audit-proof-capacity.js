import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {auditA1ProofCapacity} from '../src/content/a1-proof-capacity-audit.js';

const foundation=JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)));
const report=auditA1ProofCapacity(registerPacks([foundation]));
for(const row of report){
 console.log(`${row.concept.padEnd(6)} ${String(row.effective).padStart(3)} effective / ${String(row.total).padStart(3)} registered; ${row.exposureCollisions.length} exposure collisions, ${row.duplicates.length} duplicates, ${row.unpractised.length} unpractised`);
}
if(report.some(row=>row.shortfall||row.duplicates.length||row.unpractised.length))process.exitCode=1;
