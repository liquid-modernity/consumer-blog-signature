import assert from 'node:assert/strict';
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const identifier=/^[A-Za-z_][A-Za-z0-9_]{0,127}$/;
function object(value,keys){assert.ok(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>keys.includes(k)),'Unexpected metadata fields');}
export function declaredSecrets(rows,worker){
 assert.ok(Array.isArray(rows)&&rows.length<=32,'Explicit secret metadata array required');
 assert.ok(typeof worker==='string'&&/^[a-z0-9][a-z0-9-]{0,62}$/.test(worker),'Exact Worker identity required');
 const result=rows.map(b=>{
  object(b,['name','kind','identity','present']);
  assert.ok(typeof b.name==='string'&&identifier.test(b.name)&&b.kind==='secret'&&b.present===true&&b.identity===worker+'/'+b.name,'Secret declaration must bind name, type, presence and Worker');
  return{name:b.name,kind:'secret',identity:b.identity,present:true};
 });
 assert.equal(new Set(result.map(b=>b.name)).size,result.length,'Duplicate binding declaration');
 return result.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
}
export function admitExpectedState(value,worker){
 object(value,['cms','publication','cmsSecretBindings']);
 assert.ok(typeof value.cms==='string'&&uuid.test(value.cms)&&typeof value.publication==='string'&&uuid.test(value.publication),'Exact expected Worker versions required');
 return{cms:value.cms,publication:value.publication,...(Object.hasOwn(value,'cmsSecretBindings')?{cmsSecretBindings:declaredSecrets(value.cmsSecretBindings,worker)}:{})};
}
export function inspectCmsBindings(actual,{worker,resources,secrets=[]}){
 const expected=[{name:'DB',kind:'database',identity:resources.d1},{name:'MEDIA',kind:'object-storage',identity:resources.r2},{name:'SESSION',kind:'key-value',identity:resources.kv},...declaredSecrets(secrets,worker)].sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
 assert.equal(new Set(expected.map(b=>b.name)).size,expected.length,'Duplicate expected binding');
 assert.ok(Array.isArray(actual),'Binding metadata array required');
 const assets=actual.filter(b=>b.type==='assets');assert.ok(assets.length<=1&&assets.every(b=>b.name==='ASSETS'),'Unexpected asset binding');
 // Project only public metadata before comparisons/errors/receipts; never copy provider objects.
 const observed=actual.filter(b=>b.type!=='assets').map(b=>{
  if(b.type==='secret_text')return{name:b.name,kind:'secret',identity:worker+'/'+b.name,present:true};
  const kind={d1:'database',r2_bucket:'object-storage',kv_namespace:'key-value'}[b.type];assert.ok(kind,'Unsupported binding type');
  return{name:b.name,kind,identity:b.type==='d1'?b.id:b.type==='r2_bucket'?b.bucket_name:b.namespace_id};
 }).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
 assert.equal(new Set(observed.map(b=>b.name)).size,observed.length,'Duplicate observed binding');
 assert.deepEqual(observed,expected,'Observed bindings differ from explicit expectation');
 return observed;
}
