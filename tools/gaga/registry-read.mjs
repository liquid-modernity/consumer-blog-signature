import assert from 'node:assert/strict';
// Only idempotent public metadata GETs retry; package identity/integrity remain caller-owned gates.
export async function readRegistryMetadata(url,{fetch=globalThis.fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 const target=new URL(url);assert.equal(target.origin,'https://npm.cloudsmith.io');assert.ok(target.pathname.startsWith('/gaga/gaga/')&&!target.username&&!target.password&&!target.search&&!target.hash);
 for(let attempt=0;attempt<2;attempt++){
  try{return await fetch(url,{signal:AbortSignal.timeout(20000)});}
  catch(error){if(attempt===1||error?.name!=='TimeoutError')throw error;console.warn('Public registry metadata timed out; one bounded GET retry:',url);await pause(1000);}
 }
}
