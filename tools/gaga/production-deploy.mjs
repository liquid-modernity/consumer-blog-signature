// Main-only exact-artifact publication deployment; rollback is pinned to its own prior receipt.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {sourceIdentity} from './source-identity.mjs';
import {releaseQualification} from './browser-contract.mjs';
const root=process.cwd(),out=process.env.GAGA_EVIDENCE_DIRECTORY,phase=process.env.PUBLICATION_PHASE,token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID;
assert.ok(out&&token&&account);assert.ok(!resolve(out).startsWith(root+'/'));mkdirSync(out,{recursive:true});assert.ok(['preflight','deploy','rollback'].includes(phase));
const load=path=>JSON.parse(readFileSync(path)),sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex'),redact=s=>String(s).replaceAll(token,'[REDACTED]').replaceAll(account,'[ACCOUNT]');
const name='consumer-blog-signature',origin='https://consumer-blog-signature.ratriatra.workers.dev',base=`/accounts/${account}/workers/scripts/${name}`;
let receipt={status:'RUNNING',phase,sourceCommit:process.env.GITHUB_SHA,worker:name,origin,uploadAttempts:0,resourceCreates:0};
const save=()=>writeFileSync(resolve(out,phase==='preflight'?'pre-deployment.json':phase==='rollback'?'rollback.json':'deployment.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
async function api(path,body){
 if(body)assert.ok(phase==='rollback'&&path===base+'/deployments','Unapproved API mutation');
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(25000)});
 const b=await r.json();assert.ok(r.ok&&b.success,`Provider ${body?'rollback':'read'} failed HTTP ${r.status}; codes ${(b.errors??[]).map(x=>x.code)}`);
 // Cloudflare defines deployments[0] on page one as active; older history need not be fetched.
 if(!body&&path===base+'/deployments'){
  receipt.activeDeploymentReadback={page:b.result_info?.page??1,totalPages:b.result_info?.total_pages??1};
  assert.equal(receipt.activeDeploymentReadback.page,1,'Active deployment must come from page one');
 }else assert.ok((b.result_info?.total_pages??1)<=1,`Partial provider inventory rejected: ${redact(path)}`);
 return b.result;
}
function active(state){const d=state.deployments?.[0];assert.ok(d?.id);assert.equal(d.versions?.length,1);assert.equal(d.versions[0].percentage,100);return {deployment:d.id,version:d.versions[0].version_id};}
const fingerprint=rows=>rows.filter(x=>x.id!==name).map(({id,etag,modified_on})=>({id,etag:etag??null,modified_on:modified_on??null})).sort((a,b)=>a.id.localeCompare(b.id));
function artifact(){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main','Production deployment requires canonical main');
 const m=load('.gaga/deployment-manifest.json'),a=load(resolve(out,'artifact-admission.json'));assert.equal(a.status,'PASS');assert.equal(a.sourceCommit,process.env.GITHUB_SHA);assert.equal(sha(a.archive),a.artifactSha256,'Qualified ZIP changed');
 assert.equal(m.sourceCommit,process.env.GITHUB_SHA);assert.equal(m.production,true);assert.equal(String(m.qualificationRun),String(a.qualificationRun));assert.deepEqual(m.qualification,releaseQualification());
 const source=sourceIdentity();assert.equal(source.commit,m.sourceCommit);assert.equal(source.tree,m.sourceTree);assert.equal(source.sha256,m.sourceSha256);
 for(const f of m.files){assert.ok(/^(dist\/|worker\/bundle\.mjs$|wrangler\.jsonc$)/.test(f.path)&&!f.path.split('/').includes('..'));assert.equal(sha(f.path),f.sha256,'Qualified artifact changed: '+f.path);}
 assert.equal(sha('content/emdash/published.json'),m.productionExportSha256);assert.equal(sha('content/emdash/published-receipt.json'),m.contentReceiptSha256);
 const c=load('wrangler.jsonc');assert.equal(c.name,name);assert.equal(c.main,'worker/bundle.mjs');assert.equal(c.no_bundle,true);assert.deepEqual(c.compatibility_flags,['no_nodejs_compat','no_nodejs_compat_v2']);assert.deepEqual(c.assets,{directory:'./dist',binding:'ASSETS',not_found_handling:'404-page',html_handling:'auto-trailing-slash',run_worker_first:['/api/search']});assert.ok(Object.keys(c).every(k=>['$schema','name','main','no_bundle','compatibility_date','compatibility_flags','assets'].includes(k)));
 receipt.artifactSha256=a.artifactSha256;receipt.qualificationRun=a.qualificationRun;receipt.sourceSha256=m.sourceSha256;receipt.sourceTree=m.sourceTree;receipt.planSha256=m.planSha256;receipt.productionExportSha256=m.productionExportSha256;return m;
}
function wrangler(dry){
 const args=[resolve('node_modules/wrangler/bin/wrangler.js'),'deploy','--config',resolve('wrangler.jsonc'),'--experimental-provision=false','--experimental-auto-create=false',...(dry?['--dry-run','--outdir',resolve(out,'dry-run')]:[])];
 if(!dry){receipt.uploadAttempts++;receipt.pendingOperation='PUBLICATION_UPLOAD_INSPECT_PROVIDER_BEFORE_RETRY';save();}
 const r=spawnSync(process.execPath,args,{cwd:root,env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'},encoding:'utf8',timeout:240000,maxBuffer:8*1024*1024});writeFileSync(resolve(out,dry?'dry-run.log':'deploy.log'),redact((r.stdout??'')+(r.stderr??'')+(r.error?.message??'')),{mode:0o600});assert.equal(r.status,0,dry?'Dry-run failed before upload':'Upload failed; inspect provider state, never retry blindly');
}
async function waitVersion(expected,previous){let state;for(let i=0;i<6;i++){state=active(await api(base+'/deployments'));if(state.version===expected)return state;assert.equal(state.version,previous,'Unexpected concurrent deployment');if(i<5)await new Promise(r=>setTimeout(r,2000));}throw Error('Version readback did not reach expected version');}
try{
 assert.equal(process.env.GITHUB_REF,'refs/heads/main','Production operations require canonical main');
 if(phase==='rollback'){
  const prior=load(resolve(out,'pre-deployment.json'));let deploy;try{deploy=load(resolve(out,'deployment.json'));}catch{}
  assert.equal(prior.worker,name);assert.equal(prior.sourceCommit,process.env.GITHUB_SHA);assert.equal(prior.status,'PREFLIGHT_PASS');const current=active(await api(base+'/deployments'));
  if(!deploy?.uploadAttempts||current.version===prior.previous.version){assert.equal(current.version,prior.previous.version);receipt.status='NOT_REQUIRED';receipt.active=current;save();process.exit(0);}
  assert.equal(deploy.uploadAttempts,1);assert.ok(deploy.newVersion,'Ambiguous upload ownership; operator inspection required');assert.equal(current.version,deploy.newVersion,'Do not rollback another deployment');receipt.previous=prior.previous;receipt.failedVersion=current.version;receipt.pendingOperation='ONE_ROLLBACK';save();
  const restored=await api(base+'/deployments',{strategy:'percentage',versions:[{version_id:prior.previous.version,percentage:100}],annotations:{'workers/message':'Restore previous publication after failed production verification'}});receipt.rollbackDeployment=restored.id;receipt.active=await waitVersion(prior.previous.version,current.version);receipt.status='PASS';delete receipt.pendingOperation;save();process.exit(0);
 }
 artifact();assert.equal((await api('/user/tokens/verify')).status,'active');assert.equal((await api(`/accounts/${account}/workers/subdomain`)).subdomain,'ratriatra');
 const workers=await api(`/accounts/${account}/workers/scripts`);assert.ok(workers.some(x=>x.id===name),'Refuse creating a parallel production Worker');receipt.unrelatedBefore=fingerprint(workers);
 const current=active(await api(base+'/deployments'));
 if(phase==='preflight'){receipt.previous=current;receipt.previousBindings=(await api(base+'/settings')).bindings.map(({name,type})=>({name,type}));wrangler(true);artifact();receipt.status='PREFLIGHT_PASS';save();process.exit(0);}
 const prior=load(resolve(out,'pre-deployment.json'));assert.equal(prior.status,'PREFLIGHT_PASS');assert.equal(prior.sourceCommit,process.env.GITHUB_SHA);assert.equal(prior.artifactSha256,receipt.artifactSha256);assert.deepEqual(current,prior.previous,'Production changed since preflight');assert.deepEqual(receipt.unrelatedBefore,prior.unrelatedBefore,'Unrelated Workers changed since admission');receipt.previous=prior.previous;save();artifact();wrangler(false);
 const match=readFileSync(resolve(out,'deploy.log'),'utf8').match(/Current Version ID:\s*([a-f0-9-]{36})/);assert.ok(match,'Upload result lacks unambiguous version');receipt.newVersion=match[1];save();assert.notEqual(receipt.newVersion,receipt.previous.version);receipt.deployment=await waitVersion(receipt.newVersion,receipt.previous.version);
 const bindings=(await api(base+'/settings')).bindings;assert.ok(bindings.length===1&&bindings[0].name==='ASSETS'&&bindings[0].type==='assets','Unexpected publication runtime bindings');receipt.bindings=bindings;
 assert.deepEqual(fingerprint(await api(`/accounts/${account}/workers/scripts`)),prior.unrelatedBefore,'Unrelated Workers changed');receipt.unrelatedWorkersUnchanged=true;receipt.status='DEPLOYED_AWAITING_PUBLIC_VERIFICATION';delete receipt.pendingOperation;save();console.log(JSON.stringify({status:receipt.status,version:receipt.newVersion,previous:receipt.previous.version,uploadAttempts:1,rebuilds:0}));
}catch(error){receipt.status='FAIL';receipt.failure=redact(error.message);save();throw Error(receipt.failure);}
