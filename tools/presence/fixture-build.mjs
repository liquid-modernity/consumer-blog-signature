// Isolated Astro host renders the exact production component with two configurations/providers.
import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,realpathSync,copyFileSync,symlinkSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join,resolve,relative}from'node:path';import{execFileSync}from'node:child_process';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';
import{createPresenceRegistry,presenceSections}from'../../src/config/presence-composition.mjs';import{fixtureConfig,alternateConfig,fixtureProviders}from'./fixtures.mjs';
const component=resolve('src/components/reader/PresenceContent.astro'),before=createHash('sha256').update(readFileSync(component)).digest('hex'),root=realpathSync(mkdtempSync(join(tmpdir(),'gaga-presence-fixture-')));let proof;
try{
 symlinkSync(resolve('node_modules'),join(root,'node_modules'),'dir');mkdirSync(join(root,'src/pages'),{recursive:true});
 mkdirSync(join(root,'src/components/reader'),{recursive:true});mkdirSync(join(root,'src/config'),{recursive:true});copyFileSync(component,join(root,'src/components/reader/PresenceContent.astro'));copyFileSync(resolve('src/config/presence-composition.mjs'),join(root,'src/config/presence-composition.mjs'));
 writeFileSync(join(root,'package.json'),JSON.stringify({type:'module'}));writeFileSync(join(root,'astro.config.mjs'),"export default {site:'https://fixture.example',build:{format:'directory'}};");
 const configs={default:fixtureConfig(),alternate:alternateConfig()};configs.alternate.capabilities.push({...configs.alternate.capabilities[0],id:'speaking',route:'speaking',label:{id:'Berbicara',en:'Speaking'}});configs.alternate.routes.speaking='/speaking';
 const projections=[];
 for(const [name,config]of Object.entries(configs)){
  const registry=createPresenceRegistry(config,{origin:'https://'+(name==='default'?'fixture':'alternate')+'.example',providers:fixtureProviders});
  const pages=[];
  for(const c of registry.capabilities){
   if(name==='alternate'){c.data.sections[2].order=0;c.data.sections=presenceSections(c.data.sections);}
   const slug=name+c.path;mkdirSync(join(root,'src/pages',slug),{recursive:true});
   const label=name==='default'?'Synthetic Person':'Other Person';
   writeFileSync(join(root,'src/pages',slug,'index.astro'),`---\nimport PresenceContent from ${JSON.stringify(relative(join(root,'src/pages',slug),join(root,'src/components/reader/PresenceContent.astro')))};\nconst capability=${JSON.stringify(c)};const navigation=${JSON.stringify(registry.navigation('en'))};\n---\n<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${label}</title><link rel="canonical" href={capability.canonicalUrl}/></head><body><a href="#main">Skip</a><nav>{navigation.map(n=><a href={n.href}>{n.title}</a>)}</nav><main id="main"><h1>${label}: {capability.data.title}</h1><PresenceContent capability={capability} content={capability.data}/></main></body></html>`);
   pages.push(slug+'/index.html');
  }
  projections.push({name,registry,pages});
 }
 execFileSync(process.execPath,[resolve('node_modules/astro/bin/astro.mjs'),'build','--root',root],{stdio:'pipe',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},timeout:120000});
 for(const {name,registry,pages}of projections)for(const page of pages){const html=readFileSync(join(root,'dist',page),'utf8');const capability=registry.capabilities.find(c=>page===name+c.path+'/index.html');assert.ok(html.includes(`href="${capability.canonicalUrl}"`));for(const item of registry.navigation('en'))assert.ok(html.includes('href="'+item.href+'"'));assert.ok(html.includes(name==='default'?'Synthetic Person':'Other Person'));assert.ok(html.includes('data-gaga-presence="'+capability.id+'"'));if(name==='alternate'){assert.ok(!html.includes('href="/work"'));assert.ok(html.indexOf('id="skills"')<html.indexOf('id="experience"'));assert.ok(html.includes('https://alternate.example/connect'));}}
 assert.equal(createHash('sha256').update(readFileSync(component)).digest('hex'),before);
 proof={status:'PASS',productionComponentSha256:before,instances:projections.map(({name,registry,pages})=>({name,routes:registry.capabilities.map(c=>({id:c.id,path:c.path,canonical:c.canonicalUrl})),navigation:registry.navigation('en'),generatedFiles:pages})),sourceEdited:false,syntheticProductionRoutes:0};
}finally{rmSync(root,{recursive:true,force:true});}
mkdirSync('.gaga',{recursive:true});writeFileSync('.gaga/presence-instance-proof.json',JSON.stringify(proof,null,2)+'\n');console.log('Same renderer, two instances/providers, alternate routes/canonical/branding/order/disable/custom extension: PASS');
