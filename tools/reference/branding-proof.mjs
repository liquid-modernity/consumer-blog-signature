// Exact application components, synthetic normalized data and alternate configuration; no source edits.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,symlinkSync,rmSync,cpSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve('.'),files=['reader/EditorialFront','reader/AuthorIndex','reader/TopicIndex','frame/GlobalNavigationRail','frame/ActionRuntime','graph/KnowledgeGraph'].map(f=>root+'/src/components/'+f+'.astro');
const hashes=()=>Object.fromEntries(files.map(f=>[f.slice(root.length+1),createHash('sha256').update(readFileSync(f)).digest('hex')]));const before=hashes(),instances=[];
for(const [key,name]of [['publication','Editorial Lab'],['institution','Civic Institute']]){
 const work=realpathSync(mkdtempSync(join(tmpdir(),'gaga-brand-proof-')));
 try{
  for(const directory of ['components','config','lib','scripts','gaga','styles','runtime','features'])cpSync(root+'/src/'+directory,work+'/src/'+directory,{recursive:true});
  cpSync(root+'/gaga.app.json',work+'/gaga.app.json');
  mkdirSync(join(work,'src/pages'),{recursive:true});symlinkSync(root+'/node_modules',work+'/node_modules','dir');writeFileSync(work+'/package.json',JSON.stringify({type:'module'}));
  const site={name:name.toUpperCase(),displayName:name,navigationLabel:name+' navigation',title:'Public reference',url:'https://'+key+'.example',defaultLanguage:'id',author:name,description:'Synthetic instance',contact:{email:'public@'+key+'.example'}};
  const identity={faviconSvg:'/fixture-'+key+'.svg'};
  const bindings={
   [work+'/src/config/identity']:'export const identityConfig='+JSON.stringify(identity)+';',
   [work+'/src/config/site']:'export const siteConfig='+JSON.stringify(site)+';',
   [work+'/src/lib/content']:'export const getAuthors=async()=>[];export const getArticlesByAuthorRef=async()=>[];export const getTopicGroups=async()=>[{topic:"Fixture",href:"/topics/fixture",count:1,summary:"Synthetic public context"}];export const toArticlePreview=x=>x;',
   [work+'/src/lib/editorial']:'export const getEditorialFront=async()=>({lead:null,highlights:[],latest:[]});',
   [work+'/src/lib/pakrpp-content']:'export const getArchiveYears=async()=>[];export const getCanonicalTopicsWithCounts=async()=>[];export const toCanonicalPublications=async()=>[];',
   [work+'/src/config/pakrpp-architecture']:'export const referenceRegistry=[];export const getEnabledRootSections=()=>[];export const navigationConfig={homepagePublicationLimit:0,archivePreviewYears:[]};export const resolveCanonicalTopic=()=>undefined;export const resolvePublicationType=x=>({id:x,label:x});',
   [work+'/src/config/context-rails']:'export const globalNavigationProjection=()=>({items:[],groups:[]});'
  };
  const config=`import {resolve,dirname}from'node:path';const bindings=${JSON.stringify(bindings)};export default{site:${JSON.stringify(site.url)},vite:{plugins:[{name:'gaga-test-provider',enforce:'pre',resolveId(id,importer){if(!importer)return;const path=id.startsWith('.')?resolve(dirname(importer.split('?')[0]),id):id;const key=Object.keys(bindings).find(key=>path===key||path===key+'.ts');if(key)return'\\0gaga-fixture:'+key;},load(id){if(id.startsWith('\\0gaga-fixture:'))return bindings[id.slice('\\0gaga-fixture:'.length)];}}]}};`;
  writeFileSync(work+'/astro.config.mjs',config);
  const imports=files.map((file,index)=>'import C'+index+' from '+JSON.stringify('../components/'+file.slice((root+'/src/components/').length))+';').join('\n');
  writeFileSync(work+'/src/pages/instance.astro','---\n'+imports+'\n---\n<!doctype html><html><head><title>Fixture</title></head><body><C0/><C1/><C2/><C3/><C4/><C5 graph={{nodes:[],edges:[]}}/></body></html>');
  const log=execFileSync(process.execPath,[root+'/node_modules/astro/bin/astro.mjs','build','--root',work],{cwd:root,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:120000});
  const html=readFileSync(work+'/dist/instance/index.html','utf8');
  assert.match(html,new RegExp('id="pakrpp-root-title"[^>]*>'+name+'</h1>'));
  assert.ok(html.includes('src="'+identity.faviconSvg+'"'));assert.ok(html.includes(site.name+' / PEOPLE'));assert.ok(html.includes(site.name+' / GRAPH'));assert.ok(html.includes('data-gaga-preview-author="'+name+'"'));assert.ok(html.includes('aria-label="'+site.navigationLabel+'"'));assert.match(html,new RegExp('data-gaga-island-focus-title[^>]*>'+name+'</p>'));
  assert.ok(!/>PakRPP<|>PAKRPP \/|data-gaga-preview-author="PakRPP"/.test(html));assert.deepEqual(hashes(),before);
  instances.push({id:key,site,identity,rendererSourceUnchanged:true,htmlSha256:createHash('sha256').update(html).digest('hex')});
 }catch(error){if(error.stdout||error.stderr)console.error(String(error.stdout??'')+String(error.stderr??''));throw error;}
 finally{rmSync(work,{recursive:true,force:true});}
}
mkdirSync('.gaga',{recursive:true});writeFileSync('.gaga/branding-replacement-proof.json',JSON.stringify({status:'PASS',instances,components:before,sourceEdited:false,productionMutations:0},null,2)+'\n');
console.log('Exact six renderers, two alternate identities, normalized test providers, no component edits: PASS');
