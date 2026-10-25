import test from 'node:test';
import assert from 'node:assert/strict';
import {productionPlan} from './production-plan.mjs';
import {hash} from './migration.mjs';
test('exact admitted plan is deterministic, preserves editorial bytes/dates and generates no native IDs',()=>{
 const plan=productionPlan();assert.deepEqual(productionPlan(),plan);assert.equal(plan.records.length,8);assert.equal(plan.records[0].collection,'authors');assert.equal(new Set(plan.records.map(x=>x.applicationId)).size,8);
 for(const r of plan.records){assert.equal(r.bodySha256,hash(r.create.data.body));assert.equal(r.create.data.application_id,r.applicationId);assert.equal(r.create.status,'draft');assert.equal(r.expectedStatus,'published');assert.ok(!('id' in r.create));assert.equal(new Date(r.publish.publishedAt).toISOString(),r.publish.publishedAt);if(r.create.data.metadata.publishedAt)assert.equal(r.publish.publishedAt,new Date(r.create.data.metadata.publishedAt).toISOString());}
 assert.equal(plan.records[0].publicationDateSource,'admitted-local-export');assert.equal(plan.records.filter(x=>x.collection==='posts').length,7);
});
