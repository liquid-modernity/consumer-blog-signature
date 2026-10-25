import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
test('export excludes private provider fields; check mode never rewrites a mismatched export',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'cms-export-'));mkdirSync(join(dir,'content/emdash'),{recursive:true});copyFileSync('tools/cms/export.mjs',join(dir,'export.mjs'));
 writeFileSync(join(dir,'migration.mjs'),`import{createHash}from'node:crypto';export const root=${JSON.stringify(dir)};export const hash=x=>createHash('sha256').update(x).digest('hex');`);
 try{const {writePublishedExport}=await import(pathToFileURL(join(dir,'export.mjs')));const records=[{applicationId:'public.id',originalPath:'src/content/docs/a.md',pin:{origin:'https://public.example',id:'native-id'},item:{id:'native-id',status:'published',draftRevisionId:null,data:{application_id:'public.id',body:'Public body'},authorId:'PRIVATE_USER',password:'PRIVATE_SECRET',session:'PRIVATE_SESSION'}}];
  const context={origin:'https://public.example',realProviderReads:2};writePublishedExport(records,context);
  const file=join(dir,'content/emdash/published.json'),before=readFileSync(file,'utf8');assert.ok(!before.includes('PRIVATE_'));writePublishedExport(records,{...context,check:true});
  records[0].item.data.body='Changed after qualification';assert.throws(()=>writePublishedExport(records,{...context,check:true}),/Committed export differs/);assert.equal(readFileSync(file,'utf8'),before);
  records[0].item.draftRevisionId='draft-native-id';records[0].item.data.body='PRIVATE_DRAFT_BODY';assert.throws(()=>writePublishedExport(records,context),error=>!error.message.includes('PRIVATE_DRAFT_BODY')&&/Only clean published/.test(error.message));assert.equal(readFileSync(file,'utf8'),before);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
