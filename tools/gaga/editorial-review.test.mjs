import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {verifyEditorialReview} from './editorial-review.mjs';
const record=JSON.parse(readFileSync('vendor/arsenal-editorial-review.json'));
const bytes=readFileSync(record.file);
const expected256='569210368d630def5b6e7e314c55c625578252406d0dc5ff83391217d37bfc99';
const expected512='979a87e42393c442837ba18d0a78a8f6cfe3bf195e0624689248108fa7d8a8d74506ac048fb1927f0fe6cc2f39e7b88375b54fc1d37e16b9d2ac7e1533ce7394';
test('authorized exact tarball, lockfile and installed public-root package agree',()=>{
  assert.equal(record.sha256,expected256);assert.equal(record.sha512,expected512);
  assert.deepEqual(verifyEditorialReview({installed:true}),record);
});
for(const [label,change] of [
  ['version',r=>r.version='0.1.0'],['path',r=>r.file='file:../sibling'],
  ['source',r=>r.source.commit='0'.repeat(40)],['run',r=>r.qualificationRun='1'],
  ['digest',r=>r.sha256='0'.repeat(64)],
])test('review admission rejects wrong '+label,()=>{
  const changed=structuredClone(record);change(changed);
  assert.throws(()=>verifyEditorialReview({record:changed,bytes}));
});
test('review admission rejects corrupted bytes and lock integrity',()=>{
  assert.throws(()=>verifyEditorialReview({bytes:Buffer.from('corrupted')}));
  const lock=JSON.parse(readFileSync('package-lock.json'));
  lock.packages['node_modules/@gaga/arsenal'].integrity='sha512-invalid';
  assert.throws(()=>verifyEditorialReview({lock}));
});
test('ordinary production guard continues to reject the unpublished review dependency',()=>{
  const env={...process.env};delete env.GAGA_ARSENAL_EDITORIAL_REVIEW;
  const result=spawnSync(process.execPath,['tools/gaga/boundaries.mjs'],{env,encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/GAGA dependencies must use exact public versions/);
});

test('only the authorized package lock entry changes; CMS, public content, renderer and policies stay identical',()=>{
  const baseline='25bf99cafbbfd1bd7a98e6589efa1edb39bac001';
  const previous=JSON.parse(execFileSync('git',['show',baseline+':package-lock.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('package-lock.json'));
  previous.packages[''].dependencies['@gaga/arsenal']=current.packages[''].dependencies['@gaga/arsenal'];
  previous.packages['node_modules/@gaga/arsenal']=current.packages['node_modules/@gaga/arsenal'];
  assert.deepEqual(current,previous);
  for(const path of ['cms/package.json','cms/package-lock.json','gaga.app.json','wrangler.jsonc','content-release.json','content/emdash/published.json','content/emdash/published-receipt.json','editorial/registry.mjs','editorial/portable-text.mjs','editorial/markdown.mjs','editorial/search.mjs','editorial/content-release.mjs','cms/editorial/plugin.mjs','cms/astro.cloudflare.config.mjs','cms/astro.studio.config.mjs'])
    assert.deepEqual(readFileSync(path),execFileSync('git',['show',baseline+':'+path]),path);
});
test('private package implementation cannot be imported by the application',async()=>{
  await assert.rejects(import('@gaga/arsenal'+'/dist/portable-content.mjs'),{code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
});
