// Read-only export. Local migration writes belong to verify-local.mjs, never this production path.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {readEmDashPublished} from '@gaga/corps-emdash';
import {root,hash} from './migration.mjs';
import {writePublishedExport,admitPublishedItem} from './export.mjs';
import {editorialBody} from '../../editorial/portable-text.mjs';
const canonical=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const currentPath=resolve(root,'cms/editorial/admission.json');
const config=JSON.parse(readFileSync(resolve(root,'cms/production.json'))),origin=process.env.CMS_ORIGIN,token=process.env.CMS_READ_TOKEN;
assert.ok(['http://localhost:4321',config.origin].includes(origin),'Unapproved CMS origin');
assert.ok(typeof token==='string'&&/^ec_pat_[A-Za-z0-9_-]+$/.test(token),'CMS_READ_TOKEN is required; never log it');
let reads=0;
async function get(path){const r=await fetch(origin+'/_emdash/api/content/'+path,{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(20000)});reads++;assert.equal(r.status,200,'Authenticated CMS read failed');const bytes=Buffer.from(await r.arrayBuffer());assert.ok(bytes.length<2*1024*1024);const b=JSON.parse(bytes);assert.equal(b.success,true);return b.data;}
const mapping=JSON.parse(readFileSync(resolve(root,'cms/migration/source-map.json'))),records=[];
const admission=origin===config.origin?JSON.parse(readFileSync(existsSync(currentPath)?currentPath:resolve(root,'cms/migration/production-receipt.json'))):null;
const seed=JSON.parse(readFileSync(resolve(root,'cms/migration/seed.json')));if(admission){assert.equal(admission.status,'PASS');assert.equal(admission.origin,origin);assert.equal(admission.records.length,8);}
for(const collection of [...new Set(mapping.map(x=>x.collection))]){
 const list=await get(collection+'?status=published&limit=100');assert.equal(list.items.length,mapping.filter(x=>x.collection===collection).length,'Unexpected/missing published records');
 for(const m of mapping.filter(x=>x.collection===collection)){
  const matches=list.items.filter(x=>x.data?.application_id===m.applicationId);assert.equal(matches.length,1,'Missing or duplicate admitted CMS identity');
  const raw=(await get(collection+'/'+matches[0].id)).item;
  const expected=admission?.records.find(x=>x.applicationId===m.applicationId);
  const item=admission?.schema==='consumer.production-editorial-admission/v1'?admitPublishedItem(raw,expected):raw;
  assert.ok(item.status==='published'&&item.draftRevisionId===null,'Unadmitted published state rejected');
  if(raw.draftRevisionId!==null){
   const anonymous=await fetch(origin+'/_emdash/api/content/'+collection+'/'+item.id,{redirect:'error',signal:AbortSignal.timeout(20000)});
   assert.ok([401,403,404].includes(anonymous.status),'Anonymous CMS content access must be denied while a draft exists');
  }
  assert.equal(item.data.metadata.contentId,m.applicationId);const canonicalBody=editorialBody(item.data);assert.ok(typeof canonicalBody==='string'||Array.isArray(canonicalBody));
  const pin={origin,collection,id:item.id,liveRevisionId:item.liveRevisionId,updatedAt:item.updatedAt,titleField:'title',summaryField:'summary'};
  if(admission){const expected=admission.records.find(x=>x.applicationId===m.applicationId);assert.ok(expected);assert.deepEqual(pin,expected.pin,'Production revision differs from admitted import');assert.equal(hash(typeof canonicalBody==='string'?canonicalBody:JSON.stringify(canonicalBody)),expected.bodySha256);assert.equal(item.slug,expected.slug);assert.equal(item.publishedAt,expected.publishedAt);if(admission.schema==='consumer.production-editorial-admission/v1'){assert.equal(hash(canonical(item.data)),expected.dataSha256,'Admitted production data changed');assert.equal(item.data.integration?.canonicalBodyField??'body',expected.canonicalBodyField);}else assert.ok(isDeepStrictEqual(item.data,seed.content[collection].find(x=>x.id===m.applicationId).data),'Editorial metadata/author/taxonomy changed');}
  const result=await readEmDashPublished(pin,{origin,authorizeRead:async resource=>({decision:'ALLOW',resource}),readRaw:async()=>{const repeated=(await get(collection+'/'+item.id)).item;assert.ok(isDeepStrictEqual(repeated,raw),'CMS changed during export');return admission?.schema==='consumer.production-editorial-admission/v1'?admitPublishedItem(repeated,expected):repeated;}});
  assert.equal(result.status,'projected','Unpublished, draft or changed CMS record rejected: '+result.code);
  records.push({applicationId:m.applicationId,originalPath:m.originalPath,pin,item});
 }
}
const output=writePublishedExport(records,{origin,realProviderReads:reads,check:process.argv.includes('--check')});console.log(JSON.stringify({status:'PASS',mode:output.mode,records:records.length,realProviderReads:reads,productionWrites:0,exportSha256:hash(JSON.stringify(output,null,2)+'\n')}));
