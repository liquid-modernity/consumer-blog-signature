import { stripSuperShareGuards } from '../share/release-browser-guards.mjs';
import { stripQualifiedFamilyGuards } from '../family/release-browser-guards.mjs';
import { stripQualifiedMotionGuards } from '../signature/release-browser-guards.mjs';
import { stripQualifiedPersonalGuards } from '../personal/release-browser-guards.mjs';
import { stripQualifiedDocumentationGuards } from '../documentation/release-browser-guards.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
const baseline='e4e8149f3ce03969e71575dd7a719ad3b6882358';
const read=path=>JSON.parse(readFileSync(path));
const admission=read('vendor/arsenal-consumer.json');

test('official 0.2.0 admission, lock SRI and installed public package identity agree',()=>{
 assert.equal(admission.sourceCommit,'4e53068363fd842ee8e672c316a9ee64af8a6f8f');assert.equal(admission.registryVerificationRun,40518413061);
 assert.deepEqual(admission.artifacts.map(a=>a.sha256),['fd39d9ac310087c3484ad5ab1ad845ac6dda21935242e6fbf41d2dc8e42e7c63','d293129c3cf2a3614ae43c6eafd4a70378ea60452b4260d9b2e9c96a9a37875f']);
 const pkg=read('package.json'),lock=read('package-lock.json');
 for(const a of admission.artifacts){
  const entry=lock.packages['node_modules/'+a.name],installed=read('node_modules/'+a.name+'/package.json');
  assert.equal(pkg.dependencies[a.name],'0.2.0');assert.equal(lock.packages[''].dependencies[a.name],'0.2.0');assert.equal(entry.version,'0.2.0');assert.equal(installed.version,'0.2.0');assert.equal(installed.name,a.name);
  assert.ok(entry.resolved.startsWith(admission.registry));assert.equal(entry.integrity,a.integrity);assert.equal(entry.integrity,'sha512-'+Buffer.from(a.sha512,'hex').toString('base64'));
 }
 execFileSync(process.execPath,['tools/gaga/boundaries.mjs'],{stdio:'pipe'});
});

function alteredGuard(change,legacyFlag=false){
 const temp=mkdtempSync(join(tmpdir(),'arsenal-registry-guard-'));
 try{
  const pkg=read('package.json'),lock=read('package-lock.json');
  for(const dir of ['src','editorial','cms/editorial','tools/gaga'])mkdirSync(join(temp,dir),{recursive:true});
  for(const name of Object.keys(pkg.dependencies).filter(name=>name.startsWith('@gaga/')))mkdirSync(join(temp,'node_modules',name),{recursive:true});
  cpSync('vendor',join(temp,'vendor'),{recursive:true});
  change(pkg,lock,temp);
  writeFileSync(join(temp,'package.json'),JSON.stringify(pkg));writeFileSync(join(temp,'package-lock.json'),JSON.stringify(lock));
  cpSync('tools/gaga/boundaries.mjs',join(temp,'guard.mjs'));
  const result=spawnSync(process.execPath,[join(temp,'guard.mjs')],{cwd:temp,env:{PATH:process.env.PATH,...(legacyFlag?{GAGA_ARSENAL_EDITORIAL_REVIEW:'1'}:{})},encoding:'utf8'});
  assert.notEqual(result.status,0,'Production guard must deny altered dependency identity');return result.stderr;
 }finally{rmSync(temp,{recursive:true,force:true});}
}
for(const legacyFlag of [false,true])test('production guard rejects review tarball even with legacy flag '+legacyFlag,()=>{
 assert.match(alteredGuard(pkg=>pkg.dependencies['@gaga/arsenal']='file:vendor/arsenal-editorial/gaga-arsenal-0.2.0-editorial.0.tgz',legacyFlag),/GAGA dependencies must use exact public versions/);
});
for(const [name,change] of [
 ['wrong registry',(_pkg,lock)=>lock.packages['node_modules/@gaga/arsenal'].resolved='https://example.org/arsenal.tgz'],
 ['wrong version',(_pkg,lock)=>lock.packages['node_modules/@gaga/arsenal'].version='0.1.0'],
 ['wrong integrity',(_pkg,lock)=>lock.packages['node_modules/@gaga/arsenal'].integrity='sha512-invalid'],
 ['workspace link',(_pkg,lock)=>lock.packages['node_modules/@gaga/arsenal'].link=true],
 ['transitive file resolution',(_pkg,lock)=>lock.packages['node_modules/ajv'].resolved='file:../local'],
 ['installed symlink',(_pkg,_lock,temp)=>{const path=join(temp,'node_modules/@gaga/arsenal');rmSync(path,{recursive:true});symlinkSync('unavailable-source',path);}],
])test('production guard rejects '+name,()=>alteredGuard(change));

test('only the two Arsenal dependencies change; Engine, CMS, application behavior and publishing policy stay identical',()=>{
 const previous=JSON.parse(execFileSync('git',['show',baseline+':package-lock.json'],{encoding:'utf8'})),current=read('package-lock.json');
 for(const name of ['@gaga/arsenal','@gaga/arsenal-contracts']){previous.packages[''].dependencies[name]=current.packages[''].dependencies[name];previous.packages['node_modules/'+name]=current.packages['node_modules/'+name];}
 assert.deepEqual(current,previous,'Unrelated dependency identity changed');
 for(const path of ['cms/package.json','cms/package-lock.json','gaga.app.json','wrangler.jsonc','content-release.json','content/emdash/published.json','content/emdash/published-receipt.json','editorial/content-semantics.mjs','editorial/registry.mjs','editorial/portable-text.mjs','editorial/markdown.mjs','editorial/search.mjs','editorial/content-release.mjs','cms/editorial/plugin.mjs','cms/astro.cloudflare.config.mjs','cms/astro.studio.config.mjs'])
  assert.deepEqual(readFileSync(path),execFileSync('git',['show',baseline+':'+path]),path);
});
test('private Arsenal implementation stays inaccessible',async()=>{
 await assert.rejects(import('@gaga/arsenal'+'/dist/portable-content.mjs'),{code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
});


test('the production workflow retains the historical release path except its qualified browser contract gate',()=>{
 const previous=execFileSync('git',['show',baseline+':.github/workflows/deploy.yml'],{encoding:'utf8'});
 const current=readFileSync('.github/workflows/deploy.yml','utf8');
 const before="import assert from'node:assert/strict';import{readFileSync,writeFileSync}from'node:fs';\n          const stats=JSON.parse(readFileSync('.gaga/browser-results.json')).stats;assert.equal(stats.expected,4);assert.equal(stats.unexpected,0);assert.equal(stats.skipped,0);assert.equal(stats.flaky,0);";
 const after="import{assertBrowserReport}from'./tools/gaga/browser-contract.mjs';import{readFileSync,writeFileSync}from'node:fs';\n          const stats=assertBrowserReport(JSON.parse(readFileSync('.gaga/browser-results.json')));";
 assert.equal(current.split(after).length,2,'Missing or duplicate shared browser gate');
 assert.equal(stripQualifiedDocumentationGuards(stripQualifiedPersonalGuards(stripQualifiedMotionGuards(stripQualifiedFamilyGuards(stripSuperShareGuards(current))))).replace(after,before),previous,'An unrelated production workflow change was introduced');
});
