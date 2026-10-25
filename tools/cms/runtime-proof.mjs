// Exercise production CMS startup with local emulated stores, never provider credentials.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {spawn} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),out=process.env.GAGA_EVIDENCE_DIRECTORY;
assert.ok(out&&!resolve(out).startsWith(root+'/'),'External evidence directory required');mkdirSync(out,{recursive:true});
const env={...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'};
for(const key of Object.keys(env))if(key.startsWith('CLOUDFLARE_')||key.startsWith('CMS_'))delete env[key];
const config=resolve(root,process.env.GAGA_CMS_RUNTIME_CONFIG??'cms/dist-cloudflare/server/wrangler.json');
assert.ok(['cms/dist-cloudflare/server/wrangler.json','cms/dist-editorial-cloudflare/server/wrangler.json'].some(path=>config===resolve(root,path)),'Only approved local runtime configs');
const args=[resolve(root,'cms/node_modules/wrangler/bin/wrangler.js'),'dev','--local','--config',config,'--ip','127.0.0.1','--port','8796','--persist-to',resolve(dirname(dirname(out)),'cms-runtime-state'),'--experimental-provision=false','--experimental-auto-create=false'];
const child=spawn(process.execPath,args,{cwd:resolve(root,'cms'),env,stdio:['ignore','pipe','pipe']});
let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',bytes=>{if(log.length<4*1024*1024)log+=bytes.toString();});
const receipt={status:'RUNNING',mode:'local-native-workerd',providerCredentials:false,providerMutations:0};
try{
 let response;
 for(let i=0;i<60;i++){
  assert.equal(child.exitCode,null,'Local CMS Worker exited before readiness');
  try{response=await fetch('http://127.0.0.1:8796/_emdash/api/setup/status',{redirect:'error',signal:AbortSignal.timeout(20000)});break;}catch{await new Promise(r=>setTimeout(r,500));}
 }
 assert.ok(response,'Local CMS Worker never became reachable');receipt.httpStatus=response.status;receipt.response=await response.text();assert.equal(response.status,200,'Compiled CMS startup failed; inspect runtime.log');
 const status=JSON.parse(receipt.response);assert.equal(status.success,true);assert.equal(status.data.needsSetup,true);
 const admin=await fetch('http://127.0.0.1:8796/_emdash/admin',{redirect:'manual'});assert.ok([301,302,303,307,308].includes(admin.status));
 assert.equal(new URL(admin.headers.get('location'),'http://127.0.0.1:8796').pathname,'/_emdash/admin/setup');
 const setup=await fetch('http://127.0.0.1:8796/_emdash/admin/setup',{redirect:'error'});assert.equal(setup.status,200);assert.ok((setup.headers.get('content-type')??'').includes('text/html'));
 receipt.status='PASS';receipt.adminRedirect=admin.status;receipt.setupHttpStatus=setup.status;
}catch(error){receipt.status='FAIL';receipt.failure=error.message;throw error;}
finally{
 child.kill('SIGTERM');await Promise.race([new Promise(r=>child.once('close',r)),new Promise(r=>setTimeout(r,5000))]);if(child.exitCode===null)child.kill('SIGKILL');
 writeFileSync(resolve(out,'runtime.log'),log.replace(/ec_pat_[A-Za-z0-9_-]+/g,'[REDACTED]'),{mode:0o600});writeFileSync(resolve(out,'runtime.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
}
