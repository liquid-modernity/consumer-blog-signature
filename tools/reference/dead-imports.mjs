import assert from 'node:assert/strict';
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
const removed=JSON.parse(readFileSync(new URL('./removed-paths.json',import.meta.url))),paths=new Set(removed.map(p=>resolve(p)));
const options={allowJs:true,moduleResolution:ts.ModuleResolutionKind.Bundler,module:ts.ModuleKind.ESNext,baseUrl:'.',paths:{'@config/*':['src/config/*'],'@components/*':['src/components/*'],'@lib/*':['src/lib/*'],'@scripts/*':['src/scripts/*']}};
for(const file of readdirSync('src',{recursive:true}).filter(f=>/\.(?:ts|mjs|js|astro)$/.test(f)).map(f=>'src/'+f)){
 if(paths.has(resolve(file)))continue;
 for(const match of readFileSync(file,'utf8').matchAll(/(?:from\s*|import\s*\(|export\s*\*\s*from\s*)['"]([^'"]+)['"]/g)){
  const result=ts.resolveModuleName(match[1],resolve(file),options,ts.sys).resolvedModule;
  assert.ok(!result||!paths.has(resolve(result.resolvedFileName)),'Active import of removed path: '+file+' -> '+match[1]);
  if(match[1].startsWith('.'))for(const path of paths)assert.notEqual(resolve(file,'..',match[1]).replace(/\.(?:mjs|ts)$/,''),path.replace(/\.(?:mjs|ts)$/,''),'Unresolved import of removed path: '+file);
 }
}
if(process.argv.includes('--verify-removed'))for(const path of removed)assert.equal(existsSync(path),false,'Obsolete path returned: '+path);
console.log(JSON.stringify({status:'PASS',removedPaths:removed.length,activeSourceImports:0}));
