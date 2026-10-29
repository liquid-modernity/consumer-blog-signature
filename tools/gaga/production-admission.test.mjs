import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

function admit(scenario) {
  const dir = mkdtempSync(join(tmpdir(), 'publication-admission-'));
  const root = join(dir, 'app'), out = join(dir, 'evidence');
  mkdirSync(join(root, 'tools/gaga'), { recursive: true });
  for (const file of ['admit-production.py', 'browser-contract.mjs', 'browser-contract.json']) copyFileSync('tools/gaga/' + file, join(root, 'tools/gaga', file));
  // Exercise the actual admission script with an in-memory GitHub transport, never provider writes.
  writeFileSync(join(dir, 'mock.py'), `import io,os,json,hashlib,zipfile,runpy,urllib.request
scenario=os.environ['SCENARIO'];sha=os.environ['GITHUB_SHA']
files={'dist/index.html':b'qualified publication','worker/bundle.mjs':b'qualified worker','wrangler.jsonc':b'{}'}
qualification={'browserPassed':4 if scenario=='legacy-count' else 10,'browserFailed':1 if scenario=='failed-browser' else 0,'consumer':'PASS','auditVulnerabilities':1 if scenario=='failed-audit' else 0}
manifest={'production':True,'sourceCommit':'0'*40 if scenario=='wrong-source' else sha,'qualificationRun':'123','qualification':qualification,'files':[{'path':p,'sha256':hashlib.sha256(b).hexdigest()} for p,b in files.items()]}
files['.gaga/deployment-manifest.json']=json.dumps(manifest).encode()
buffer=io.BytesIO()
with zipfile.ZipFile(buffer,'w') as z:
 for p,b in files.items():z.writestr(p,b)
data=buffer.getvalue();digest=hashlib.sha256(data).hexdigest()
class Reply:
 def __init__(self,data):self.data=data
 def __enter__(self):return self
 def __exit__(self,*args):pass
 def read(self):return self.data
class Mock:
 def open(self,req,timeout=None):
  assert req.full_url.startswith('https://api.github.com/repos/liquid-modernity/consumer-blog-signature/')
  path=urllib.parse.urlparse(req.full_url).path
  if path.endswith('/zip'):return Reply(data)
  if path.endswith('/artifacts'):result={'total_count':1,'artifacts':[{'id':456,'name':'production-publication-candidate','expired':scenario=='expired','digest':'sha256:'+('0'*64 if scenario=='wrong-digest' else digest),'workflow_run':{'id':123,'head_sha':sha}}]}
  elif path.endswith('/heads/main'):result={'object':{'sha':'0'*40 if scenario=='main-moved' else sha}}
  else:result={'head_sha':sha,'conclusion':'success','path':'.github/workflows/check.yml' if scenario=='wrong-workflow' else '.github/workflows/deploy.yml'}
  return Reply(json.dumps(result).encode())
urllib.request.build_opener=lambda *args:Mock()
runpy.run_path('tools/gaga/admit-production.py',run_name='__main__')
`);
  try {
    const r = spawnSync('python3', [join(dir, 'mock.py')], { cwd: root, encoding: 'utf8', env: { ...process.env, SCENARIO: scenario, GAGA_EVIDENCE_DIRECTORY: out, QUALIFICATION_RUN: '123', GITHUB_SHA: '1'.repeat(40), GITHUB_REPOSITORY: 'liquid-modernity/consumer-blog-signature', GH_TOKEN: 'test-only' } });
    return { code: r.status, error: r.stderr, extracted: existsSync(join(root, 'worker/bundle.mjs')), receipt: existsSync(join(out, 'artifact-admission.json')) ? JSON.parse(readFileSync(join(out, 'artifact-admission.json'))) : null };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('actual publication admission accepts the shared ten-case contract without rebuilding', () => {
  const r = admit('valid'); assert.equal(r.code, 0, r.error); assert.equal(r.receipt.status, 'PASS'); assert.equal(r.receipt.rebuilds, 0); assert.equal(r.extracted, true);
});
for (const scenario of ['legacy-count', 'failed-browser', 'failed-audit', 'wrong-source', 'expired', 'wrong-digest', 'main-moved', 'wrong-workflow']) test('publication admission rejects ' + scenario + ' before extracting deployable bytes', () => {
  const r = admit(scenario); assert.notEqual(r.code, 0); assert.equal(r.receipt, null); assert.equal(r.extracted, false);
});
