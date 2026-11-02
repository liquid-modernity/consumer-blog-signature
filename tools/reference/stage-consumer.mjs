// Qualification-only held-package installation. Production registry gates remain unchanged.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,copyFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const pin=JSON.parse(readFileSync('architecture/reference-extraction-candidate.json'));
const out=resolve(process.env.GAGA_EVIDENCE_DIRECTORY??'');assert.ok(process.env.GAGA_EVIDENCE_DIRECTORY,'External evidence required');mkdirSync(out,{recursive:true});
const work=mkdtempSync(join(process.env.RUNNER_TEMP??'/tmp','gaga-held-arsenal-')),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const base='https://api.github.com/repos/liquid-modernity/gaga-arsenal';
const headers={Accept:'application/vnd.github+json',...(process.env.GITHUB_TOKEN?{Authorization:'Bearer '+process.env.GITHUB_TOKEN}:{})};
async function api(path){const r=await fetch(base+path,{headers,signal:AbortSignal.timeout(60000)});assert.equal(r.status,200,'Qualified package evidence unavailable');return r.json();}
const run=await api('/actions/runs/'+pin.run);assert.equal(run.conclusion,'success');assert.equal(run.head_sha,pin.source);assert.equal(run.path,'.github/workflows/verify.yml');
const artifact=await api('/actions/artifacts/'+pin.artifact);assert.equal(artifact.workflow_run.id,pin.run);assert.equal(artifact.digest,'sha256:'+pin.archiveSha256);assert.equal(artifact.expired,false);
const response=await fetch(base+'/actions/artifacts/'+pin.artifact+'/zip',{headers,signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(hash(bytes),pin.archiveSha256);
const archive=join(work,'qualified.zip');writeFileSync(archive,bytes);copyFileSync(archive,join(out,'arsenal-qualified.zip'));
execFileSync('python3',['-c',"import sys,zipfile,pathlib; z=zipfile.ZipFile(sys.argv[1]); assert all(not n.startswith('/') and '..' not in pathlib.PurePosixPath(n).parts for n in z.namelist()); z.extractall(sys.argv[2])",archive,work]);
const original=readFileSync('package.json'),originalLock=readFileSync('package-lock.json'),manifest=JSON.parse(original);writeFileSync(join(out,'source-package.json'),original);writeFileSync(join(out,'source-package-lock.json'),originalLock);
const applicationSource=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.equal(applicationSource,process.env.PUBLIC_GIT_SHA,'Application source must match the pinned checkout');
const originalIdentity={manifest:hash(original),lock:hash(originalLock)};
const packages=pin.packages.map(p=>{const path=join(work,'reference/packages',p.file),data=readFileSync(path);assert.equal(hash(data),p.sha256);const installed=JSON.parse(execFileSync('tar',['-xOf',path,'package/package.json'],{encoding:'utf8'}));assert.equal(installed.name,p.name);assert.equal(installed.version,p.version);assert.equal(manifest.dependencies[p.name],p.version);manifest.dependencies[p.name]='file:'+path;return{...p,path};});
writeFileSync('package.json',JSON.stringify(manifest,null,2)+'\n');
execFileSync('npm',['install','--package-lock-only','--ignore-scripts','--no-audit','--no-fund'],{stdio:'inherit'});
execFileSync('npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{stdio:'inherit'});
// Restore the exact numeric source declaration; held locks are intentionally non-admissible to production.
writeFileSync('package.json',original);
const lock=JSON.parse(readFileSync('package-lock.json')),baseline=JSON.parse(originalLock);
for(const p of packages){const key='node_modules/'+p.name;assert.equal(lock.packages[key].version,p.version);assert.equal(lock.packages[key].integrity,'sha512-'+p.sha512Base64);baseline.packages[key]=lock.packages[key];baseline.packages[''].dependencies[p.name]=lock.packages[''].dependencies[p.name];}
assert.deepEqual(lock,baseline,'Staged qualification must not change unrelated dependency identities');
const guard=(()=>{try{execFileSync(process.execPath,['tools/gaga/boundaries.mjs'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});return null;}catch(e){return String(e.stderr);}})();assert.match(guard,/Local package resolutions are not production dependencies/);
writeFileSync(join(out,'held-production-rejection.log'),guard);
writeFileSync(join(out,'staging-receipt.json'),JSON.stringify({status:'STAGED_ONLY',productionAdmissible:false,source:{commit:applicationSource,...originalIdentity},packageSource:pin.source,packageQualification:pin.run,packages:packages.map(({path,...p})=>p),unrelatedDependenciesUnchanged:true,productionBoundaryRejectsHeldPackages:true,productionMutations:0},null,2)+'\n');
console.log('Exact hosted-qualified package bytes staged; production guard correctly rejects held dependencies.');
