import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const r=JSON.parse(readFileSync('.gaga/personal-results.json'));
assert.equal(r.stats.expected,16);assert.equal(r.stats.skipped,0);assert.equal(r.stats.unexpected,0);assert.equal(r.stats.flaky,0);assert.deepEqual(r.errors,[]);
const cases=new Set();
const titles=[...readFileSync('tools/personal/browser/personal.spec.ts','utf8').matchAll(/\btest\('([^']+)'/g)].map(m=>m[1]);
assert.equal(titles.length,8);const required=new Set(titles.flatMap(title=>['desktop','touch'].map(project=>JSON.stringify([title,project]))));
function visit(suites){for(const s of suites){for(const spec of s.specs??[]){assert.equal(spec.ok,true);for(const t of spec.tests){assert.equal(t.expectedStatus,'passed');assert.equal(t.status,'expected');assert.equal(t.results.length,1);assert.equal(t.results[0].status,'passed');assert.equal(t.results[0].retry,0);const key=JSON.stringify([spec.title,t.projectName]);assert.ok(required.has(key)&&!cases.has(key));assert.deepEqual(t.results[0].errors,[]);cases.add(key);}}visit(s.suites??[]);}}
visit(r.suites);assert.equal(cases.size,16);console.log(JSON.stringify({status:'PASS',...r.stats}));
