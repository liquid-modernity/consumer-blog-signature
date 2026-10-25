import assert from 'node:assert/strict';import{readFileSync,writeFileSync}from'node:fs';import{resolve}from'node:path';import{createHash}from'node:crypto';
const origin='https://consumer-blog-signature.ratriatra.workers.dev',out=process.env.GAGA_EVIDENCE_DIRECTORY,m=JSON.parse(readFileSync('.gaga/deployment-manifest.json'));
assert.equal(m.sourceCommit,process.env.GITHUB_SHA);const digest=b=>createHash('sha256').update(b).digest('hex');const receipt={status:'RUNNING',origin,sourceCommit:m.sourceCommit,artifactSourceSha256:m.sourceSha256,anonymous:true,checks:[]};
async function get(path,method='GET'){
 let url=origin+path;for(let i=0;i<4;i++){const r=await fetch(url,{method,redirect:'manual',signal:AbortSignal.timeout(25000)});if([301,302,303,307,308].includes(r.status)){url=new URL(r.headers.get('location'),url).href;assert.equal(new URL(url).origin,origin);continue;}return r;}throw Error('Too many production redirects');
}
try{
 const extra=[/^dist\/archive\/\d{4}\/index\.html$/,/^dist\/tags\/[^/]+\/index\.html$/].map(pattern=>{const f=m.files.find(x=>pattern.test(x.path));assert.ok(f,'Qualified archive/topic route missing');return ['/'+f.path.slice(5).replace(/index\.html$/,''),f.path];});
 for(const [route,file] of [['/','dist/index.html'],['/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity','dist/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity/index.html'],['/knowledge','dist/knowledge/index.html'],['/tags','dist/tags/index.html'],['/publications','dist/publications/index.html'],...extra,...['search-index.json','machine.json','agent.json','sitemap.xml','sitemap-index.xml','rss.xml','robots.txt','llms.txt'].map(x=>['/'+x,'dist/'+x])]){
  const expected=m.files.find(x=>x.path===file);assert.ok(expected,'Expected qualified route missing: '+file);let accepted=false;
  for(let attempt=0;attempt<6;attempt++){const r=await get(route);const bytes=Buffer.from(await r.arrayBuffer()),sha256=digest(bytes);receipt.checks.push({route,status:r.status,sha256,attempt});if(r.status===200&&sha256===expected.sha256){accepted=true;break;}assert.ok([200,404,503].includes(r.status),'Unexpected production response '+r.status+' for '+route);if(attempt<5)await new Promise(resolve=>setTimeout(resolve,2000));}
  assert.ok(accepted,'Production differs from qualified bytes after bounded propagation checks: '+route);
 }
 const search=await get('/api/search?q=Akal%20Imitasi');assert.equal(search.status,200);const body=await search.json();assert.equal(body.status,'succeeded');assert.ok(body.output.results.some(x=>x.title.includes('Dignity')));receipt.search={status:body.status,matchedArtifactIds:body.output.matchedArtifactIds};
 assert.equal((await get('/api/search?q=')).status,400);assert.equal((await get('/api/search?q=Akal','POST')).status,405);receipt.malformedQueryStatus=400;receipt.unsupportedMethodStatus=405;receipt.status='PASS';
}catch(error){receipt.status='FAIL';receipt.failure=error.message;throw error;}
finally{writeFileSync(resolve(out,'public-readback.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));}
