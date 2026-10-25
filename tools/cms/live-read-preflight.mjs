// Production read-token proof only: no write request, token management or import.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const origin=process.env.CMS_ORIGIN,token=process.env.CMS_READ_TOKEN,out=process.env.GAGA_EVIDENCE_DIRECTORY;
assert.equal(origin,'https://consumer-blog-signature-cms.ratriatra.workers.dev','Unexpected CMS_ORIGIN');
assert.ok(typeof token==='string'&&/^ec_pat_[A-Za-z0-9_-]+$/.test(token),'CMS_READ_TOKEN is missing or unrecognized');
assert.ok(out&&!resolve(out).startsWith(resolve(import.meta.dirname,'../..')+'/'),'External evidence required');mkdirSync(out,{recursive:true});
const receipt={status:'RUNNING',mode:'authenticated-production-read-preflight',origin,reads:[],contentMutations:0,credentialMutations:0};
async function get(path,bearer=token){
 const r=await fetch(origin+'/_emdash/api/'+path,{method:'GET',headers:bearer?{Authorization:'Bearer '+bearer}:{},redirect:'error',signal:AbortSignal.timeout(25000)});
 const bytes=Buffer.from(await r.arrayBuffer());assert.ok(bytes.length<2*1024*1024);const b=JSON.parse(bytes);receipt.reads.push({path,authenticated:bearer===token,status:r.status,success:b.success,errorCode:b.error?.code??null});return {status:r.status,body:b};
}
try{
 const setup=await get('setup/status',null);assert.equal(setup.status,200);assert.equal(setup.body.data.needsSetup,false);
 receipt.collections=[];
 for(const collection of ['authors','posts']){
  const a=await get(`content/${collection}?status=published&limit=100`);assert.equal(a.status,200,'Published-content authentication failed');assert.equal(a.body.success,true);assert.ok(Array.isArray(a.body.data.items));assert.equal(a.body.data.items.length,0,'Expected empty production collection before import');
  const b=await get(`content/${collection}?status=published&limit=100`);assert.deepEqual(b.body.data,a.body.data,'Provider list changed during preflight');
  const drafts=await get(`content/${collection}?status=draft&limit=100`);assert.equal(drafts.status,200);assert.equal(drafts.body.data.items.length,0,'Unexpected draft content before import');
  receipt.collections.push({collection,published:0,observedDrafts:0,stable:true});
 }
 for(const bearer of [null,'ec_pat_invalid_production_negative_control'])assert.ok([401,403].includes((await get('content/posts?status=published&limit=1',bearer)).status),'Unauthorized read unexpectedly succeeded');
 const schema=await get('schema/collections'),admin=await get('admin/api-tokens');assert.equal(schema.status,403);assert.equal(admin.status,403);assert.equal(schema.body.error?.code,'INSUFFICIENT_SCOPE');assert.equal(admin.body.error?.code,'INSUFFICIENT_SCOPE');
 const trash=await get('content/posts/trash?limit=1');assert.ok([200,403].includes(trash.status));
 receipt.draftBoundary={endpointStatus:trash.status,negativeDraftBodyProof:'Not possible: no drafts exist and no test records were created.',policy:'EmDash evaluates draft visibility using the token owner role as well as token scopes. content:read alone is not proof of draft blindness. Export must request published records and Corps must reject draft overlays.'};
 receipt.readAuthentication='PASS';receipt.publishedReadAccess='PASS';receipt.unauthorizedRejected=true;receipt.schemaAndAdminScopesDenied=true;receipt.writeAuthorization='NOT_AVAILABLE: content:write is required by the installed content REST middleware; no write probe was attempted.';receipt.status='PASS';
}catch(error){receipt.status='FAIL';receipt.failure=String(error.message).replaceAll(token,'[REDACTED]');throw Error(receipt.failure);}
finally{writeFileSync(resolve(out,'live-read-preflight.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({status:receipt.status,contentMutations:0,credentialMutations:0}));}
