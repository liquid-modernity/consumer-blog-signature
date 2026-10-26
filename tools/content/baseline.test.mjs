import test from'node:test';import assert from'node:assert/strict';import{admitPublicReuse,qualificationContent}from'./baseline.mjs';
test('CMS-only source corrections can reuse exact qualified public payloads',()=>assert.doesNotThrow(()=>admitPublicReuse(['cms/editorial/plugin.mjs','cms/editorial/content-release.mjs','.github/workflows/content-release.yml','tools/content/baseline.mjs','tools/content/baseline.test.mjs'])));
for(const path of ['src/pages/index.astro','editorial/portable-text.mjs','tools/gaga/prepare.mjs','worker/index.mjs','public/site.css','package-lock.json','cms/migration/source-map.json','content/emdash/published.json','gaga.app.json'])test(path+' cannot reuse old publication qualification',()=>assert.throws(()=>admitPublicReuse([path]),/fresh application qualification/));

test('qualification content uses the existing controller revision contract while retaining full manifest data digests',async()=>{
 const {resolve}=await import('node:path');const {pathToFileURL}=await import('node:url');
 assert.ok(process.env.GAGA_CONTROLLER_ROOT,'Pinned controller checkout required for the integration regression');
 const {indexClaims}=await import(pathToFileURL(resolve(process.env.GAGA_CONTROLLER_ROOT,'release/providers/github.mjs')));
 const {fingerprint}=await import(pathToFileURL(resolve(process.env.GAGA_CONTROLLER_ROOT,'release/controller/model.mjs')));
 const record={id:'article',resource:'posts/native-id',revision:'revision-id',updatedAt:'2026-10-26T00:00:00.000Z',bodyDigest:'sha256:'+'a'.repeat(64),dataDigest:'sha256:'+'b'.repeat(64)};
 const source={commit:'c'.repeat(40),tree:'d'.repeat(40),digest:'sha256:'+'e'.repeat(64)};
 const manifest={source,content:{export:{storage:'source'},records:[record]},artifact:{index:{format:'gaga.qualification/v1'},inventoryDigest:fingerprint([])}};
 const index={schema:'gaga.qualification/v1',source,files:[],checks:[],content:qualificationContent([record])};
 assert.equal(manifest.content.records[0].dataDigest,record.dataDigest);assert.equal(Object.hasOwn(index.content[0],'dataDigest'),false);
 assert.doesNotThrow(()=>indexClaims(manifest,index));
 assert.throws(()=>indexClaims(manifest,{...index,content:[{...index.content[0],revision:'wrong-revision'}]}),e=>e.code==='CONTENT_BINDING');
 assert.throws(()=>indexClaims(manifest,{...index,content:[record]}),e=>e.code==='CONTENT_BINDING');
});
