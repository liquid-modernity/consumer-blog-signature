import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const version='3b493d27-84ee-47b9-a2f3-2ebd4794dadb',next='11111111-2222-4333-8444-555555555555';
function simulate(scenario){
 const dir=mkdtempSync(join(tmpdir(),'cms-deploy-')),project=join(dir,'project'),out=join(dir,'evidence'),repair=scenario.startsWith('repair-');
 for(const p of ['tools/cms','cms/dist-cloudflare/server','cms/node_modules/wrangler/bin','cms/node_modules/emdash/src/database/migrations'])mkdirSync(join(project,p),{recursive:true});
 mkdirSync(out);copyFileSync('tools/cms/deploy.mjs',join(project,'tools/cms/deploy.mjs'));
 const spec=JSON.parse(readFileSync('cms/production.json')),provision=JSON.parse(readFileSync('cms/provisioning.json')),cfg=JSON.parse(readFileSync('cms/wrangler.jsonc'));
 if(scenario==='wrong-name')cfg.name='consumer-blog-signature';if(scenario==='wrong-binding')cfg.d1_databases[0].database_id='00000000-0000-0000-0000-000000000000';if(scenario==='failed-provision')provision.receipt.status='FAIL';
 const generated={...cfg,d1_databases:cfg.d1_databases.map(x=>({...x,migrations_dir:'../../migrations'})),services:[],queues:{producers:[],consumers:[]},durable_objects:{bindings:[]},worker_loaders:[]};
 if(scenario==='migration-path')generated.d1_databases[0].migrations_dir='../../unapproved';if(scenario==='queue-binding')generated.queues.producers.push({binding:'OTHER',queue:'other'});if(scenario==='durable-binding')generated.durable_objects.bindings.push({name:'OTHER',class_name:'Other'});
 for(const [path,data]of [['cms/production.json',spec],['cms/provisioning.json',provision],['cms/wrangler.jsonc',cfg],['cms/dist-cloudflare/server/wrangler.json',generated]])writeFileSync(join(project,path),JSON.stringify(data));
 writeFileSync(join(project,'cms/node_modules/emdash/src/database/migrations/runner.ts'),'const migrations={"001_initial": m001,"002_media_status": m002};');
 writeFileSync(join(project,'cms/node_modules/wrangler/bin/wrangler.js'),`const fs=require('node:fs');const dry=process.argv.includes('--dry-run');fs.appendFileSync(process.env.TRACE,JSON.stringify({phase:dry?'dry-run':'upload',args:process.argv.slice(2)})+'\\n');if((dry&&process.env.SCENARIO==='dry-run-fails')||(!dry&&process.env.SCENARIO.includes('upload-fails'))){console.error('fake-secret fake-account');process.exit(1);}if(!dry)console.log('Current Version ID: ${next}');`);
 const archive=join(dir,'approved.zip');writeFileSync(archive,'exact admitted artifact fixture');const sha=createHash('sha256').update(readFileSync(archive)).digest('hex'),source='a'.repeat(40);
 const admission={source,run:1,expectedVersion:version,sha256:sha,archive,files:[{path:'cms/dist-cloudflare/server/wrangler.json',sha256:createHash('sha256').update(readFileSync(join(project,'cms/dist-cloudflare/server/wrangler.json'))).digest('hex')}]};
 const admissionPath=join(out,'artifact-admission.json');writeFileSync(admissionPath,JSON.stringify(admission));
 if(scenario==='repair-altered-archive')writeFileSync(archive,'altered');if(scenario==='repair-altered-tree')writeFileSync(join(project,'cms/dist-cloudflare/extra.mjs'),'unapproved');
 if(scenario!=='repair-missing-preflight')writeFileSync(join(out,'pre-deployment.json'),JSON.stringify({status:'PREFLIGHT_PASS',artifactSha256:sha,rollback:{version}}));
 const fixture=join(dir,'fetch.mjs');writeFileSync(fixture,`
import{appendFileSync,readFileSync,existsSync}from'node:fs';
const spec=JSON.parse(readFileSync(${JSON.stringify(join(project,'cms/production.json'))})),p=JSON.parse(readFileSync(${JSON.stringify(join(project,'cms/provisioning.json'))})).receipt,scenario=process.env.SCENARIO,repair=scenario.startsWith('repair-');let inventories=0,schemas=0;
const uploaded=()=>existsSync(process.env.TRACE)&&readFileSync(process.env.TRACE,'utf8').includes('"phase":"upload"');
globalThis.fetch=async(url,options={})=>{
 const path=new URL(url).pathname,sql=options.body?JSON.parse(options.body).sql:null;
 if((options.method??'GET')!=='GET'&&!(options.method==='POST'&&path.endsWith('/query')&&/^SELECT [^;]+$/i.test(sql)))throw Error('Unexpected provider mutation');
 appendFileSync(process.env.TRACE,JSON.stringify({phase:sql?'sql-read':'read',path,sql})+'\\n');let result={},status=200,success=true;
 if(sql){
  let rows=[];
  if(sql.includes('sqlite_schema')){schemas++;rows=(scenario==='repair-existing-data'||(scenario==='repair-schema-race'&&schemas>1))?[{name:'users',type:'table',sql:'CREATE TABLE users(id TEXT)'}]:[];}
  else if(sql.includes('SELECT name FROM _emdash_migrations'))rows=[{name:'001_initial'},{name:'002_media_status'}];
  else if(sql.includes('SELECT slug'))rows=[{slug:'authors'},{slug:'posts'}];
  else if(sql.includes('COUNT(*)'))rows=[{count:scenario==='repair-unexpected-content'?1:0}];
  else throw Error('Unexpected SQL '+sql);
  result=[{success:true,meta:{changes:0},results:rows}];
 }else if(path.endsWith('/tokens/verify'))result={status:'active'};
 else if(path.endsWith('/workers/subdomain'))result={subdomain:'ratriatra'};
 else if(path.includes('/d1/database/'))result={name:spec.databaseName};
 else if(path.includes('/r2/buckets/')){result={name:spec.mediaBucket};if(scenario==='read-denied'){status=401;success=false;}}
 else if(path.endsWith('/storage/kv/namespaces'))result=[{id:p.created.find(x=>x.type==='KV').id,title:spec.sessionNamespace}];
 else if(path.endsWith('/workers/scripts')){inventories++;result=(scenario==='existing-worker'||inventories>1||repair)?[{id:spec.serviceName}]:[];}
 else if(path.endsWith('/settings'))result={bindings:[{name:'DB',type:'d1',id:scenario==='repair-wrong-live-binding'?'wrong':p.created.find(x=>x.type==='D1').id},{name:'MEDIA',type:'r2_bucket',bucket_name:spec.mediaBucket},{name:'SESSION',type:'kv_namespace',namespace_id:p.created.find(x=>x.type==='KV').id}]};
 else if(path.endsWith('/deployments'))result={deployments:[{id:'deployed',versions:[{version_id:uploaded()?'${next}':scenario==='repair-wrong-version'?'wrong':'${version}',percentage:100}]}]};
 else if(path.endsWith('/setup/status'))return Response.json({success:true,data:{needsSetup:true}});
 else if(path.endsWith('/_emdash/admin'))return new Response(null,{status:302,headers:{location:scenario==='repair-external-redirect'?'https://unapproved.example/setup':'/_emdash/admin/setup'}});
 else if(path.endsWith('/_emdash/admin/setup'))return new Response('<html/>',{headers:{'content-type':'text/html'}});
 else throw Error('Unexpected path '+path);
 return Response.json({success,result,errors:success?[]:[{code:10000}]},{status});
};`);
 const trace=join(dir,'trace'),r=spawnSync(process.execPath,['--import',fixture,join(project,'tools/cms/deploy.mjs')],{env:{PATH:process.env.PATH,SCENARIO:scenario,TRACE:trace,CLOUDFLARE_API_TOKEN:'fake-secret',CLOUDFLARE_ACCOUNT_ID:'fake-account',GAGA_EVIDENCE_DIRECTORY:out,...(repair?{CMS_REPAIR_PHASE:scenario==='repair-preflight'?'preflight':'update',CMS_REPAIR_ADMISSION:admissionPath,CMS_REPAIR_SOURCE:source,CMS_REPAIR_ARTIFACT_SHA256:sha,CMS_REPAIR_EXPECTED_VERSION:version}:{})},encoding:'utf8'});
 try{const receipt=join(out,scenario==='repair-preflight'?'pre-deployment.json':'deployment.json');return{status:r.status,stderr:r.stderr,trace:existsSync(trace)?readFileSync(trace,'utf8').trim().split('\n').map(JSON.parse):[],receipt:existsSync(receipt)?JSON.parse(readFileSync(receipt)):null,log:existsSync(join(out,'deploy.log'))?readFileSync(join(out,'deploy.log'),'utf8'):''};}finally{rmSync(dir,{recursive:true,force:true});}
}
for(const scenario of ['wrong-name','wrong-binding','failed-provision','existing-worker','read-denied','dry-run-fails','migration-path','queue-binding','durable-binding','repair-wrong-version','repair-wrong-live-binding','repair-existing-data','repair-schema-race','repair-altered-archive','repair-altered-tree','repair-missing-preflight'])test('CMS '+scenario+' fails before upload or resource creation',()=>{const r=simulate(scenario);assert.notEqual(r.status,0);assert.equal(r.trace.filter(x=>x.phase==='upload').length,0);assert.equal(r.receipt.uploadAttempts,0);assert.equal(r.receipt.resourceCreates,0);});
for(const scenario of ['ok','repair-ok'])test(scenario+' uploads once with auto-provision disabled and waits for manual setup',()=>{const r=simulate(scenario);assert.equal(r.status,0,JSON.stringify(r.receipt)+' '+r.stderr);const uploads=r.trace.filter(x=>x.phase==='upload');assert.equal(uploads.length,1);assert.ok(uploads[0].args.includes('--experimental-provision=false'));assert.ok(uploads[0].args.includes('--experimental-auto-create=false'));assert.equal(r.receipt.setup.needsSetup,true);assert.equal(r.receipt.adminHttpStatus,302);assert.equal(r.receipt.setupHttpStatus,200);assert.equal(r.receipt.unrelatedWorkersUnchanged,true);assert.equal(r.receipt.resourceCreates,0);if(scenario==='repair-ok'){assert.equal(r.receipt.rollback.version,version);assert.equal(r.receipt.newVersion,next);assert.deepEqual(r.receipt.databaseAfter.counts,{ec_posts:0,ec_authors:0,revisions:0,users:0,credentials:0,_emdash_api_tokens:0});}});
test('repair preflight records rollback and fresh schema with zero uploads and no CMS initialization request',()=>{const r=simulate('repair-preflight');assert.equal(r.status,0,r.stderr);assert.equal(r.receipt.status,'PREFLIGHT_PASS');assert.equal(r.receipt.databaseBefore.classification,'fresh');assert.equal(r.trace.filter(x=>x.phase==='upload').length,0);assert.ok(!r.trace.some(x=>x.path?.includes('/_emdash/')));});
for(const scenario of ['upload-fails','repair-upload-fails'])test(scenario+' is never retried and logs redact credentials',()=>{const r=simulate(scenario);assert.notEqual(r.status,0);assert.equal(r.trace.filter(x=>x.phase==='upload').length,1);assert.equal(r.receipt.pendingOperation,'CMS_WORKER_DEPLOY_INSPECT_PROVIDER_ON_FAILURE');assert.ok(!r.log.includes('fake-secret')&&!r.log.includes('fake-account'));assert.ok(r.log.includes('[REDACTED]'));});
for(const scenario of ['repair-external-redirect','repair-unexpected-content'])test(scenario+' fails closed after the single upload without retry',()=>{const r=simulate(scenario);assert.notEqual(r.status,0);assert.equal(r.trace.filter(x=>x.phase==='upload').length,1);assert.equal(r.receipt.status,'FAIL');});
