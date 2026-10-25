import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,hash} from './migration.mjs';
import {editorialBody} from '../../editorial/portable-text.mjs';
export function writePublishedExport(records,{origin,realProviderReads,check=false}){
 const documents=records.map(r=>{
  const item=Object.fromEntries(['id','type','slug','status','updatedAt','publishedAt','liveRevisionId','draftRevisionId','data'].map(k=>[k,r.item[k]]));
  assert.ok(item.status==='published'&&item.draftRevisionId===null,'Only clean published records may be exported');assert.equal(item.data.application_id,r.applicationId);
  const {origin,collection,id,liveRevisionId,updatedAt,titleField,summaryField}=r.pin;
  return {applicationId:r.applicationId,path:r.originalPath,pin:{origin,collection,id,liveRevisionId,updatedAt,titleField,summaryField},item,bodySha256:hash(typeof editorialBody(item.data)==='string'?editorialBody(item.data):JSON.stringify(editorialBody(item.data)))};
 });
 const output={schema:'consumer.emdash-export/v1',mode:'published-emdash-export',origin,documents,provenance:{emdashVersion:'1.3.1',liveEmDashExportVerified:true,realProviderReads}};
 const bytes=JSON.stringify(output,null,2)+'\n';
 const receiptBytes=JSON.stringify({status:'PASS',classification:'REAL_EMDASH_API_EXPORT',origin,exportSha256:hash(bytes),realProviderReads,records:documents.map(d=>({applicationId:d.applicationId,pin:d.pin,bodySha256:d.bodySha256})),credentialsIncluded:false,freshness:'Recorded revision pins; refresh explicitly before rebuild. This receipt does not establish perpetual freshness.'},null,2)+'\n';
 const writes=[['content/emdash/published.json',bytes],['content/emdash/published-receipt.json',receiptBytes]];
 if(check){for(const [path,value] of writes)assert.equal(readFileSync(resolve(root,path),'utf8'),value,'Committed export differs from live admitted production revisions');}
 else for(const [path,value] of writes)writeFileSync(resolve(root,path),value);
 return output;
}
