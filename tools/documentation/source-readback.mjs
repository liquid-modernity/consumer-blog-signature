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

// Test-only GET navigation: one recorded reread for a transport reset, never for HTTP or product failures.
/** @template {{status:()=>number}|null} T
 * @param {{goto:(route:string,options:{waitUntil:'domcontentloaded'})=>Promise<T>}} page
 * @param {string} route
 * @param {(entry:{route:string,attempts:any[]})=>void|Promise<void>} record
 */
export async function readPublicDocument(page, route, record = async () => {}) {
 const attempts=[];
 try {
  for(let attempt=1;attempt<=2;attempt++){
   let response;
   try {response=await page.goto(route,{waitUntil:'domcontentloaded'});}
   catch(error){
    const reset=error instanceof Error && /net::ERR_CONNECTION_RESET\b/.test(error.message);
    attempts.push({attempt,kind:reset?'connection-reset':'navigation-error',retry:reset&&attempt===1});
    if(!reset||attempt===2)throw error;
    continue;
   }
   attempts.push({attempt,kind:'response',status:response?.status()??null});
   return response;
  }
 } finally {await record({route,attempts});}
}
