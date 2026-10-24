import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,hash} from './migration.mjs';
export function writePublishedExport(records,{origin,realProviderReads}){
 const documents=records.map(r=>{
  const item=Object.fromEntries(['id','type','slug','status','updatedAt','publishedAt','liveRevisionId','draftRevisionId','data'].map(k=>[k,r.item[k]]));
  assert.equal(item.data.application_id,r.applicationId);assert.equal(item.draftRevisionId,null);
  return {applicationId:r.applicationId,path:r.originalPath,pin:r.pin,item,bodySha256:hash(item.data.body)};
 });
 const output={schema:'consumer.emdash-export/v1',mode:'published-emdash-export',origin,documents,provenance:{emdashVersion:'1.3.1',liveEmDashExportVerified:true,realProviderReads}};
 const bytes=JSON.stringify(output,null,2)+'\n';
 writeFileSync(resolve(root,'content/emdash/published.json'),bytes);
 writeFileSync(resolve(root,'content/emdash/published-receipt.json'),JSON.stringify({status:'PASS',classification:'REAL_EMDASH_API_EXPORT',origin,exportSha256:hash(bytes),realProviderReads,records:documents.map(d=>({applicationId:d.applicationId,pin:d.pin,bodySha256:d.bodySha256})),credentialsIncluded:false,freshness:'Recorded revision pins; refresh explicitly before rebuild. This receipt does not establish perpetual freshness.'},null,2)+'\n');
 return output;
}
