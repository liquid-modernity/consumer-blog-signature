import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContentMetadata } from '@gaga/engine-capabilities/content';
import { cmsFrontmatter, readSnapshot } from '../gaga/snapshot.mjs';
test('all eight published records map editorial dates through the public Engine input without mutation',()=>{
 const snapshot=readSnapshot(),before=JSON.stringify(snapshot);assert.equal(snapshot.documents.length,8);
 for(const doc of snapshot.documents){
  const raw=doc.item.data,front=cmsFrontmatter(doc),metadata=normalizeContentMetadata(front);
  const published=raw.editorial?.publicationDate??raw.metadata?.publishedAt,updated=raw.editorial?.updatedDate??raw.metadata?.updatedAt;
  assert.equal(metadata.publishedAt,published?.slice(0,10),doc.applicationId);
  assert.equal(metadata.updatedAt,(updated??published)?.slice(0,10),doc.applicationId);
  assert.equal(metadata.title,raw.title);assert.equal(metadata.summary,raw.summary);assert.equal(front.contentId,doc.applicationId);
 }
 assert.equal(JSON.stringify(snapshot),before);
});
test('editorial publication dates take precedence over legacy import timestamps',()=>{
 const doc={item:{data:{title:'Article',summary:'Summary',metadata:{contentId:'article',publishedAt:'2025-01-02',updatedAt:'2025-01-03'},editorial:{publicationDate:'2026-01-02T00:00:00.000Z',updatedDate:'2026-01-04T00:00:00.000Z'}}}};
 const result=normalizeContentMetadata(cmsFrontmatter(doc));assert.equal(result.publishedAt,'2026-01-02');assert.equal(result.updatedAt,'2026-01-04');
});
test('legacy, absent and invalid dates do not invent editorial state',()=>{
 const legacy={item:{data:{title:'Legacy',metadata:{contentId:'legacy',publishedAt:'2025-02-02'}}}};
 assert.equal(normalizeContentMetadata(cmsFrontmatter(legacy)).publishedAt,'2025-02-02');
 for(const publishedAt of [undefined,'invalid-date'])assert.equal(normalizeContentMetadata(cmsFrontmatter({item:{data:{title:'Undated',metadata:{contentId:'undated',publishedAt}}}})).publishedAt,undefined);
});
