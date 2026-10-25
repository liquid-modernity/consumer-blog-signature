import test from 'node:test';
import assert from 'node:assert/strict';
import {productionPlan} from './production-plan.mjs';
import {hash} from './migration.mjs';
import {importProductionRecords} from './browser-import.mjs';
async function simulate(scenario){
 const plan=productionPlan(),bytes=JSON.stringify(plan,null,2)+'\n',calls=[],items=new Map();let n=0,last;
 globalThis.location={origin:scenario==='wrong-origin'?'https://unapproved.example':plan.origin};
 globalThis.fetch=async(url,options)=>{const path=new URL(url).pathname.replace('/_emdash/api/','')+new URL(url).search;calls.push({path,method:options.method});assert.equal(options.credentials,'same-origin');assert.ok(!options.headers.Authorization);if(options.method==='POST')assert.equal(options.headers['X-EmDash-Request'],'1','Official EmDash CSRF header required');
  if(path==='auth/me')return Response.json({success:true,data:{role:50}});
  if(path.includes('?')){const collection=path.split('/')[1].split('?')[0];return Response.json({success:true,data:{items:scenario==='existing-content'?[{id:'existing'}]:[...items.values()].filter(x=>x.type===collection)}});}
  if(options.method==='POST'&&!path.endsWith('/publish')){if(scenario==='create-fails')return Response.json({success:false,error:{code:'FAIL'}},{status:500});const b=JSON.parse(options.body),id='native-'+(++n);items.set(id,{...b,id,type:path.split('/')[1],updatedAt:'2026-10-25T00:00:00Z',publishedAt:null,liveRevisionId:null,draftRevisionId:'draft-'+n});return Response.json({success:true,data:{item:items.get(id)}});}
  const id=path.split('/')[2],item=items.get(id);if(path.endsWith('/publish')){const b=JSON.parse(options.body);Object.assign(item,{status:'published',publishedAt:b.publishedAt,draftRevisionId:null,liveRevisionId:'revision-'+id});}return Response.json({success:true,data:{item,_rev:'fresh-revision'}});
 };
 try{return {result:await importProductionRecords(bytes,scenario==='bad-hash'?'0'.repeat(64):hash(bytes),x=>last=x),calls,last};}catch(error){return {error,calls,last};}finally{delete globalThis.location;delete globalThis.fetch;}
}
for(const scenario of ['wrong-origin','bad-hash','existing-content'])test(scenario+' rejects with zero content writes',async()=>{const r=await simulate(scenario);assert.ok(r.error);assert.equal(r.calls.filter(x=>x.method==='POST').length,0);});
test('eight records use exactly create/publish operations with preserved bodies/dates and fresh IDs',async()=>{const r=await simulate('ok');assert.equal(r.error,undefined,r.error?.message);assert.equal(r.result.status,'PASS');assert.equal(r.result.records.length,8);assert.equal(r.calls.filter(x=>x.method==='POST').length,16);assert.ok(r.result.records.every(x=>!('authorId' in x.item)));});
test('ambiguous/failed create stops without retry, overwrite or delete',async()=>{const r=await simulate('create-fails');assert.ok(r.error);assert.equal(r.calls.filter(x=>x.method==='POST').length,1);assert.equal(r.last.status,'FAIL');assert.ok(r.last.pendingOperation);assert.ok(!r.calls.some(x=>['PUT','DELETE'].includes(x.method)));});
