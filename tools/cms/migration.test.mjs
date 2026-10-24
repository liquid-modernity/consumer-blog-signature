import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrationSeed,root,hash} from './migration.mjs';
import {resolve} from 'node:path';
test('real migration preserves eight application identities and Markdown without reusing seed provider IDs',()=>{
 const {seed,mapping}=migrationSeed();assert.equal(mapping.length,8);assert.equal(seed.content.posts.length,7);assert.equal(seed.content.authors.length,1);
 assert.equal(new Set(mapping.map(x=>x.applicationId)).size,8);
 for(const c of seed.collections)for(const f of c.fields)assert.match(f.slug,/^[a-z][a-z0-9_]*$/);
 for(const m of mapping){const e=seed.content[m.collection].find(x=>x.id===m.applicationId);assert.equal(e.status,'published');assert.equal(e.data.application_id,m.applicationId);assert.equal(hash(e.data.body),m.bodySha256);assert.equal(hash(readFileSync(resolve(root,m.originalPath))),m.sourceSha256);assert.ok(!Object.hasOwn(e,'liveRevisionId'));}
});
test('changed migration source fails closed before CMS writes',()=>{
 const snapshot=JSON.parse(readFileSync(resolve(root,'content/emdash/snapshot.json')));snapshot.documents[0].bodySha256='0'.repeat(64);assert.throws(()=>migrationSeed(snapshot),/Migration source changed/);
});
