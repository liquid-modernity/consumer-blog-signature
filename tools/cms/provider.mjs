import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),hash=x=>createHash('sha256').update(x).digest('hex');
const mode=process.argv[2]??'preflight';assert.ok(['preflight','provision'].includes(mode));
const spec=JSON.parse(readFileSync(resolve(root,'cms/production.json'))),proof=JSON.parse(readFileSync(resolve(root,'cms/migration/local-proof.json')));
assert.equal(proof.status,'PASS');assert.equal(proof.classification,'REAL_LOCAL_EMDASH_API');
assert.equal(proof.exportSha256,hash(readFileSync(resolve(root,'content/emdash/published.json'))));
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID,out=process.env.GAGA_EVIDENCE_DIRECTORY;
assert.ok(token&&account&&out,'Existing Cloudflare secrets and external evidence directory are required');
assert.ok(!out.startsWith(root+'/'),'Provider evidence must be outside the source checkout');mkdirSync(out,{recursive:true});
const receipt={status:'RUNNING',mode,service:spec.serviceName,origin:spec.origin,created:[],existing:[],resourceMutations:0,deployments:0};
function save(){writeFileSync(resolve(out,'provider.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});}
async function api(path,method='GET',body){
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(20000)});
 const json=await response.json();assert.ok(response.ok&&json.success===true,`Cloudflare ${method} ${path.includes('/d1/')?'D1':path.includes('/kv/')?'KV':path.includes('/r2/')?'R2':'identity'} failed: HTTP ${response.status}; codes ${(json.errors??[]).map(e=>e.code).join(',')}`);
 assert.ok((json.result_info?.total_pages??1)<=1&&!json.result?.is_truncated,'Inventory is paginated; refuse partial-state provisioning');return json.result;
}
try{
 const identity=await api('/user/tokens/verify');assert.equal(identity.status,'active');
 const subdomain=await api(`/accounts/${account}/workers/subdomain`);assert.equal(new URL(spec.origin).hostname,`${spec.serviceName}.${subdomain.subdomain}.workers.dev`,'Configured account/origin differs');
 const targets=[{type:'D1',binding:'DB',name:spec.databaseName,path:`/accounts/${account}/d1/database`,body:{name:spec.databaseName}},{type:'R2',binding:'MEDIA',name:spec.mediaBucket,path:`/accounts/${account}/r2/buckets`,body:{name:spec.mediaBucket}},{type:'KV',binding:'SESSION',name:spec.sessionNamespace,path:`/accounts/${account}/storage/kv/namespaces`,body:{title:spec.sessionNamespace}}];
 // Every read must pass before the first write. Never retry a create or adopt an ambiguous existing store.
 for(const t of targets){const result=await api(t.path),list=Array.isArray(result)?result:result.buckets;assert.ok(Array.isArray(list));const found=list.filter(r=>(r.name??r.title)===t.name);assert.equal(found.length,0,`Existing ${t.type} target requires ownership review; no overwrite or automatic adoption`);}
 receipt.preflight='PASS';save();
 if(mode==='provision')for(const t of targets){receipt.pendingOperation={type:t.type,name:t.name,status:'INSPECT_PROVIDER_ON_FAILURE'};save();const result=await api(t.path,'POST',t.body);const id=result.uuid??result.id??result.name;assert.ok(id);receipt.created.push({type:t.type,binding:t.binding,name:t.name,id});receipt.resourceMutations++;delete receipt.pendingOperation;save();}
 receipt.status='PASS';save();console.log(JSON.stringify({status:receipt.status,mode,resourceMutations:receipt.resourceMutations,deployments:0}));
}catch(error){receipt.status='FAIL';receipt.failure=String(error.message).replaceAll(token,'[REDACTED]').replaceAll(account,'[ACCOUNT]');save();throw Error(receipt.failure);}
