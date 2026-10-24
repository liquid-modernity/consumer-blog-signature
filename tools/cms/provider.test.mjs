import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const script=resolve('tools/cms/provider.mjs');
function simulate(scenario,mode='provision'){
 const dir=mkdtempSync(join(tmpdir(),'cms-provider-test-')),fixture=join(dir,'fetch.mjs'),trace=join(dir,'trace.jsonl');
 writeFileSync(fixture,`import{appendFileSync}from'node:fs';globalThis.fetch=async(url,options)=>{if(!String(url).startsWith('https://api.cloudflare.com/client/v4/'))throw Error('Unexpected URL');const method=options.method??'GET';appendFileSync(process.env.TRACE,JSON.stringify({method,path:new URL(url).pathname})+'\\n');let result=[],status=200,success=true;if(url.endsWith('/user/tokens/verify'))result={status:'active'};else if(url.endsWith('/workers/subdomain'))result={subdomain:process.env.SCENARIO==='wrong-account'?'different':'ratriatra'};else if(url.includes('/d1/')&&method==='GET'){if(process.env.SCENARIO==='d1-denied'){status=401;success=false;}else result=process.env.SCENARIO==='existing'?[{name:'consumer-blog-signature-cms',uuid:'existing'}]:[];}else if(url.includes('/r2/')&&method==='GET')result={buckets:[]};else if(method==='POST'){if(process.env.SCENARIO==='failed-create'&&url.includes('/r2/')){status=503;success=false;}else result={id:'new-resource',uuid:'new-database',name:'new-bucket'};}return new Response(JSON.stringify({success,result,errors:success?[]:[{code:10000}]}),{status});};`);
 const r=spawnSync(process.execPath,['--import',fixture,script,mode],{env:{PATH:process.env.PATH,SCENARIO:scenario,TRACE:trace,CLOUDFLARE_API_TOKEN:'local-fake-only',CLOUDFLARE_ACCOUNT_ID:'test-account',GAGA_EVIDENCE_DIRECTORY:dir},encoding:'utf8'});
 try{return {status:r.status,trace:readFileSync(trace,'utf8').trim().split('\n').map(JSON.parse),receipt:JSON.parse(readFileSync(join(dir,'provider.json')))};}finally{rmSync(dir,{recursive:true,force:true});}
}
test('read-only provider preflight creates zero resources',()=>{const r=simulate('ok','preflight');assert.equal(r.status,0);assert.equal(r.trace.filter(x=>x.method==='POST').length,0);});
for(const scenario of ['d1-denied','wrong-account','existing'])test('whole-set '+scenario+' failure has zero provider writes',()=>{const r=simulate(scenario);assert.notEqual(r.status,0);assert.equal(r.trace.filter(x=>x.method==='POST').length,0);});
test('empty stores are created once only after complete preflight; no deployment operation exists',()=>{const r=simulate('ok');assert.equal(r.status,0);assert.equal(r.receipt.created.length,3);const first=r.trace.findIndex(x=>x.method==='POST');assert.equal(first,5);assert.equal(r.trace.filter(x=>x.method==='POST').length,3);assert.ok(r.trace.every(x=>!x.path.includes('/scripts')));});
test('a failed create stops without a retry and preserves partial state',()=>{const r=simulate('failed-create');assert.notEqual(r.status,0);assert.equal(r.receipt.created.length,1);assert.equal(r.receipt.pendingOperation.type,'R2');assert.equal(r.trace.filter(x=>x.method==='POST').length,2);});
