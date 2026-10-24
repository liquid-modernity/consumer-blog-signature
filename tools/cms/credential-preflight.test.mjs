import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,privateDecrypt,createDecipheriv,constants} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
test('credential diagnosis is GET-only, filters credential values and encrypts private metadata',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cms-credential-test-')),keys=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}}),trace=join(dir,'trace.jsonl'),fixture=join(dir,'fetch.mjs');
 writeFileSync(fixture,`import{appendFileSync}from'node:fs';globalThis.fetch=async(url,options)=>{appendFileSync(process.env.TRACE,JSON.stringify({method:options.method,path:new URL(url).pathname})+'\\n');let result={id:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',status:'active',name:'Test name',value:process.env.CLOUDFLARE_API_TOKEN,policies:[{permission_groups:[{name:'Workers Scripts Edit'}]}]};if(url.endsWith('/permission_groups'))result=[];if(url.endsWith('/workers/subdomain'))result={subdomain:'test'};return new Response(JSON.stringify({success:true,result}),{status:200});};`);
 try{
 const fakeToken='not-a-real-cloudflare-credential',r=spawnSync(process.execPath,['--import',fixture,resolve('tools/cms/credential-preflight.mjs')],{env:{PATH:process.env.PATH,CLOUDFLARE_API_TOKEN:fakeToken,CLOUDFLARE_ACCOUNT_ID:'test-account',DIAGNOSTIC_PUBLIC_KEY:keys.publicKey,GAGA_EVIDENCE_DIRECTORY:dir,TRACE:trace},encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 const calls=readFileSync(trace,'utf8').trim().split('\n').map(JSON.parse);assert.ok(calls.every(x=>x.method==='GET'));assert.ok(calls.every(x=>!x.path.endsWith('/value')));
 const summary=readFileSync(join(dir,'summary.json'),'utf8');assert.ok(!summary.includes('Test name')&&!summary.includes(fakeToken));
 const e=JSON.parse(readFileSync(join(dir,'encrypted.json'))),k=privateDecrypt({key:keys.privateKey,oaepHash:'sha256',padding:constants.RSA_PKCS1_OAEP_PADDING},Buffer.from(e.wrappedKey,'base64')),decipher=createDecipheriv('aes-256-gcm',k,Buffer.from(e.iv,'base64'));decipher.setAuthTag(Buffer.from(e.tag,'base64'));const plain=Buffer.concat([decipher.update(Buffer.from(e.ciphertext,'base64')),decipher.final()]).toString();assert.ok(plain.includes('Test name')&&!plain.includes(fakeToken));const report=JSON.parse(plain);assert.equal(report.credentialMutations,0);assert.equal(report.resourceMutations,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
