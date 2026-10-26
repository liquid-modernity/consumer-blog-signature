import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
test('export excludes private provider fields; check mode never rewrites a mismatched export',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'cms-export-'));mkdirSync(join(dir,'content/emdash'),{recursive:true});writeFileSync(join(dir,'export.mjs'),readFileSync('tools/cms/export.mjs','utf8').replace('../../editorial/portable-text.mjs',pathToFileURL(join(process.cwd(),'editorial/portable-text.mjs')).href));
 writeFileSync(join(dir,'migration.mjs'),`import{createHash}from'node:crypto';export const root=${JSON.stringify(dir)};export const hash=x=>createHash('sha256').update(x).digest('hex');`);
 try{const {writePublishedExport}=await import(pathToFileURL(join(dir,'export.mjs')));const records=[{applicationId:'public.id',originalPath:'src/content/docs/a.md',pin:{origin:'https://public.example',id:'native-id'},item:{id:'native-id',status:'published',draftRevisionId:null,data:{application_id:'public.id',body:'Public body'},authorId:'PRIVATE_USER',password:'PRIVATE_SECRET',session:'PRIVATE_SESSION'}}];
  const context={origin:'https://public.example',realProviderReads:2};writePublishedExport(records,context);
  const file=join(dir,'content/emdash/published.json'),before=readFileSync(file,'utf8');assert.ok(!before.includes('PRIVATE_'));writePublishedExport(records,{...context,check:true});
  records[0].item.data.body='Changed after qualification';assert.throws(()=>writePublishedExport(records,{...context,check:true}),/Committed export differs/);assert.equal(readFileSync(file,'utf8'),before);
  records[0].item.draftRevisionId='draft-native-id';records[0].item.data.body='PRIVATE_DRAFT_BODY';assert.throws(()=>writePublishedExport(records,context),error=>!error.message.includes('PRIVATE_DRAFT_BODY')&&/Only clean published/.test(error.message));assert.equal(readFileSync(file,'utf8'),before);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('published admission preserves a legitimate draft but rejects overlays and revision ambiguity',async()=>{
 const {admitPublishedItem}=await import('./export.mjs');
 const {createHash}=await import('node:crypto');
 const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
 const data={body:'Published body'},expected={pin:{liveRevisionId:'published'},dataSha256:digest(data)};
 const item={status:'published',liveRevisionId:'published',draftRevisionId:'draft',data};
 const admitted=admitPublishedItem(item,expected);
 assert.equal(admitted.draftRevisionId,null);assert.equal(item.draftRevisionId,'draft');assert.deepEqual(admitted.data,data);
 assert.deepEqual(admitPublishedItem({...item,draftRevisionId:null},expected).data,data);
 assert.deepEqual(admitPublishedItem({...item,data:{body:'Private draft'},liveData:data},expected).data,data);
 for(const changed of [{data:{body:'Leaked draft'}},{liveRevisionId:'new-published'},{draftRevisionId:'published'},{draftRevisionId:undefined}])assert.throws(()=>admitPublishedItem({...item,...changed},expected));
 assert.throws(()=>admitPublishedItem(item,null));
});

test('deployment refresh admits only published bytes and denied anonymous draft access without changing the export',async()=>{
 const {spawnSync}=await import('node:child_process');
 const dir=mkdtempSync(join(tmpdir(),'cms-refresh-')),preload=join(dir,'provider.mjs');
 const before=readFileSync('content/emdash/published.json','utf8');
 writeFileSync(preload,`import{readFileSync}from'node:fs';
 const snapshot=JSON.parse(readFileSync('content/emdash/published.json'));
 globalThis.fetch=async(url,options={})=>{const u=new URL(url),parts=u.pathname.split('/').filter(Boolean),collection=parts[3],id=parts[4],items=snapshot.documents.filter(d=>d.pin.collection===collection).map(d=>structuredClone(d.item));
 if(!options.headers?.Authorization)return new Response('',{status:process.env.SCENARIO==='anonymous-leak'?200:401});
 if(!id)return Response.json({success:true,data:{items}});
 const item=items.find(x=>x.id===id);if(item.id===snapshot.documents.find(d=>d.pin.collection==='posts').item.id)item.draftRevisionId='non-public-draft';
 if(process.env.SCENARIO==='overlay'&&item.draftRevisionId)item.data.summary='Private draft overlay';
 return Response.json({success:true,data:{item}});};`);
 try{for(const scenario of ['ok','overlay','anonymous-leak']){
  const r=spawnSync(process.execPath,['--import',preload,'tools/cms/refresh.mjs','--check'],{cwd:process.cwd(),env:{PATH:process.env.PATH,SCENARIO:scenario,CMS_ORIGIN:'https://consumer-blog-signature-cms.ratriatra.workers.dev',CMS_READ_TOKEN:'ec_pat_mock'},encoding:'utf8'});
  if(scenario==='ok')assert.equal(r.status,0,r.stderr);else assert.notEqual(r.status,0,scenario);
  assert.equal(readFileSync('content/emdash/published.json','utf8'),before);
 }}finally{rmSync(dir,{recursive:true,force:true});}
});
