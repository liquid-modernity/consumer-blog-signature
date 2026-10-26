import test from'node:test';import assert from'node:assert/strict';import{admitPublicReuse,qualificationContent}from'./baseline.mjs';
test('CMS-only source corrections can reuse exact qualified public payloads',()=>assert.doesNotThrow(()=>admitPublicReuse(['cms/editorial/plugin.mjs','cms/editorial/content-release.mjs','.github/workflows/content-release.yml','tools/content/baseline.mjs','tools/content/baseline.test.mjs','tools/editorial/production-control.mjs','tools/editorial/provider-bindings.mjs','tools/editorial/admit-cms-artifact.py'])));
for(const path of ['src/pages/index.astro','editorial/portable-text.mjs','tools/gaga/prepare.mjs','worker/index.mjs','public/site.css','package-lock.json','cms/migration/source-map.json','content/emdash/published.json','gaga.app.json','tools/editorial/other.mjs'])test(path+' cannot reuse old publication qualification',()=>assert.throws(()=>admitPublicReuse([path]),/fresh application qualification/));

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

test('application secret metadata follows the actual Garrison manifest contract',async()=>{
 const {readFileSync}=await import('node:fs');const {resolve}=await import('node:path');const {pathToFileURL}=await import('node:url');
 const {admitManifest}=await import(pathToFileURL(resolve(process.env.GAGA_CONTROLLER_ROOT,'release/controller/model.mjs')));
 const {inspectCmsBindings}=await import('../editorial/provider-bindings.mjs');
 const m=JSON.parse(readFileSync(resolve(process.env.GAGA_CONTROLLER_ROOT,'release/manifests/consumer-blog-signature.json'))),d=m.expectedState.dependencies[0];
 const get=k=>d.bindings.find(b=>b.kind===k).identity,resources={d1:get('database'),r2:get('object-storage'),kv:get('key-value')};
 const secret={name:'EMDASH_ENCRYPTION_KEY',kind:'secret',identity:d.id+'/EMDASH_ENCRYPTION_KEY',present:true};
 d.bindings=inspectCmsBindings([{name:'DB',type:'d1',id:resources.d1},{name:'MEDIA',type:'r2_bucket',bucket_name:resources.r2},{name:'SESSION',type:'kv_namespace',namespace_id:resources.kv},{name:secret.name,type:'secret_text'}],{worker:d.id,resources,secrets:[secret]});
 assert.doesNotThrow(()=>admitManifest(m));assert.deepEqual(d.bindings.find(b=>b.kind==='secret'),secret);
});

test('metadata-only readmission can reuse unchanged application source without permitting new build inputs',()=>{assert.doesNotThrow(()=>admitPublicReuse([]));assert.throws(()=>admitPublicReuse(['wrangler.jsonc']),/fresh application qualification/);});
