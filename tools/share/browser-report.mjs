import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
const r=JSON.parse(readFileSync('.gaga/share-results.json'));
assert.equal(r.stats.expected,16);assert.equal(r.stats.skipped,0);assert.equal(r.stats.unexpected,0);assert.equal(r.stats.flaky,0);assert.deepEqual(r.errors,[]);
const cases=new Set();const byteProofs=[];
const attachment=a=>JSON.parse(a.body?Buffer.from(a.body,'base64').toString():readFileSync(a.path,'utf8'));
const titles=[...readFileSync('tools/share/browser/share.spec.ts','utf8').matchAll(/\btest\('([^']+)'/g)].map(m=>m[1]);
assert.equal(titles.length,8);const required=new Set(titles.flatMap(title=>['desktop','touch'].map(project=>JSON.stringify([title,project]))));
function visit(suites){for(const s of suites){for(const spec of s.specs??[]){assert.equal(spec.ok,true);for(const t of spec.tests){assert.equal(t.expectedStatus,'passed');assert.equal(t.status,'expected');assert.equal(t.results.length,1);assert.equal(t.results[0].status,'passed');assert.equal(t.results[0].retry,0);const key=JSON.stringify([spec.title,t.projectName]);assert.ok(required.has(key)&&!cases.has(key));assert.deepEqual(t.results[0].errors,[]);for(const a of t.results[0].attachments.filter(a=>a.name==='share-source-bytes'))byteProofs.push(attachment(a));cases.add(key);}}visit(s.suites??[]);}}
visit(r.suites);assert.equal(cases.size,16);const summary={status:'PASS',...r.stats,productionInfrastructureWrites:0,sourceByteProofs:byteProofs};writeFileSync('.gaga/share-browser-summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
