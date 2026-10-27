// Explicit non-production exception; ordinary release guards retain registry-only admission.
import assert from 'node:assert/strict';
import {readFileSync,lstatSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const read = path => JSON.parse(readFileSync(path));
export function verifyEditorialReview({record=read('vendor/arsenal-editorial-review.json'),pkg=read('package.json'),lock=read('package-lock.json'),bytes=readFileSync(record.file),installed=false}={}) {
  assert.equal(process.env.GAGA_ARSENAL_EDITORIAL_REVIEW,'1','Review tarball requires explicit non-production qualification mode');
  assert.equal(record.name,'@gaga/arsenal');
  assert.equal(record.version,'0.2.0-editorial.0');
  assert.equal(record.file,'vendor/arsenal-editorial/gaga-arsenal-0.2.0-editorial.0.tgz');
  assert.equal(record.source.commit,'395982f3fe2e2ae27efb6bdabda3f822cef31c17');
  assert.equal(record.qualificationRun,'40481661000');
  for (const algorithm of ['sha256','sha512'])
    assert.equal(createHash(algorithm).update(bytes).digest('hex'),record[algorithm],'Review artifact '+algorithm);
  const spec='file:'+record.file,entry=lock.packages['node_modules/'+record.name];
  assert.equal(pkg.dependencies[record.name],spec);
  assert.equal(lock.packages[''].dependencies[record.name],spec);
  assert.equal(entry.version,record.version);
  assert.equal(entry.resolved,spec);
  assert.equal(entry.integrity,'sha512-'+Buffer.from(record.sha512,'hex').toString('base64'));
  assert.ok(!entry.link);
  if(installed){
    assert.equal(lstatSync('node_modules/'+record.name).isSymbolicLink(),false);
    const manifest=read('node_modules/'+record.name+'/package.json');
    assert.equal(manifest.name,record.name);assert.equal(manifest.version,record.version);
    assert.deepEqual(Object.keys(manifest.exports),['.']);
    assert.deepEqual(manifest.dependencies,entry.dependencies);
    for(const path of execFileSync('tar',['-tzf',record.file],{encoding:'utf8'}).trim().split('\n').filter(path=>!path.endsWith('/'))){
      assert.ok(path.startsWith('package/')&&!path.includes('..'),'Unsafe package member');
      assert.deepEqual(readFileSync('node_modules/'+record.name+'/'+path.slice(8)),execFileSync('tar',['-xOf',record.file,path]),'Installed package differs: '+path);
    }
    const api=rootApi;
    assert.equal(typeof api.createPortableTextSemantics,'function');
  }
  return record;
}
import * as rootApi from '@gaga/arsenal';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(verifyEditorialReview({installed:true}),null,2));
