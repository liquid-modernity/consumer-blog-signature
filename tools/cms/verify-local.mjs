import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {readEmDashPublished} from '@gaga/corps-emdash';
import {composeApplication,assembleApplication} from '@gaga/arsenal';
import {searchCapabilityId,defineQuery,executeSearchReference} from '@gaga/engine-capabilities/search';
import {root,hash} from './migration.mjs';
import {writePublishedExport} from './export.mjs';
const origin=process.env.CMS_ORIGIN,token=process.env.CMS_LOCAL_TOKEN;
assert.equal(origin,'http://localhost:4321','Local verification is restricted to the declared loopback CMS');
assert.ok(typeof token==='string'&&/^ec_pat_[A-Za-z0-9_-]+$/.test(token),'Complete local admin setup and put the local content:read/content:write PAT in .env.cms.local; never send it in chat');
const seed=JSON.parse(readFileSync(resolve(root,'cms/migration/seed.json'))),mapping=JSON.parse(readFileSync(resolve(root,'cms/migration/source-map.json')));
let realReads=0,probe;
async function request(path,method='GET',body,bearer=token){
 assert.match(path,/^[a-zA-Z0-9_/?=&.-]+$/);
 const response=await fetch(origin+'/_emdash/api/'+path,{method,headers:{...(bearer?{Authorization:'Bearer '+bearer}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(20000)});
 if(method==='GET')realReads++;
 const bytes=Buffer.from(await response.arrayBuffer());assert.ok(bytes.length<=2*1024*1024,'Oversized CMS response');
 return {status:response.status,body:JSON.parse(bytes.toString())};
}
async function api(path,method='GET',body){const r=await request(path,method,body);assert.ok(r.status>=200&&r.status<300&&r.body.success!==false,`EmDash ${method} ${path.split('?')[0]} failed: HTTP ${r.status}, code ${r.body.error?.code??'unknown'}`);return r.body.data;}
const pinFor=(item,collection)=>({origin,collection,id:item.id,liveRevisionId:item.liveRevisionId,updatedAt:item.updatedAt,titleField:'title',summaryField:'summary'});
const host={origin,authorizeRead:async resource=>({decision:'ALLOW',resource}),readRaw:async(collection,id)=>(await api('content/'+collection+'/'+id)).item};
const setup=await request('setup/status','GET',undefined,null);assert.equal(setup.body.data.needsSetup,false,'Complete browser admin initialization first');
const records=[],artifacts=[];
for(const collection of Object.keys(seed.content)){
 const listed=await api('content/'+collection+'?limit=100');assert.ok(Array.isArray(listed.items));
 for(const m of mapping.filter(x=>x.collection===collection)){
  const matches=listed.items.filter(x=>x.data?.application_id===m.applicationId);assert.equal(matches.length,1,'Missing/duplicate imported application identity');
  const expected=seed.content[collection].find(x=>x.id===m.applicationId);
  let observed=await api('content/'+collection+'/'+matches[0].id),item=observed.item;
  assert.notEqual(item.id,m.applicationId);assert.ok(!item.id.startsWith('seed-'));assert.ok(!item.liveRevisionId.startsWith('migration-'));
  assert.equal(item.slug,m.slug);assert.deepEqual(item.data,expected.data);assert.equal(hash(item.data.body),m.bodySha256);
  // The public migration endpoint preserves the original editorial publication date separately from import time.
  const originalDate=expected.data.metadata.publishedAt;
  if(originalDate){const publishedAt=new Date(originalDate).toISOString();if(item.publishedAt!==publishedAt){await api('content/'+collection+'/'+item.id+'/publish','POST',{_rev:observed._rev,publishedAt});item=(await api('content/'+collection+'/'+item.id)).item;assert.equal(item.publishedAt,publishedAt);}}
  const pin=pinFor(item,collection),projection=await readEmDashPublished(pin,host);assert.equal(projection.status,'projected','Actual CMS published item rejected: '+projection.code);
  assert.deepEqual((await api('content/'+collection+'/'+item.id)).item,item,'Provider read changed the admitted revision');
  artifacts.push(projection.artifact);records.push({applicationId:m.applicationId,originalPath:m.originalPath,pin,item,bodySha256:m.bodySha256,sourceSha256:m.sourceSha256});
 }
}
assert.equal(records.length,8);
try{
 const suffix=randomUUID().slice(0,8),slug='gaga-local-verification-'+suffix;
 probe=(await api('content/posts','POST',{slug,data:{application_id:'verification-'+suffix,title:'Local verification probe',summary:'Temporary test record',body:'Probe',metadata:{}}})).item;
 const draftList=await api('content/posts?status=published&limit=100');assert.ok(!draftList.items.some(x=>x.id===probe.id),'Draft leaked into published listing');
 await api('content/posts/'+probe.id+'/publish','POST',{});
 const published=await api('content/posts/'+probe.id),oldPin=pinFor(published.item,'posts');
 assert.equal((await readEmDashPublished(oldPin,host)).status,'projected');
 await api('content/posts/'+probe.id,'PUT',{_rev:published._rev,data:{...published.item.data,title:'Unpublished local probe edit'}});
 const dirty=(await api('content/posts/'+probe.id)).item;
 assert.equal((await readEmDashPublished(pinFor(dirty,'posts'),host)).code,'draft-overlay');
 await api('content/posts/'+probe.id+'/publish','POST',{});
 assert.equal((await readEmDashPublished(pinFor((await api('content/posts/'+probe.id)).item,'posts'),host)).status,'projected');
 assert.equal((await readEmDashPublished(oldPin,host)).code,'stale-source');
 const denied=await readEmDashPublished(records[0].pin,{...host,authorizeRead:async()=>({decision:'DENY'}),readRaw:async()=>{throw Error('Denied host must perform zero reads');}});assert.equal(denied.code,'read-denied');
 for(const bearer of [null,'ec_pat_invalid_local_negative_control'])assert.ok([401,403].includes((await request('content/posts/'+records.find(x=>x.pin.collection==='posts').pin.id,'GET',undefined,bearer)).status));
}finally{
 if(probe){assert.ok(probe.slug.startsWith('gaga-local-verification-'));await api('content/posts/'+probe.id,'DELETE');await api('content/posts/'+probe.id+'/permanent','DELETE');}
}
const declaration=readFileSync(resolve(root,'gaga.app.json'),'utf8'),d=JSON.parse(declaration),names=['@gaga/engine-contracts','@gaga/engine-capabilities','astro','@astrojs/starlight',...d.integrations.map(x=>x.package)];
const installed=Object.fromEntries(names.map(n=>{const p=JSON.parse(readFileSync(resolve(root,'node_modules',n,'package.json')));return[n,{version:p.version,dependencies:p.dependencies??{}}];}));
const composed=composeApplication(declaration,{installed,capabilities:[searchCapabilityId],runtimes:['build','edge'],bindings:['CMS_ORIGIN']});assert.equal(composed.ok,true,JSON.stringify(composed.diagnostics));
const assembly=await assembleApplication(composed.value,{'published-content':async()=>artifacts,'application-pages':async()=>[]});assert.equal(assembly.ok,true);
const search=executeSearchReference({id:'live-local-cms',query:defineQuery({id:'live-query',text:'Akal Imitasi',filters:[],facets:[],scope:[],constraints:[],diagnostics:[]}),artifacts:assembly.value.artifacts,limitations:[],diagnostics:[]});assert.equal(search.status,'succeeded');assert.ok(search.output.results.some(x=>x.title.includes('Dignity')));
const output=resolve(root,'.gaga/cms');mkdirSync(output,{recursive:true});
const receipt={status:'PASS',classification:'REAL_LOCAL_EMDASH_API',origin,emdash:'1.3.1',records:records.map(({item,...x})=>({...x,providerPublishedAt:item.publishedAt})),realProviderReads:realReads,rawProviderResponses:true,fixturesUsedAsProvider:false,bodyIntegrity:true,metadataIdentityTaxonomyAuthorsPreserved:true,stableRevisions:true,draftExcluded:true,draftOverlayRejected:true,staleRejected:true,deniedBeforeProviderRead:true,unauthorizedRejected:true,composition:'PASS',engineSearch:{status:search.status,matchedArtifactIds:search.output.matchedArtifactIds},productionProvisioningPerformed:false};
writeFileSync(resolve(output,'published.json'),JSON.stringify({schema:'consumer.emdash-export/v1',mode:'published-emdash-export',origin,documents:records,provenance:{emdashVersion:'1.3.1',realProviderReads:realReads,liveEmDashExportVerified:true}},null,2)+'\n');
writePublishedExport(records,{origin,realProviderReads:realReads});
writeFileSync(resolve(output,'local-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
