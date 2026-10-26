import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,rmSync,existsSync}from'node:fs';
import {tmpdir}from'node:os';
import {join}from'node:path';
import {execFileSync,spawnSync}from'node:child_process';
function simulate(scenario){
 const temp=mkdtempSync(join(tmpdir(),'cms-admission-')),root=join(temp,'app'),out=join(temp,'evidence');
 mkdirSync(join(root,'tools/editorial'),{recursive:true});mkdirSync(join(root,'tools/gaga'));mkdirSync(join(root,'cms'));mkdirSync(out);
 copyFileSync('tools/editorial/provider-bindings.mjs',join(root,'tools/editorial/provider-bindings.mjs'));
 copyFileSync('cms/production.json',join(root,'cms/production.json'));
 copyFileSync('tools/editorial/admit-cms-artifact.py',join(root,'tools/editorial/admit-cms-artifact.py'));
 copyFileSync('tools/gaga/source-identity.mjs',join(root,'tools/gaga/source-identity.mjs'));
 writeFileSync(join(root,'cms/input'),'qualified source');
 const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8',stdio:['pipe','pipe','pipe'],env:{...process.env,GIT_AUTHOR_NAME:'Test',GIT_AUTHOR_EMAIL:'test@example.invalid',GIT_COMMITTER_NAME:'Test',GIT_COMMITTER_EMAIL:'test@example.invalid'}}).trim();
 git('init','-q');git('add','.');git('commit','-qm','candidate');const source=git('rev-parse','HEAD');
 writeFileSync(join(root,'controller-note'),'tooling correction');if(scenario==='changed-cms')writeFileSync(join(root,'cms/input'),'changed');
 git('add','.');git('commit','-qm','controller');const controller=git('rev-parse','HEAD');
 const mock=join(temp,'mock.py');
 writeFileSync(mock,`import io,os,json,hashlib,zipfile,runpy,urllib.request
buffer=io.BytesIO()
with zipfile.ZipFile(buffer,'w') as z:z.writestr('server/wrangler.json','{}')
data=buffer.getvalue();digest=hashlib.sha256(data).hexdigest();scenario=os.environ['SCENARIO']
os.environ['CMS_ARTIFACT_SHA256']='0'*64 if scenario=='wrong-digest' else digest
class Reply:
 def __init__(self,data):self.data=data
 def __enter__(self):return self
 def __exit__(self,*a):pass
 def read(self):return self.data
class Mock:
 def open(self,req,timeout=None):
  path=urllib.parse.urlparse(req.full_url).path
  if path.endswith('/zip'):return Reply(data)
  if '/runs/' in path:result={'id':123,'status':'completed','conclusion':'failure' if scenario=='failed-run' else 'success','head_sha':'0'*40 if scenario=='wrong-source' else os.environ['CMS_ARTIFACT_SOURCE'],'repository':{'full_name':'liquid-modernity/consumer-blog-signature'}}
  elif path.endswith('/heads/main'):result={'object':{'sha':os.environ['GITHUB_SHA']}}
  else:result={'id':456,'expired':scenario=='expired','digest':'sha256:'+digest,'workflow_run':{'id':124 if scenario=='wrong-run' else 123,'head_sha':os.environ['CMS_ARTIFACT_SOURCE']}}
  return Reply(json.dumps(result).encode())
urllib.request.build_opener=lambda *a:Mock()
runpy.run_path('tools/editorial/admit-cms-artifact.py',run_name='__main__')
`);
 try{
 const r=spawnSync('python3',[mock],{cwd:root,env:{...process.env,SCENARIO:scenario,GH_TOKEN:'fake-token',QUALIFICATION_RUN:'123',CMS_ARTIFACT_ID:'456',CMS_ARTIFACT_SOURCE:source,GITHUB_SHA:controller,GITHUB_REF:'refs/heads/main',GAGA_EVIDENCE_DIRECTORY:out,GAGA_EXPECTED_PRODUCTION_STATE:JSON.stringify({...(['secret-valid','secret-wrong-worker','secret-value'].includes(scenario)?{cmsSecretBindings:[{name:'EMDASH_ENCRYPTION_KEY',kind:'secret',identity:scenario==='secret-wrong-worker'?'another/EMDASH_ENCRYPTION_KEY':'consumer-blog-signature-cms/EMDASH_ENCRYPTION_KEY',present:true,...(scenario==='secret-value'?{value:'do-not-record'}:{})}]}:{}),cms:'e69a0e28-0788-4b8b-80af-77ae17296896',publication:'51f60924-2ec7-4cc0-831f-e36aff523b62'})},encoding:'utf8'});
 return{code:r.status,error:r.stderr,receipt:existsSync(join(out,'artifact-admission.json'))?JSON.parse(readFileSync(join(out,'artifact-admission.json'))):null,extracted:existsSync(join(root,'cms/dist-cloudflare/server/wrangler.json'))};
 }finally{rmSync(temp,{recursive:true,force:true});}
}
test('unchanged qualified CMS bytes are admitted with a distinct immutable controller source',()=>{const r=simulate('ok');assert.equal(r.code,0,r.error);assert.equal(r.receipt.rebuilds,0);assert.notEqual(r.receipt.qualifiedSource,r.receipt.controllerSource);assert.equal(r.extracted,true);});
for(const scenario of ['wrong-digest','wrong-source','wrong-run','failed-run','expired','changed-cms'])test(scenario+' rejects existing artifact before extraction',()=>{const r=simulate(scenario);assert.notEqual(r.code,0);assert.equal(r.extracted,false);assert.equal(r.receipt,null);});
test('legacy signoff was replaced by immutable source and artifact admission, not a history rewrite',()=>{const w=readFileSync('.github/workflows/deploy.yml','utf8');assert.ok(!w.includes("grep -F 'Signed-off-by:'"));assert.ok(w.includes('node tools/gaga/deployment-manifest.mjs'));assert.ok(w.includes('python3 tools/gaga/admit-production.py'));assert.ok(readFileSync('tools/gaga/deployment-manifest.mjs','utf8').includes('sourceIdentity()'));});

test('artifact admission carries an explicit validated secret expectation without installing it',()=>{const r=simulate('secret-valid');assert.equal(r.code,0,r.error);assert.equal(r.receipt.expectedState.cmsSecretBindings[0].present,true);assert.equal(r.receipt.rebuilds,0);});
for(const scenario of ['secret-wrong-worker','secret-value'])test('artifact admission rejects '+scenario,()=>{const r=simulate(scenario);assert.notEqual(r.code,0);assert.equal(r.receipt,null);assert.ok(!r.error.includes('do-not-record'));});
