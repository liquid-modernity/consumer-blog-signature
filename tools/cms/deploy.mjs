// First CMS deployment only; resource creation belongs exclusively to provider.mjs.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),load=p=>JSON.parse(readFileSync(resolve(root,p))),spec=load('cms/production.json'),provision=load('cms/provisioning.json'),cfg=load('cms/wrangler.jsonc');
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID,out=process.env.GAGA_EVIDENCE_DIRECTORY;
assert.ok(token&&account&&out,'Existing Cloudflare credentials and external evidence directory required');
assert.ok(!resolve(out).startsWith(root+'/'),'Evidence must stay outside source');mkdirSync(out,{recursive:true});
const redact=s=>String(s).replaceAll(token,'[REDACTED]').replaceAll(account,'[ACCOUNT]');
const receipt={status:'RUNNING',sourceCommit:process.env.GITHUB_SHA??null,provisionRun:provision.runId,service:spec.serviceName,origin:spec.origin,uploadAttempts:0,resourceCreates:0};
const save=()=>writeFileSync(resolve(out,'deployment.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
async function api(path){
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method:'GET',headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(20000)});
 const body=await response.json();assert.ok(response.ok&&body.success,`Read-only provider admission failed (${response.status}; ${(body.errors??[]).map(e=>e.code)})`);
 assert.ok((body.result_info?.total_pages??1)<=1,'Partial provider inventory rejected');return body.result;
}
function wrangler(dryRun){
 const args=[resolve(root,'cms/node_modules/wrangler/bin/wrangler.js'),'deploy','--config',resolve(root,'cms/dist-cloudflare/server/wrangler.json'),'--experimental-provision=false','--experimental-auto-create=false',...(dryRun?['--dry-run','--outdir',resolve(out,'dry-run')]:[])];
 if(!dryRun){receipt.uploadAttempts++;receipt.pendingOperation='CMS_WORKER_DEPLOY_INSPECT_PROVIDER_ON_FAILURE';save();}
 const r=spawnSync(process.execPath,args,{cwd:resolve(root,'cms'),env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'},encoding:'utf8',timeout:240000,maxBuffer:8*1024*1024});
 writeFileSync(resolve(out,dryRun?'dry-run.log':'deploy.log'),redact((r.stdout??'')+(r.stderr??'')+(r.error?.message??'')),{mode:0o600});
 assert.equal(r.status,0,dryRun?'CMS dry-run failed; no upload attempted':'CMS upload failed; inspect provider before any retry');
}
try{
 assert.equal(spec.serviceName,'consumer-blog-signature-cms','Only this dedicated CMS deployment is authorized');assert.equal(spec.provisioned,true);
 const p=provision.receipt;assert.equal(p.status,'PASS');assert.equal(p.mode,'provision');assert.equal(p.preflight,'PASS');assert.equal(p.resourceMutations,3);assert.equal(p.deployments,0);assert.equal(p.created.length,3);assert.equal(p.service,spec.serviceName);assert.equal(p.origin,spec.origin);
 const resource=type=>{const rows=p.created.filter(x=>x.type===type);assert.equal(rows.length,1);return rows[0];},db=resource('D1'),media=resource('R2'),kv=resource('KV');
 assert.deepEqual([db.binding,media.binding,kv.binding],['DB','MEDIA','SESSION']);assert.deepEqual([db.name,media.name,kv.name],[spec.databaseName,spec.mediaBucket,spec.sessionNamespace]);
 assert.match(db.id,/^[a-f0-9-]{36}$/);assert.match(kv.id,/^[a-f0-9]{32}$/);assert.equal(media.id,media.name);
 const d1=[{binding:'DB',database_name:db.name,database_id:db.id}],r2=[{binding:'MEDIA',bucket_name:media.name}],namespaces=[{binding:'SESSION',id:kv.id}];
 const generated=load('cms/dist-cloudflare/server/wrangler.json');
 // Astro adds only this bookkeeping path; never relax the approved binding identities.
 if(generated.d1_databases?.[0]?.migrations_dir!==undefined){
  assert.equal(generated.d1_databases[0].migrations_dir,'../../migrations','Unexpected generated D1 migrations path');
  generated.d1_databases=generated.d1_databases.map(({migrations_dir,...binding})=>binding);
 }
 for(const config of [cfg,generated]){
  assert.equal(config.name,spec.serviceName);assert.deepEqual(config.d1_databases,d1);assert.deepEqual(config.r2_buckets,r2);assert.deepEqual(config.kv_namespaces,namespaces);
  for(const [key,empty] of Object.entries({routes:[],route:undefined,services:[],queues:{producers:[],consumers:[]},durable_objects:{bindings:[]},worker_loaders:[],unsafe:{}}))if(config[key]!==undefined)assert.deepEqual(config[key],empty,'Unexpected deployment scope: '+key);
 }
 assert.equal(cfg.workers_dev,true);assert.equal(cfg.preview_urls,false);
 const files=[];function inventory(dir){for(const f of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,f.name);if(f.isDirectory())inventory(path);else{assert.ok(f.isFile(),'Unexpected build file type');files.push({path:relative(root,path),sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});}}}inventory(resolve(root,'cms/dist-cloudflare'));receipt.buildFiles=files.sort((a,b)=>a.path.localeCompare(b.path));
 assert.equal((await api('/user/tokens/verify')).status,'active');
 assert.equal(new URL(spec.origin).hostname,`${spec.serviceName}.${(await api(`/accounts/${account}/workers/subdomain`)).subdomain}.workers.dev`);
 assert.equal((await api(`/accounts/${account}/d1/database/${db.id}`)).name,db.name);
 assert.equal((await api(`/accounts/${account}/r2/buckets/${media.name}`)).name,media.name);
 const storedKv=(await api(`/accounts/${account}/storage/kv/namespaces`)).find(x=>x.id===kv.id);assert.equal(storedKv?.title,kv.name);
 const before=await api(`/accounts/${account}/workers/scripts`);assert.ok(Array.isArray(before));assert.ok(!before.some(x=>x.id===spec.serviceName),'CMS Worker already exists; no overwrite or automatic adoption');
 const fingerprint=rows=>JSON.stringify(rows.filter(x=>x.id!==spec.serviceName).map(x=>({id:x.id,etag:x.etag,modified_on:x.modified_on})).sort((a,b)=>a.id.localeCompare(b.id)));
 receipt.preflight='PASS';receipt.bindings=p.created;save();wrangler(true);wrangler(false);
 const settings=await api(`/accounts/${account}/workers/scripts/${spec.serviceName}/settings`),bindings=settings.bindings;
 assert.equal(bindings.find(x=>x.name==='DB')?.id,db.id);assert.equal(bindings.find(x=>x.name==='MEDIA')?.bucket_name,media.name);assert.equal(bindings.find(x=>x.name==='SESSION')?.namespace_id,kv.id);
 assert.equal(fingerprint(await api(`/accounts/${account}/workers/scripts`)),fingerprint(before),'Unrelated Worker metadata changed');receipt.unrelatedWorkersUnchanged=true;
 receipt.deployments=await api(`/accounts/${account}/workers/scripts/${spec.serviceName}/deployments`);
 // Read-only readiness may poll propagation, but the upload is never retried.
 let ready;
 for(let attempt=0;attempt<6;attempt++){
  const r=await fetch(spec.origin+'/_emdash/api/setup/status',{redirect:'error',signal:AbortSignal.timeout(20000)});
  if(r.status===200){const b=await r.json();assert.equal(b.success,true);assert.equal(b.data.needsSetup,true,'Unexpected pre-existing production admin');ready=b.data;break;}
  assert.ok([404,503].includes(r.status),'Unexpected CMS readiness response: '+r.status);if(attempt<5)await new Promise(r=>setTimeout(r,3000));
 }
 assert.ok(ready,'CMS setup did not become ready; inspect deployment without uploading again');
 const admin=await fetch(spec.origin+'/_emdash/admin',{redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(admin.status,200);assert.ok((admin.headers.get('content-type')??'').includes('text/html'));
 receipt.setup=ready;receipt.adminHttpStatus=admin.status;receipt.status='PASS';delete receipt.pendingOperation;save();console.log(JSON.stringify({status:'PASS',service:spec.serviceName,origin:spec.origin,uploadAttempts:1,resourceCreates:0,needsSetup:true}));
}catch(error){receipt.status='FAIL';receipt.failure=redact(error.message);save();throw Error(receipt.failure);}
