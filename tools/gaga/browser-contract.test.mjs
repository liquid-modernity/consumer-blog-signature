import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { assertBrowserReport, browserTarget, browserRequestAllowed, releaseQualification } from './browser-contract.mjs';
const contract = JSON.parse(readFileSync('tools/gaga/browser-contract.json'));
function report() {
  return { errors: [], stats: { expected: 10, unexpected: 0, skipped: 0, flaky: 0 }, suites: [{ specs: contract.cases.map(c => ({ ...c, ok: true, tests: contract.projects.map(projectName => ({ projectName, expectedStatus: 'passed', status: 'expected', results: [{ status: 'passed', retry: 0, errors: [] }] })) })) }] };
}

test('mandatory matrix is the five actual unchanged assertions on desktop/mobile', () => {
  assert.deepEqual(contract.projects, ['desktop', 'mobile']);
  const cases=[];
  for (const file of ['application.spec.ts', 'reference.spec.ts']) {
    const text=readFileSync('tools/gaga/browser/'+file,'utf8');
    for(const m of text.matchAll(/\btest\(\s*(['"])(.*?)\1/g))cases.push({file,title:m[2]});
    const baseline=execFileSync('git',['show',contract.baselineCommit+':tools/gaga/browser/'+file],{encoding:'utf8'});
    const first=file==='application.spec.ts'?'test("native publication':'test(\'reference Site';
    const openStep = "  await page.locator('[data-gaga-action-island-toggle]').click();\n";
    if (file === 'reference.spec.ts') assert.equal(text.split(openStep).length - 1, 3, 'Only three disclosure steps are added to the existing saved journey');
    const assertions = file === 'reference.spec.ts' ? text.replaceAll(openStep, '') : text;
    assert.equal(assertions.slice(assertions.indexOf(first)),baseline.slice(baseline.indexOf(first)),'Existing mandatory assertions changed');
  }
  assert.deepEqual(contract.cases,cases);assert.equal(cases.length,5);
  assert.deepEqual(releaseQualification(),{browserPassed:10,browserFailed:0,consumer:'PASS',auditVulnerabilities:0});
  assert.equal(assertBrowserReport(report()).expected,10);
});

test('legacy count and an invented successful count are rejected',()=>{
  for(const expected of [4,9,11,'10']){const r=report();r.stats.expected=expected;assert.throws(()=>assertBrowserReport(r));}
});
for(const name of ['unexpected','skipped','flaky'])test(name+' cannot be represented as a successful release',()=>{
  const r=report();r.stats[name]=1;assert.throws(()=>assertBrowserReport(r));
});
for(const [name,change] of [
 ['missing case',r=>r.suites[0].specs[0].tests.pop()],
 ['duplicate case',r=>r.suites[0].specs[0].tests[1]=structuredClone(r.suites[0].specs[0].tests[0])],
 ['unknown project',r=>r.suites[0].specs[0].tests[0].projectName='tablet'],
 ['unknown file',r=>r.suites[0].specs[0].file='other/application.spec.ts'],
 ['unknown title',r=>r.suites[0].specs[0].title='replacement test'],
 ['failed assertion',r=>r.suites[0].specs[0].tests[0].results[0].status='failed'],
 ['skipped result',r=>r.suites[0].specs[0].tests[0].results[0].status='skipped'],
 ['retried result',r=>r.suites[0].specs[0].tests[0].results.push({status:'passed',retry:1,errors:[]})],
 ['unexpected pass',r=>r.suites[0].specs[0].tests[0].expectedStatus='failed'],
 ['runner error',r=>r.errors.push({message:'error'})],
 ['malformed results',r=>r.suites[0].specs[0].tests[0].results=null]
])test(name+' fails closed despite successful aggregate counts',()=>{const r=report();change(r);assert.throws(()=>assertBrowserReport(r));});

test('local mode admits only exact intended local origins',()=>{
  assert.equal(browserTarget(undefined).baseURL,'http://127.0.0.1:4173');
  for(const origin of contract.localOrigins)assert.equal(browserRequestAllowed(origin+'/api/search?q=test',undefined),true);
  for(const url of [contract.productionOrigin,'http://localhost:4321','http://127.0.0.1:4174','http://127.0.0.2:4173','https://localhost:4173','http://localhost:4173.evil.invalid','data:text/plain,content','blob:http://127.0.0.1:4173/id','http://user:password@localhost:4173/'])assert.equal(browserRequestAllowed(url,undefined),false);
});
test('production mode admits only its explicitly configured origin and denies local/CMS/unknown origins',()=>{
  const origin=contract.productionOrigin;
  assert.equal(browserTarget(origin).baseURL,origin);
  assert.equal(browserRequestAllowed(origin+'/publications',origin),true);
  assert.equal(browserRequestAllowed(origin+'/api/search?q=test',origin),true);
  for(const url of [...contract.localOrigins,'http://consumer-blog-signature.ratriatra.workers.dev','https://consumer-blog-signature-cms.ratriatra.workers.dev',origin+'.evil.invalid',origin+':444','https://user:password@consumer-blog-signature.ratriatra.workers.dev/','/relative'])assert.equal(browserRequestAllowed(url,origin),false);
});
test('empty, credential-bearing and unexpected production configuration never falls back to localhost',()=>{
  for(const origin of ['',...contract.localOrigins,contract.productionOrigin+'/',contract.productionOrigin+'/path','https://example.invalid','https://user:password@consumer-blog-signature.ratriatra.workers.dev'])assert.throws(()=>browserTarget(origin),/Unapproved production browser target/);
});
test('unknown contract version is rejected by the shared CLI',()=>{
  const dir=mkdtempSync(join(tmpdir(),'browser-contract-'));
  try{copyFileSync('tools/gaga/browser-contract.mjs',join(dir,'browser-contract.mjs'));writeFileSync(join(dir,'browser-contract.json'),JSON.stringify({...contract,schema:'unknown/v2'}));const r=spawnSync(process.execPath,[join(dir,'browser-contract.mjs'),'--qualification'],{encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/Unknown release browser contract/);}finally{rmSync(dir,{recursive:true,force:true});}
});
