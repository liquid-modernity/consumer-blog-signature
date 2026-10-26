import {createHash} from 'node:crypto';
import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
function simulate(scenario) {
  const dir = mkdtempSync(join(tmpdir(), "rich-provider-")),
    project = join(dir, "project"),
    out = join(dir, "evidence");
  for (const p of [
    "tools/editorial",
    "cms/editorial",
    "cms/node_modules/emdash/src/database/migrations",
  ])
    mkdirSync(join(project, p), { recursive: true });
  mkdirSync(out);
  for (const p of [
    "tools/editorial/production-control.mjs",
    "tools/editorial/provider-bindings.mjs",
    "cms/editorial/migration-plan.json",
    "cms/production.json",
    "cms/wrangler.jsonc",
  ])
    copyFileSync(p, join(project, p));
  const runner = readFileSync(
    "cms/node_modules/emdash/src/database/migrations/runner.ts",
    "utf8",
  );
  writeFileSync(
    join(project, "cms/node_modules/emdash/src/database/migrations/runner.ts"),
    runner,
  );
  const isDeploy=['forward-deploy','state-change','upload-fails'].includes(scenario);
  if(isDeploy){
    mkdirSync(join(project,'cms/dist-cloudflare/server'),{recursive:true});mkdirSync(join(project,'cms/node_modules/wrangler/bin'),{recursive:true});
    const cfg=JSON.parse(readFileSync('cms/wrangler.jsonc'));
    writeFileSync(join(project,'cms/dist-cloudflare/server/wrangler.json'),JSON.stringify(cfg));
    writeFileSync(join(project,'cms/dist-cloudflare/server/entry.mjs'),'export default {}');
    writeFileSync(join(project,'cms/node_modules/wrangler/bin/wrangler.js'),`const fs=require('node:fs');if(!process.argv.includes('--dry-run')){fs.appendFileSync(process.env.TRACE,JSON.stringify({phase:'upload'})+'\\n');fs.writeFileSync(process.env.DEPLOYED,'yes');if(process.env.SCENARIO==='upload-fails')process.exit(1);console.log('Current Version ID: 11111111-1111-4111-8111-111111111111');}`);
    const hash=x=>createHash('sha256').update(x).digest('hex');
    const files=['entry.mjs','wrangler.json'].map(n=>({path:'cms/dist-cloudflare/server/'+n,sha256:hash(readFileSync(join(project,'cms/dist-cloudflare/server',n)))}));
    writeFileSync(join(out,'archive.zip'),'qualified');
    writeFileSync(join(out,'admission.json'),JSON.stringify({status:'PASS',archive:join(out,'archive.zip'),artifactSha256:hash('qualified'),qualificationRun:123,expectedState:{cms:'e69a0e28-0788-4b8b-80af-77ae17296896',publication:'51f60924-2ec7-4cc0-831f-e36aff523b62'},files}));
  }
  const preload = join(dir, "provider.mjs");
  writeFileSync(
    preload,
    `
 import {readFileSync,appendFileSync,existsSync} from 'node:fs';
 const p=JSON.parse(readFileSync('cms/editorial/migration-plan.json')),s=JSON.parse(readFileSync('cms/production.json')),scenario=process.env.SCENARIO;const expected=process.env.GAGA_EXPECTED_PRODUCTION_STATE?JSON.parse(process.env.GAGA_EXPECTED_PRODUCTION_STATE):{cms:p.rollback.cmsWorker,publication:p.rollback.publicationWorker};
 const migrations=[...readFileSync('cms/node_modules/emdash/src/database/migrations/runner.ts','utf8').matchAll(/"(\\d{3}_[^"]+)": m\\d+/g)].map(x=>({name:x[1]})).sort((a,b)=>a.name.localeCompare(b.name));
 globalThis.fetch=async(url,o={})=>{
 const path=new URL(url).pathname;appendFileSync(process.env.TRACE,JSON.stringify({path,method:o.method??'GET'})+'\\n');let result;
 if(path==='/_emdash/api/setup/status')return Response.json({success:true,data:{needsSetup:false}});
 if(path==='/_emdash/admin')return new Response('Login',{status:200});
 if(o.method==='POST'){
  assertRead();const sql=JSON.parse(o.body).sql;if(!/^SELECT [^;]+$/i.test(sql))throw Error('Forbidden mutation');let rows=[];
  if(sql.includes('_emdash_migrations'))rows=migrations;
  else if(scenario==='native-enabled'&&sql.includes('FROM options'))rows=[{value:'true'}];
  else if(sql.includes('FROM _emdash_collections'))rows=(['forward-deploy','state-change','upload-fails'].includes(scenario)?['authors','pages','posts','references','sections']:['authors','posts']).map(slug=>({slug}));
  else if(scenario==='state-change'&&existsSync(process.env.DEPLOYED)&&sql.includes('SELECT * FROM ec_posts'))rows=[{changed:true}];
  else if(sql.includes('COUNT(*)'))rows=[{count:sql.includes('ec_posts')?7:sql.includes('ec_authors')||sql.includes('users')?1:0}];
  result=[{success:true,meta:{changes:0},results:rows}];
 }else{
  if(path.endsWith('/tokens/verify'))result={status:'active'};
  else if(path.endsWith('/workers/subdomain'))result={subdomain:'ratriatra'};
  else if(path.endsWith('/time_travel/bookmark'))result={bookmark:'00000001-00000002-recoverable-bookmark'};
  else if(path.includes('/d1/database/'))result={name:s.databaseName};
  else if(path.includes('/r2/buckets/'))result={name:s.mediaBucket};
  else if(path.endsWith('/storage/kv/namespaces'))result=[{id:p.rollback.kv,title:s.sessionNamespace}];
  else if(path.endsWith('/deployments'))result={deployments:[{id:'current',versions:[{percentage:100,version_id:['wrong-version','forward-drift'].includes(scenario)?'changed':path.includes(s.serviceName)?existsSync(process.env.DEPLOYED)?'11111111-1111-4111-8111-111111111111':expected.cms:expected.publication}]}]};
  else if(path.endsWith('/settings'))result={bindings:[{name:'DB',type:'d1',id:scenario==='wrong-binding'?'wrong':p.rollback.d1},{name:'MEDIA',type:'r2_bucket',bucket_name:p.rollback.r2},{name:'SESSION',type:'kv_namespace',namespace_id:p.rollback.kv},...(['secret-declared','secret-unexpected','secret-wrong-type'].includes(scenario)?[{name:'EMDASH_ENCRYPTION_KEY',type:scenario==='secret-wrong-type'?'plain_text':'secret_text',text:'synthetic-value-must-never-be-recorded'}]:[])]};
  else throw Error('Unexpected provider path');
 }
 return Response.json({success:true,result});
 };
 function assertRead(){};
 `,
  );
  const trace = join(dir, "trace"),
    mode =
      scenario === "backup"
        ? "backup"
        : (scenario === "missing-artifact" || isDeploy)
          ? "deploy-cms"
          : "inspect";
  const r = spawnSync(
    process.execPath,
    [
      "--import",
      preload,
      join(project, "tools/editorial/production-control.mjs"),
      mode,
    ],
    {
      cwd: project,
      env: {
        PATH: process.env.PATH,
        SCENARIO: scenario,
        TRACE: trace,
        DEPLOYED:join(dir,'deployed'),
        GAGA_CONTENT_RELEASE_ENABLED:'false',
        GITHUB_REF:'refs/heads/main',
        ...(['forward','forward-drift','malformed-expectation','forward-deploy','state-change','upload-fails','native-enabled'].includes(scenario)?{GAGA_EXPECTED_PRODUCTION_STATE:JSON.stringify(scenario==='malformed-expectation'?{cms:'latest',publication:'unknown'}:{cms:'e69a0e28-0788-4b8b-80af-77ae17296896',publication:'51f60924-2ec7-4cc0-831f-e36aff523b62'})}:{}),
        ...(['secret-declared','secret-missing','secret-wrong-type'].includes(scenario)?{GAGA_EXPECTED_PRODUCTION_STATE:JSON.stringify({cms:'e69a0e28-0788-4b8b-80af-77ae17296896',publication:'51f60924-2ec7-4cc0-831f-e36aff523b62',cmsSecretBindings:[{name:'EMDASH_ENCRYPTION_KEY',kind:'secret',identity:'consumer-blog-signature-cms/EMDASH_ENCRYPTION_KEY',present:true}]})}:{}),
        CLOUDFLARE_API_TOKEN: "mock-secret",
        CLOUDFLARE_ACCOUNT_ID: "mock-account",
        GAGA_EVIDENCE_DIRECTORY: out,
        GAGA_EDITORIAL_FREEZE_CONFIRMED: "true",
        GAGA_CMS_ARTIFACT_ADMISSION: join(out,isDeploy?"admission.json":"missing.json"),
      },
      encoding: "utf8",
    },
  );
  try {
    return {
      code: r.status,
      error: r.stderr,
      receipt: JSON.parse(
        readFileSync(join(out, "production-" + mode + ".json")),
      ),
      requests: existsSync(trace)
        ? readFileSync(trace, "utf8").trim().split("\n").map(JSON.parse)
        : [],
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
for (const scenario of ["wrong-version", "wrong-binding", "missing-artifact"])
  test(
    "production " + scenario + " stops before upload or resource mutation",
    () => {
      const r = simulate(scenario);
      assert.notEqual(r.code, 0);
      assert.equal(r.receipt.uploads, 0);
      assert.equal(r.receipt.contentWrites, 0);
      assert.equal(r.receipt.schemaWrites, 0);
      assert.ok(
        r.requests.every(
          (r) => r.method === "GET" || r.path.endsWith("/query"),
        ),
      );
    },
  );
for (const scenario of ["inspect", "backup"])
  test(
    "production " +
      scenario +
      " preserves only read-only coordinated recovery evidence",
    () => {
      const r = simulate(scenario);
      assert.equal(r.code, 0, r.error);
      assert.equal(r.receipt.status, "PASS");
      assert.equal(r.receipt.uploads, 0);
      assert.equal(r.receipt.resourceCreates, 0);
      if (scenario === "backup") assert.ok(r.receipt.recovery.bookmark);
      assert.ok(!JSON.stringify(r.receipt).includes("mock-secret"));
    },
  );

test('forward production state is admitted without rewriting historical migration rollback pins',()=>{
 const r=simulate('forward');assert.equal(r.code,0,r.error);assert.equal(r.receipt.cms.version,'e69a0e28-0788-4b8b-80af-77ae17296896');assert.equal(r.receipt.uploads,0);
});
test('explicit forward expectation still rejects production drift before upload',()=>{
 const r=simulate('forward-drift');assert.notEqual(r.code,0);assert.equal(r.receipt.uploads,0);assert.equal(r.receipt.schemaWrites,0);assert.equal(r.receipt.contentWrites,0);
});

test('admitted forward CMS deployment uploads once and proves schema/editorial state unchanged',()=>{
 const r=simulate('forward-deploy');assert.equal(r.code,0,r.error);assert.equal(r.receipt.uploads,1);assert.equal(r.receipt.newVersion,'11111111-1111-4111-8111-111111111111');assert.deepEqual(r.receipt.preservedAfter,r.receipt.preservedBefore);assert.equal(r.receipt.contentWrites,0);assert.equal(r.receipt.schemaWrites,0);
});
for(const scenario of ['state-change','upload-fails'])test(scenario+' stops after one upload and preserves failure evidence',()=>{
 const r=simulate(scenario);assert.notEqual(r.code,0);assert.equal(r.receipt.uploads,1);assert.equal(r.requests.filter(x=>x.phase==='upload').length,1);assert.equal(r.receipt.status,'FAIL');
});

test('native publishing enabled blocks foundation admission without upload or content/schema writes',()=>{const r=simulate('native-enabled');assert.notEqual(r.code,0);assert.equal(r.receipt.uploads,0);assert.equal(r.receipt.contentWrites,0);assert.equal(r.receipt.schemaWrites,0);});

test('declared production secret metadata is inspected without value disclosure',()=>{
 const r=simulate('secret-declared');assert.equal(r.code,0,r.error);assert.equal(r.receipt.status,'PASS');assert.equal(r.receipt.uploads,0);assert.equal(r.receipt.contentWrites,0);assert.equal(r.receipt.schemaWrites,0);
 assert.deepEqual(r.receipt.bindings.find(b=>b.kind==='secret'),{name:'EMDASH_ENCRYPTION_KEY',kind:'secret',identity:'consumer-blog-signature-cms/EMDASH_ENCRYPTION_KEY',present:true});
 assert.ok(!JSON.stringify(r).includes('synthetic-value-must-never-be-recorded'));
});
for(const scenario of ['secret-unexpected','secret-missing','secret-wrong-type'])test(scenario+' fails with zero provider mutations',()=>{
 const r=simulate(scenario);assert.notEqual(r.code,0);assert.equal(r.receipt.uploads,0);assert.equal(r.receipt.contentWrites,0);assert.equal(r.receipt.schemaWrites,0);assert.ok(!JSON.stringify(r).includes('synthetic-value-must-never-be-recorded'));assert.ok(r.requests.every(x=>x.method==='GET'||x.path.endsWith('/query')));
});
test('pure metadata inspection never accesses secret values and rejects wrong Worker declarations',async()=>{
 const {inspectCmsBindings,admitExpectedState}=await import('./provider-bindings.mjs');const worker='consumer-blog-signature-cms',resources={d1:'database',r2:'bucket',kv:'namespace'},secret={name:'EMDASH_ENCRYPTION_KEY',kind:'secret',identity:worker+'/EMDASH_ENCRYPTION_KEY',present:true};
 const row={name:secret.name,type:'secret_text'};for(const k of ['value','text'])Object.defineProperty(row,k,{enumerable:true,get(){throw Error('Secret value was read');}});
 const actual=[{name:'DB',type:'d1',id:resources.d1},{name:'MEDIA',type:'r2_bucket',bucket_name:resources.r2},{name:'SESSION',type:'kv_namespace',namespace_id:resources.kv},row];
 const result=inspectCmsBindings(actual,{worker,resources,secrets:[secret]});assert.deepEqual(result.find(x=>x.kind==='secret'),secret);assert.ok(!JSON.stringify(result).includes('"text"'));
 for(const change of [{identity:'another-worker/EMDASH_ENCRYPTION_KEY'},{kind:'plain_text'},{present:false},{value:'do-not-record'},{name:undefined}])assert.throws(()=>admitExpectedState({cms:'11111111-1111-4111-8111-111111111111',publication:'22222222-2222-4222-8222-222222222222',cmsSecretBindings:[{...secret,...change}]},worker));
 assert.throws(()=>inspectCmsBindings([...actual,row],{worker,resources,secrets:[secret]}));assert.throws(()=>inspectCmsBindings([...actual,{name:'OTHER',type:'assets'}],{worker,resources,secrets:[secret]}));
});
