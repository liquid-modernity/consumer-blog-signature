// Read-only export. Local migration writes belong to verify-local.mjs, never this production path.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {readEmDashPublished} from '@gaga/corps-emdash';
import {root,hash} from './migration.mjs';
import {writePublishedExport} from './export.mjs';
const config=JSON.parse(readFileSync(resolve(root,'cms/production.json'))),origin=process.env.CMS_ORIGIN,token=process.env.CMS_READ_TOKEN;
assert.ok(['http://localhost:4321',config.origin].includes(origin),'Unapproved CMS origin');
assert.match(token??'',/^ec_pat_[A-Za-z0-9_-]+$/,'CMS_READ_TOKEN is required; never log it');
let reads=0;
async function get(path){const r=await fetch(origin+'/_emdash/api/content/'+path,{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(20000)});reads++;assert.equal(r.status,200,'Authenticated CMS read failed');const bytes=Buffer.from(await r.arrayBuffer());assert.ok(bytes.length<2*1024*1024);const b=JSON.parse(bytes);assert.equal(b.success,true);return b.data;}
const mapping=JSON.parse(readFileSync(resolve(root,'cms/migration/source-map.json'))),records=[];
const admission=origin===config.origin?JSON.parse(readFileSync(resolve(root,'cms/migration/production-receipt.json'))):null;
const seed=JSON.parse(readFileSync(resolve(root,'cms/migration/seed.json')));if(admission){assert.equal(admission.status,'PASS');assert.equal(admission.origin,origin);assert.equal(admission.records.length,8);}
for(const collection of [...new Set(mapping.map(x=>x.collection))]){
 const list=await get(collection+'?status=published&limit=100');assert.equal(list.items.length,mapping.filter(x=>x.collection===collection).length,'Unexpected/missing published records');
 for(const m of mapping.filter(x=>x.collection===collection)){
  const matches=list.items.filter(x=>x.data?.application_id===m.applicationId);assert.equal(matches.length,1,'Missing or duplicate admitted CMS identity');
  const item=(await get(collection+'/'+matches[0].id)).item;
  assert.equal(item.data.metadata.contentId,m.applicationId);assert.equal(typeof item.data.body,'string');
  const pin={origin,collection,id:item.id,liveRevisionId:item.liveRevisionId,updatedAt:item.updatedAt,titleField:'title',summaryField:'summary'};
  if(admission){const expected=admission.records.find(x=>x.applicationId===m.applicationId);assert.ok(expected);assert.deepEqual(pin,expected.pin,'Production revision differs from admitted import');assert.equal(hash(item.data.body),expected.bodySha256);assert.equal(item.slug,expected.slug);assert.equal(item.publishedAt,expected.publishedAt);assert.deepEqual(item.data,seed.content[collection].find(x=>x.id===m.applicationId).data,'Editorial metadata/author/taxonomy changed');}
  const result=await readEmDashPublished(pin,{origin,authorizeRead:async resource=>({decision:'ALLOW',resource}),readRaw:async()=>{const repeated=(await get(collection+'/'+item.id)).item;assert.deepEqual(repeated,item,'CMS changed during export');return repeated;}});
  assert.equal(result.status,'projected','Unpublished, draft or changed CMS record rejected: '+result.code);
  records.push({applicationId:m.applicationId,originalPath:m.originalPath,pin,item});
 }
}
const output=writePublishedExport(records,{origin,realProviderReads:reads,check:process.argv.includes('--check')});console.log(JSON.stringify({status:'PASS',mode:output.mode,records:records.length,realProviderReads:reads,productionWrites:0,exportSha256:hash(JSON.stringify(output,null,2)+'\n')}));
