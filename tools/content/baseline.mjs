// Qualification evidence only: retain deployed publication bytes across a private CMS-only correction.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync}from'node:fs';
import {resolve,dirname,relative,isAbsolute}from'node:path';
import {pathToFileURL}from'node:url';
import {execFileSync}from'node:child_process';
export function admitPublicReuse(paths){
 assert.ok(paths.length>0,'No source correction to admit');
 for(const path of paths)assert.ok(
  path.startsWith('cms/editorial/')||path.startsWith('.github/workflows/')||
  /^tools\/.+\.test\.mjs$/.test(path)||['tools/content/baseline.mjs','tools/editorial/production-control.mjs','tools/editorial/provider-bindings.mjs','tools/editorial/admit-cms-artifact.py'].includes(path),
  'Public build input changed; fresh application qualification is required: '+path);
}
export const qualificationContent=records=>records.map(({id,resource,revision,updatedAt,bodyDigest})=>({id,resource,revision,updatedAt,bodyDigest}));
export async function sealBaseline({previous,root,controller,cache,output,env=process.env}){
 const module=p=>import(pathToFileURL(resolve(controller,'release',p)));
 const [{sourceIdentity,safePath},{fingerprint,bytesDigest,admitManifest},{githubEvidence},{transport}]=await Promise.all([
  module('controller/source.mjs'),module('controller/model.mjs'),module('providers/github.mjs'),module('controller/transport.mjs')]);
 admitManifest(previous);
 for(const parent of [root,controller]){const r=relative(resolve(parent),resolve(output));assert.ok(isAbsolute(r)||r==='..'||r.startsWith('../'),'External output required');}
 const actual=sourceIdentity(root);assert.equal(actual.commit,env.GITHUB_SHA);
 execFileSync('git',['merge-base','--is-ancestor',previous.source.commit,'HEAD'],{cwd:root});
 assert.equal(execFileSync('git',['rev-parse',previous.source.commit+'^{tree}'],{cwd:root,encoding:'utf8'}).trim(),previous.source.tree);
 const changes=execFileSync('git',['diff','--name-only','-z',previous.source.commit,'HEAD'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
 admitPublicReuse(changes);
 const metrics={reads:0,mutatingRequests:0};
 const evidence=await githubEvidence(previous,{cache,env,net:transport({mode:'verify',secrets:[env.GH_TOKEN],metrics})});
 for(const check of ['source-artifact-binding','browser','security','runtime'])assert.ok(evidence.checks.includes(check));
 evidence.verifyBytes();
 const inspection=JSON.parse(readFileSync(env.GAGA_FOUNDATION_INSPECTION));
 assert.equal(inspection.status,'PASS');assert.equal(inspection.uploads,0);assert.equal(inspection.contentWrites,0);assert.equal(inspection.schemaWrites,0);
 assert.equal(inspection.publishing.github,false);assert.equal(inspection.publishing.nativeEffective,false);assert.equal(inspection.publishing.nativeStored,false);
 assert.equal(inspection.publication.version,previous.expectedState.revision,'Public deployment changed');
 const payload=resolve(output,'payload');mkdirSync(payload);
 for(const file of evidence.inventory){mkdirSync(dirname(resolve(payload,file.path)),{recursive:true});const target=safePath(payload,file.path);copyFileSync(safePath(evidence.payload,file.path),target);assert.equal(bytesDigest(readFileSync(target)),file.digest);}
 const source={commit:actual.commit,tree:actual.tree,digest:actual.digest};
 const c=sourceIdentity(controller,{untracked:false}),controllerIdentity={commit:c.commit,tree:c.tree,digest:c.digest};
 const index={schema:'gaga.qualification/v1',source,buildSource:previous.source,
  foundation:{controller:controllerIdentity,pipeline:source,publishing:inspection.publishing,expectedState:{publication:inspection.publication.version,cms:inspection.cms.version},bindings:inspection.bindings},
  reuse:{qualification:evidence.evidence,artifact:previous.artifact,scope:'Unchanged public build inputs; CMS/admin, tests and workflow changes only',privateChanges:changes},
  files:evidence.inventory,checks:evidence.checks.map(id=>({id,status:'passed'})),content:qualificationContent(previous.content.records)};
 const indexPath='.gaga/baseline-qualification.json';mkdirSync(dirname(resolve(payload,indexPath)),{recursive:true});
 writeFileSync(resolve(payload,indexPath),JSON.stringify(index,null,2)+'\n');
 const next=structuredClone(previous);next.release.id=previous.release.id+'/preview-baseline';
 next.source={...previous.source,...source};const cms=next.expectedState.dependencies.find(d=>d.id==='consumer-blog-signature-cms');cms.revision=inspection.cms.version;cms.bindings=inspection.bindings;next.rollback.revision=inspection.publication.version;next.qualification.reference=`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
 next.artifact.index={path:indexPath,format:'gaga.qualification/v1',digest:bytesDigest(readFileSync(resolve(payload,indexPath)))};
 next.artifact.inventoryDigest=fingerprint(evidence.inventory);
 writeFileSync(resolve(output,'manifest-template.json'),JSON.stringify(next,null,2)+'\n');
 writeFileSync(resolve(output,'reuse-proof.json'),JSON.stringify({status:'PASS',qualificationSource:source,originalBuildSource:previous.source,privateChanges:changes,publicPayloadUnchanged:true,publicPayloadInventoryDigest:fingerprint(evidence.inventory),publicationRebuilds:0,transport:metrics},null,2)+'\n');
 return {payload,source,publicPayloadUnchanged:true,mutations:metrics.mutatingRequests};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 const [previous,output]=process.argv.slice(2);assert.ok(previous&&output&&process.env.GAGA_CONTROLLER_ROOT);
 console.log(JSON.stringify(await sealBaseline({previous:JSON.parse(readFileSync(previous)),root:process.cwd(),controller:process.env.GAGA_CONTROLLER_ROOT,cache:resolve(output,'cache'),output:resolve(output)})));
}
