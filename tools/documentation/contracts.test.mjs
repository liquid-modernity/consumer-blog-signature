import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { documentProfiles, documentExperience, documentNavigation, documentBreadcrumbs, documentDiscoveryEntries } from '../../src/config/document-experience.ts';
import { outlineForRoute } from '../../src/config/contextual-ux.mjs';
const base='c462ab8074f2d17187f1fde5791457bde2ec15f3';
test('five explicit profiles preserve distinct editorial, reference and explorer semantics',()=>{
 assert.deepEqual(documentProfiles.map(p=>p.id),['knowledge','information','legal','system','section']);
 for(const path of ['/topics/teknologi','/knowledge-other','/systematic','/publications/article','/saved']) assert.equal(documentExperience(path),undefined);
 assert.equal(documentExperience('/knowledge/references/source/').mode,'reader');assert.equal(documentExperience('/knowledge/index').mode,'explorer');assert.equal(documentExperience('/knowledge/graph').outline,false);assert.equal(documentExperience('/sections/experience').mode,'editorial');assert.equal(documentExperience('/sections/experience').outline,false);
});
test('navigation has unique real public paths and nested breadcrumbs follow known parent identities',()=>{
 for(const profile of documentProfiles){const nav=documentNavigation(profile);assert.equal(new Set(nav.map(i=>i.href)).size,nav.length);assert.ok(nav.every(i=>i.href===profile.root||i.href.startsWith(profile.root+'/')));}
 assert.deepEqual(documentBreadcrumbs('/knowledge/references/source','A source').map(i=>i.href),['/','/knowledge','/knowledge/references','/knowledge/references/source']);
 assert.deepEqual(documentBreadcrumbs('/about','About').map(i=>i.href),['/','/about']);
});
test('short, empty and non-document pages never manufacture an outline',()=>{
 const h={slug:'real',text:'Real'},other={slug:'other',text:'Other'};
 assert.deepEqual(outlineForRoute([h],'/legal/terms','legal',true),[]);assert.deepEqual(outlineForRoute([], '/legal/terms','legal',true),[]);
 assert.deepEqual(outlineForRoute([h,other],'/system/sitemap','system',true),[h,other]);assert.deepEqual(outlineForRoute([h,other],'/sections/experience','index'),[]);
});
test('public discovery derives from existing navigation/reference metadata without invented document content',()=>{
 const records=documentDiscoveryEntries();assert.equal(records.length,22);assert.equal(new Set(records.map(r=>r.href)).size,records.length);assert.ok(records.every(r=>['knowledge','information','legal','system'].includes(r.kind)));
 assert.ok(records.some(r=>r.href==='/legal/privacy'&&r.kind==='legal'));assert.ok(records.some(r=>r.href==='/knowledge/graph'&&r.kind==='knowledge'));assert.ok(!records.some(r=>/admin|credential|token|deployment/.test(r.href)));
});
test('only explicit editorial section membership groups a writer publication, never its topics or title',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'document-editorial-'));
 try{
  const source=ts.transpileModule(readFileSync('src/lib/editorial.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
    .replace(/from ['"]\.\/content['"]/g,"from 'data:text/javascript,export function getArticles(){throw Error(\"No provider read in unit test\")}'")
    .replace(/from ['"]\.\/slug['"]/g,'from '+JSON.stringify(pathToFileURL(resolve('src/lib/slug.ts')).href));
  writeFileSync(join(dir,'editorial.mjs'),source);const {deriveEditorialSections}=await import(pathToFileURL(join(dir,'editorial.mjs')).href);
  const article=(id,section)=>({id,href:'/publications/'+id,contentId:id,section,topics:['Anomali'],metadata:{title:'Anomali '+id,publishedAt:'2026-01-01'},editorialRole:'standard',storyFormat:'standard',editorialPriority:0,featured:false,breaking:false,live:false});
  const result=deriveEditorialSections([article('one','Anomali'),article('two','Experience'),article('no-section',undefined)]);
  assert.deepEqual(result.map(r=>[r.name,r.count]),[['Anomali',1],['Experience',1]]);assert.deepEqual(deriveEditorialSections([article('no-section',undefined)]),[]);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('CMS, metadata contracts, storage authority and package identities remain pinned',()=>{
 for(const file of ['package.json','package-lock.json','cms/package-lock.json','gaga.app.json','content-release.json','content/emdash/published.json','content/emdash/published-receipt.json','cms/editorial/plugin.mjs','cms/editorial/admin.tsx','cms/editorial/studio.css','src/lib/content.ts','src/lib/editorial.ts','src/scripts/systems/saved-reading.ts','src/scripts/systems/reading-knowledge.ts','docs/UI-PRESERVATION.json'])assert.deepEqual(readFileSync(file),execFileSync('git',['show',base+':'+file]),file);
 const before=execFileSync('git',['show',base+':src/pages/legal/[slug].astro'],{encoding:'utf8'}),after=readFileSync('src/pages/legal/[slug].astro','utf8');
 assert.equal(after.slice(after.indexOf('const legalDocs:'),after.indexOf('const doc =')),before.slice(before.indexOf('const legalDocs:'),before.indexOf('const doc =')),'Legal source text must not change');
});
