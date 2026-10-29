import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

// Wrangler exercises the real asset router; a filesystem preview cannot reproduce index normalization.
export async function verifyStaticAssetRoutes() {
 const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const origin='http://127.0.0.1:'+port,env={CI:'true',WRANGLER_SEND_METRICS:'false'};
 for(const name of ['PATH','HOME','TMPDIR','LANG'])if(process.env[name])env[name]=process.env[name];
 const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--local','--ip','127.0.0.1','--port',String(port),'--inspector-port','0','--log-level','warn'],{env,stdio:['ignore','pipe','pipe']});
 let log='',failure;child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);child.on('error',e=>failure=e.code);
 const receipt={status:'RUNNING',runtime:'Wrangler local static assets + native workerd',providerCredentials:false,providerWrites:0,checks:[]};
 const hash=b=>createHash('sha256').update(b).digest('hex');
 try {
  let ready=false;for(let i=0;i<100;i++){assert.ok(!failure&&child.exitCode===null,'Local asset runtime failed: '+log);try{await fetch(origin+'/',{redirect:'manual',signal:AbortSignal.timeout(1000)});ready=true;break;}catch{}await delay(200);}assert.ok(ready,'Local asset readiness timeout');
  for(const method of ['GET','HEAD'])for(const query of ['', '?view=objects']){
   const r=await fetch(origin+'/knowledge/index'+query,{method,redirect:'manual'});assert.equal(r.status,307);const target=new URL(r.headers.get('location'),origin);assert.equal(target.origin,origin);assert.equal(target.pathname,'/knowledge/index/');assert.equal(target.search,query);
   const page=await fetch(target,{method,redirect:'manual'});assert.equal(page.status,200);if(method==='GET')assert.equal(hash(Buffer.from(await page.arrayBuffer())),hash(readFileSync('dist/knowledge/index/index.html')));else await page.body?.cancel();receipt.checks.push({method,query,indexStatus:r.status,target:target.pathname,pageStatus:page.status});await r.body?.cancel();
  }
  const overview=await fetch(origin+'/knowledge/');assert.equal(overview.status,200);assert.equal(hash(Buffer.from(await overview.arrayBuffer())),hash(readFileSync('dist/knowledge/index.html')));receipt.checks.push({path:'/knowledge/',status:200,distinctOverview:true});
  assert.equal((await fetch(origin+'/api/search?q=Akal')).status,200);assert.equal((await fetch(origin+'/api/search?q=')).status,400);assert.equal((await fetch(origin+'/api/search?q=Akal',{method:'POST'})).status,405);receipt.checks.push({search:200,malformed:400,unsupportedMethod:405});receipt.status='PASS';return receipt;
 } catch(error){receipt.status='FAIL';receipt.failure=error.message;throw error;}
 finally {
  if(child.exitCode===null){child.kill('SIGTERM');await Promise.race([new Promise(r=>child.once('exit',r)),delay(2000)]);if(child.exitCode===null)child.kill('SIGKILL');}
  writeFileSync('.gaga/asset-route-proof.json',JSON.stringify(receipt,null,2)+'\n');if(process.env.GAGA_EVIDENCE_DIRECTORY){writeFileSync(process.env.GAGA_EVIDENCE_DIRECTORY+'/asset-route-proof.json',JSON.stringify(receipt,null,2)+'\n');writeFileSync(process.env.GAGA_EVIDENCE_DIRECTORY+'/asset-route-native.log',log);}
 }
}
