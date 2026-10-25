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
  const preload = join(dir, "provider.mjs");
  writeFileSync(
    preload,
    `
 import {readFileSync,appendFileSync} from 'node:fs';
 const p=JSON.parse(readFileSync('cms/editorial/migration-plan.json')),s=JSON.parse(readFileSync('cms/production.json')),scenario=process.env.SCENARIO;
 const migrations=[...readFileSync('cms/node_modules/emdash/src/database/migrations/runner.ts','utf8').matchAll(/"(\\d{3}_[^"]+)": m\\d+/g)].map(x=>({name:x[1]})).sort((a,b)=>a.name.localeCompare(b.name));
 globalThis.fetch=async(url,o={})=>{
 const path=new URL(url).pathname;appendFileSync(process.env.TRACE,JSON.stringify({path,method:o.method??'GET'})+'\\n');let result;
 if(o.method==='POST'){
  assertRead();const sql=JSON.parse(o.body).sql;if(!/^SELECT [^;]+$/i.test(sql))throw Error('Forbidden mutation');let rows=[];
  if(sql.includes('_emdash_migrations'))rows=migrations;
  else if(sql.includes('FROM _emdash_collections'))rows=[{slug:'authors'},{slug:'posts'}];
  else if(sql.includes('COUNT(*)'))rows=[{count:sql.includes('ec_posts')?7:sql.includes('ec_authors')||sql.includes('users')?1:0}];
  result=[{success:true,meta:{changes:0},results:rows}];
 }else{
  if(path.endsWith('/tokens/verify'))result={status:'active'};
  else if(path.endsWith('/workers/subdomain'))result={subdomain:'ratriatra'};
  else if(path.endsWith('/time_travel/bookmark'))result={bookmark:'00000001-00000002-recoverable-bookmark'};
  else if(path.includes('/d1/database/'))result={name:s.databaseName};
  else if(path.includes('/r2/buckets/'))result={name:s.mediaBucket};
  else if(path.endsWith('/storage/kv/namespaces'))result=[{id:p.rollback.kv,title:s.sessionNamespace}];
  else if(path.endsWith('/deployments'))result={deployments:[{id:'current',versions:[{percentage:100,version_id:scenario==='wrong-version'?'changed':path.includes(s.serviceName)?p.rollback.cmsWorker:p.rollback.publicationWorker}]}]};
  else if(path.endsWith('/settings'))result={bindings:[{name:'DB',type:'d1',id:scenario==='wrong-binding'?'wrong':p.rollback.d1},{name:'MEDIA',type:'r2_bucket',bucket_name:p.rollback.r2},{name:'SESSION',type:'kv_namespace',namespace_id:p.rollback.kv}]};
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
        : scenario === "missing-artifact"
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
        CLOUDFLARE_API_TOKEN: "mock-secret",
        CLOUDFLARE_ACCOUNT_ID: "mock-account",
        GAGA_EVIDENCE_DIRECTORY: out,
        GAGA_EDITORIAL_FREEZE_CONFIRMED: "true",
        GAGA_CMS_ARTIFACT_ADMISSION: join(out, "missing.json"),
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
