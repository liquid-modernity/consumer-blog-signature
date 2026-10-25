// Read-only diagnosis after the single repair upload; no deployment or migration commands.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=process.env.GAGA_EVIDENCE_DIRECTORY,token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID;
assert.ok(out&&token&&account);assert.ok(!resolve(out).startsWith(root+'/'));mkdirSync(out,{recursive:true});
const spec=JSON.parse(readFileSync(resolve(root,'cms/production.json'))),cfg=JSON.parse(readFileSync(resolve(root,'cms/wrangler.jsonc')));
assert.equal(spec.serviceName,'consumer-blog-signature-cms');
const receipt={status:'RUNNING',mode:'read-only-post-repair-inspection',source:process.env.GITHUB_SHA,worker:spec.serviceName,providerMutations:0,uploads:0};
async function api(path,sql){
 if(sql)assert.ok(/^SELECT [^;]+$/i.test(sql),'Only a single SELECT allowed');
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method:sql?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(sql?{body:JSON.stringify({sql})}:{}),redirect:'error',signal:AbortSignal.timeout(20000)});
 const b=await r.json();assert.ok(r.ok&&b.success,`Provider read failed HTTP ${r.status}; codes ${(b.errors??[]).map(e=>e.code)}`);assert.ok((b.result_info?.total_pages??1)<=1);return b.result;
}
try{
 assert.equal((await api('/user/tokens/verify')).status,'active');
 assert.equal(new URL(spec.origin).hostname,`${spec.serviceName}.${(await api(`/accounts/${account}/workers/subdomain`)).subdomain}.workers.dev`);
 const base=`/accounts/${account}`,worker=`${base}/workers/scripts/${spec.serviceName}`,db=cfg.d1_databases[0].database_id;
 assert.equal(db,'b26b0e8a-e193-4a7d-8e1d-c553de22fd27');assert.equal((await api(`${base}/d1/database/${db}`)).name,spec.databaseName);
 assert.equal((await api(`${base}/r2/buckets/${spec.mediaBucket}`)).name,'consumer-blog-signature-cms-media');
 assert.ok((await api(`${base}/storage/kv/namespaces`)).some(x=>x.id==='a0ad6f282a314e17bbdfec6c4e0c9fa2'&&x.title===spec.sessionNamespace));
 const bindings=(await api(`${worker}/settings`)).bindings;
 for(const [name,type,key,value] of [['DB','d1','id',db],['MEDIA','r2_bucket','bucket_name',spec.mediaBucket],['SESSION','kv_namespace','namespace_id',cfg.kv_namespaces[0].id]]){const rows=bindings.filter(x=>x.name===name);assert.equal(rows.length,1);assert.equal(rows[0].type,type);assert.equal(rows[0][key],value);}
 receipt.bindings=bindings.filter(x=>['DB','MEDIA','SESSION'].includes(x.name));
 const d=(await api(`${worker}/deployments`)).deployments[0];assert.equal(d.versions.length,1);assert.equal(d.versions[0].percentage,100);assert.equal(d.versions[0].version_id,'0bf4b66d-23bb-435f-8b14-0b2d7e64fd13');receipt.deployment={id:d.id,version:d.versions[0].version_id};
 const query=async sql=>{const r=await api(`${base}/d1/database/${db}/query`,sql);assert.equal(r.length,1);assert.equal(r[0].success,true);assert.equal(r[0].meta?.changes??0,0);assert.ok(Array.isArray(r[0].results));return r[0].results;};
 const tables=await query("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");receipt.tables=tables.map(x=>x.name);
 const applied=receipt.tables.includes('_emdash_migrations')?(await query('SELECT name FROM _emdash_migrations ORDER BY name')).map(x=>x.name):[];
 const expected=[...readFileSync(resolve(root,'cms/node_modules/emdash/src/database/migrations/runner.ts'),'utf8').matchAll(/"(\d{3}_[^"]+)": m\d+/g)].map(x=>x[1]).sort();assert.equal(expected.length,90);
 receipt.migrations={applied,pending:expected.filter(x=>!applied.includes(x)),unknown:applied.filter(x=>!expected.includes(x))};
 receipt.collections=receipt.tables.includes('_emdash_collections')?await query('SELECT slug FROM _emdash_collections ORDER BY slug'):[];
 receipt.collectionMetadata=await query('SELECT slug, label, supports, routable FROM _emdash_collections ORDER BY slug');
 receipt.collectionFields=await query('SELECT c.slug AS collection, f.slug, f.type, f.required FROM _emdash_fields AS f JOIN _emdash_collections AS c ON c.id = f.collection_id ORDER BY c.slug, f.slug');
 const seed=JSON.parse(readFileSync(resolve(root,'cms/migration/seed.json')));
 receipt.collectionStructureMatchesSeed=seed.collections.every(c=>{const actual=receipt.collectionMetadata.find(x=>x.slug===c.slug);return actual?.label===c.label&&Boolean(actual.routable)===Boolean(c.routable)&&JSON.stringify(JSON.parse(actual.supports).sort())===JSON.stringify([...(c.supports??[])].sort())&&JSON.stringify(receipt.collectionFields.filter(x=>x.collection===c.slug).map(({slug,type,required})=>({slug,type,required:Boolean(required)})))===JSON.stringify(c.fields.map(({slug,type,required})=>({slug,type,required:Boolean(required)})).sort((a,b)=>a.slug.localeCompare(b.slug)));});
 receipt.setupComplete=(await query("SELECT COUNT(*) AS count FROM options WHERE name = 'emdash:setup_complete' AND value = 'true'"))[0].count===1;
 receipt.administratorCount=(await query('SELECT COUNT(*) AS count FROM users WHERE role >= 50'))[0].count;
 receipt.counts={};for(const table of ['ec_posts','ec_authors','revisions','media','users','credentials','_emdash_api_tokens'])receipt.counts[table]=receipt.tables.includes(table)?(await query(`SELECT COUNT(*) AS count FROM ${table}`))[0].count:null;
 receipt.collectionSeedComplete=receipt.tables.includes('options')?(await query("SELECT COUNT(*) AS count FROM options WHERE name = 'emdash:seed_complete' AND value = 'true'"))[0].count===1:false;
 receipt.status='PASS';
}catch(error){receipt.status='FAIL';receipt.failure=String(error.message).replaceAll(token,'[REDACTED]').replaceAll(account,'[ACCOUNT]');throw Error(receipt.failure);}
finally{writeFileSync(resolve(out,'state.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({status:receipt.status,mode:receipt.mode,uploads:0,providerMutations:0}));}
