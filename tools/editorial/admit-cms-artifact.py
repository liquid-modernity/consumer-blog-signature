"""Admit the exact successful qualification CMS artifact; no build/provider mutation."""
import hashlib,json,os,stat,subprocess,urllib.request,urllib.error,zipfile
from pathlib import Path,PurePosixPath
root=Path.cwd();out=Path(os.environ['GAGA_EVIDENCE_DIRECTORY']).resolve();assert not out.is_relative_to(root)
run_id=os.environ['QUALIFICATION_RUN'];assert run_id.isdigit();repo='liquid-modernity/consumer-blog-signature'
def get(path):
 request=urllib.request.Request('https://api.github.com/repos/'+repo+path,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'})
 class NoRedirect(urllib.request.HTTPRedirectHandler):
  def redirect_request(self,*args):return None
 try:
  with urllib.request.build_opener(NoRedirect).open(request,timeout=60) as r:return r.read()
 except urllib.error.HTTPError as e:
  assert e.code==302
  assert e.headers['Location'].startswith('https://')
  with urllib.request.urlopen(e.headers['Location'],timeout=60) as r:return r.read()
run=json.loads(get('/actions/runs/'+run_id));assert run['conclusion']=='success' and run['path']=='.github/workflows/editorial-studio.yml'
artifacts=json.loads(get('/actions/runs/'+run_id+'/artifacts'))['artifacts'];rows=[a for a in artifacts if a['name']=='qualified-rich-cms-artifact'];assert len(rows)==1
artifact=rows[0];assert not artifact['expired'];data=get('/actions/artifacts/'+str(artifact['id'])+'/zip');digest=hashlib.sha256(data).hexdigest();assert artifact['digest']=='sha256:'+digest
out.mkdir(parents=True,exist_ok=True);archive=out/'qualified-cms.zip';archive.write_bytes(data)
with zipfile.ZipFile(archive) as z:
 for f in z.infolist():
  path=PurePosixPath(f.filename);assert not path.is_absolute() and '..' not in path.parts and '\\' not in f.filename and not stat.S_ISLNK(f.external_attr>>16)
  assert path.as_posix()=='.gaga/cms-qualified.json' or path.parts[:2]==('cms','dist-cloudflare'),f.filename
  if f.is_dir():continue
  target=root.joinpath(*path.parts);assert not target.exists(),'Refuse to replace existing artifact output';target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(f))
manifest=json.loads((root/'.gaga/cms-qualified.json').read_text());assert manifest['sourceCommit']==run['head_sha'] and str(manifest['qualificationRun'])==run_id
inputs=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{controllerInputs}from'./tools/editorial/cms-artifact.mjs';console.log(JSON.stringify(controllerInputs()));"],text=True))
assert inputs==manifest['controllerInputs'],'Controller/source input changed outside explicitly admitted export/receipt outputs'
assert hashlib.sha256((root/'cms/editorial/migration-plan.json').read_bytes()).hexdigest()==manifest['planSha256']
for f in manifest['files']:assert hashlib.sha256((root/f['path']).read_bytes()).hexdigest()==f['sha256']
receipt={'status':'PASS','qualificationRun':run_id,'qualifiedSource':run['head_sha'],'artifactId':artifact['id'],'artifactSha256':digest,'archive':str(archive),'planSha256':manifest['planSha256'],'controllerInputsSha256':inputs['sha256'],'files':manifest['files'],'rebuilds':0}
(out/'artifact-admission.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:v for k,v in receipt.items() if k not in ['files','archive']}))
