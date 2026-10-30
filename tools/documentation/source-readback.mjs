import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export function assertDocumentBytes(manifest, route, bytes) {
 const path=new URL(route,'https://consumer-blog-signature.ratriatra.workers.dev').pathname.replace(/\/+$/,'');
 const file='dist'+path+'/index.html';
 const expected=manifest.files.find(f=>f.path===file);
 assert.ok(expected,'Qualified document missing: '+file);
 const sha256=createHash('sha256').update(bytes).digest('hex');
 assert.equal(sha256,expected.sha256,'Browser document differs from sealed source: '+path);
 return {route:path||'/',file,sha256,sourceCommit:manifest.sourceCommit};
}
