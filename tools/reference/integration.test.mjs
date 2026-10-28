import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {composeApplication, normalizeApplication, assembleApplication, stableStringify, createPortableTextSemantics} from '@gaga/arsenal';
import {readEmDashPublished} from '@gaga/corps-emdash';
import {defineQuery, executeSearchReference} from '@gaga/engine-capabilities/search';
import {verifySnapshot, readSnapshot} from '../gaga/snapshot.mjs';
import {blockRegistry} from '../../editorial/registry.mjs';
import {editorialBody, plainText} from '../../editorial/portable-text.mjs';

const baseline='952ab4ca4b75c6236456276c2439a8276b17883d';
const declaration=readFileSync('gaga.app.json','utf8'),d=JSON.parse(declaration);
const names=['@gaga/engine-contracts','@gaga/engine-capabilities','astro','@astrojs/starlight',...d.integrations.map(x=>x.package)];
const installed=Object.fromEntries(names.map(name=>{const p=JSON.parse(readFileSync('node_modules/'+name+'/package.json'));return [name,{version:p.version,dependencies:p.dependencies??{}}];}));
const context={installed,capabilities:['gaga.capability.search'],runtimes:['build','edge'],bindings:[]};
const result=composeApplication(declaration,context);
assert.equal(result.ok,true,JSON.stringify(result));

test('Core: actual public composition reproduces the current plan and four provider integrations',()=>{
 const normalized=normalizeApplication(declaration);assert.equal(normalized.ok,true);
 assert.equal(stableStringify(normalized.value),stableStringify(normalizeApplication(stableStringify(normalized.value)).value));
 assert.equal(stableStringify(result.value)+'\n',readFileSync('.gaga/composition-plan.json','utf8'));
 assert.deepEqual(d.integrations.map(x=>x.package).sort(),['@gaga/corps-astro','@gaga/corps-starlight','@gaga/corps-emdash','@gaga/corps-cloudflare'].sort());
 const altered=structuredClone(context);altered.installed['@gaga/engine-capabilities'].version='99.0.0';assert.equal(composeApplication(declaration,altered).ok,false);
});
test('Editorial/Site: all eight admitted revision-pinned records project through public Corps, Arsenal and Engine',async()=>{
 const {snapshot,artifacts}=await verifySnapshot();assert.equal(snapshot.documents.length,8);
 const before=JSON.stringify(snapshot),projected=[];
 for(const doc of snapshot.documents){
  const projection=await readEmDashPublished(doc.pin,{origin:snapshot.origin,authorizeRead:async resource=>({decision:'ALLOW',resource}),readRaw:async()=>doc.item});
  assert.equal(projection.status,'projected');projected.push(projection.artifact);
 }
 const assembled=await assembleApplication(result.value,{'published-content':async()=>projected,'application-pages':async()=>[]});
 assert.equal(assembled.ok,true);assert.equal(assembled.value.artifacts.length,8);
 const search=executeSearchReference({id:'reference-proof',query:defineQuery({id:'reference-query',text:'Akal Imitasi',filters:[],facets:[],scope:[],constraints:[],diagnostics:[]}),artifacts,limitations:[],diagnostics:[]});
 assert.equal(search.status,'succeeded');assert.ok(search.output.results.length);assert.equal(JSON.stringify(snapshot),before);
});
test('Editorial: the actual public root validates, resolves and projects all admitted bodies',()=>{
 const semantics=createPortableTextSemantics(blockRegistry.map(block=>({type:block.type,stringFields:block.fields.map(field=>field.action_id)})));
 for(const doc of readSnapshot().documents){const body=editorialBody(doc.item.data),before=JSON.stringify(body);semantics.validatePortableText(body);assert.equal(semantics.plainText(body),plainText(body));assert.deepEqual(semantics.resolveSections(body),body);assert.equal(JSON.stringify(body),before);}
});
test('Editorial: independent public extension vocabulary works without application widgets',()=>{
 const semantics=createPortableTextSemantics([{type:'fieldObservation',stringFields:['label','notes']}]);
 const body=[{_type:'fieldObservation',_key:'o',label:'Moss Atlas',notes:'Independent field notes'}];
 assert.equal(semantics.validatePortableText(body),body);assert.equal(semantics.plainText(body),'Moss Atlas Independent field notes');
 assert.throws(()=>semantics.validatePortableText([{_type:'callout',_key:'c',text:'Not selected'}]));
});
test('Core/Site: independent application identity and source names compose without a new package or schema',()=>{
 const other=structuredClone(d);other.id='field-notes-reference';other.metadata={title:'Field Notes',type:'knowledge'};other.host.site='https://field.example';other.contentSources[0].id='field-records';other.contentSources[1].id='manual-pages';
 const plan=composeApplication(JSON.stringify(other),context);assert.equal(plan.ok,true);assert.equal(plan.value.declaration.id,'field-notes-reference');assert.equal(plan.value.hostProjection.site,'https://field.example');
});
test('Safety: Studio, published export, locks, provider/release/auth contracts and Search assembly remain exact qualified inputs',()=>{
 const paths=['cms/editorial/admin.tsx','cms/editorial/studio.css','cms/editorial/plugin.mjs','cms/package.json','cms/package-lock.json','package-lock.json','gaga.app.json','wrangler.jsonc','content-release.json','content/emdash/published.json','content/emdash/published-receipt.json','editorial/content-semantics.mjs','editorial/content-release.mjs','src/lib/application-search.ts','src/config/systems.ts','src/components/gaga/ArticleShell.astro','.github/workflows/deploy.yml','.github/workflows/content-release.yml','.github/workflows/content-publish.yml'];
 for(const path of paths)assert.deepEqual(readFileSync(path),execFileSync('git',['show',baseline+':'+path]),path);
});
