"""Download one successful candidate's exact deployment ZIP; never rebuild."""
import hashlib,json,os,stat,urllib.request,urllib.error,zipfile
from pathlib import Path,PurePosixPath
root=Path.cwd();out=Path(os.environ['GAGA_EVIDENCE_DIRECTORY']).resolve();assert not out.is_relative_to(root);out.mkdir(parents=True,exist_ok=True)
run_id=os.environ['QUALIFICATION_RUN'];assert run_id.isdigit();sha=os.environ['GITHUB_SHA'];repo=os.environ['GITHUB_REPOSITORY'];assert repo=='liquid-modernity/consumer-blog-signature'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*_args):return None
def get(path):
 request=urllib.request.Request('https://api.github.com/repos/'+repo+path,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'})
 try:
  with urllib.request.build_opener(NoRedirect).open(request,timeout=60) as r:return r.read()
 except urllib.error.HTTPError as e:
  if e.code!=302:raise RuntimeError('GitHub admission HTTP '+str(e.code)) from None
  location=e.headers['Location'];assert location.startswith('https://')
  with urllib.request.urlopen(location,timeout=60) as r:return r.read()
run=json.loads(get('/actions/runs/'+run_id));assert run['head_sha']==sha and run['conclusion']=='success' and run['path']=='.github/workflows/deploy.yml'
assert json.loads(get('/git/ref/heads/main'))['object']['sha']==sha,'Main moved'
artifacts=json.loads(get('/actions/runs/'+run_id+'/artifacts'));assert artifacts['total_count']==len(artifacts['artifacts'])
a=[x for x in artifacts['artifacts'] if x['name']=='production-publication-candidate' and not x['expired']];assert len(a)==1;a=a[0]
assert a['workflow_run']['head_sha']==sha and a['workflow_run']['id']==int(run_id)
archive=out.parent/'qualified-publication.zip';archive.write_bytes(get('/actions/artifacts/'+str(a['id'])+'/zip'));digest=hashlib.sha256(archive.read_bytes()).hexdigest();assert a['digest']=='sha256:'+digest
with zipfile.ZipFile(archive) as z:
 manifest=json.loads(z.read('.gaga/deployment-manifest.json'));assert manifest['production'] is True and manifest['sourceCommit']==sha and str(manifest['qualificationRun'])==run_id
 assert manifest['qualification']=={'browserPassed':4,'browserFailed':0,'consumer':'PASS','auditVulnerabilities':0}
 expected={x['path']:x['sha256'] for x in manifest['files']};assert len(expected)==len(manifest['files']);expected['.gaga/deployment-manifest.json']=hashlib.sha256(z.read('.gaga/deployment-manifest.json')).hexdigest()
 members=[i for i in z.infolist() if not i.is_dir()];assert len(members)==len(expected) and {i.filename for i in members}==set(expected)
 for item in members:
  p=PurePosixPath(item.filename);assert not p.is_absolute() and '..' not in p.parts and '\\' not in item.filename and not stat.S_ISLNK(item.external_attr>>16)
  assert item.filename in ['wrangler.jsonc','worker/bundle.mjs','.gaga/deployment-manifest.json'] or item.filename.startswith('dist/')
  data=z.read(item);assert hashlib.sha256(data).hexdigest()==expected[item.filename];target=root.joinpath(*p.parts)
  if target.exists():assert target.read_bytes()==data,'Refuse changing existing source/artifact'
  else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
receipt={'status':'PASS','sourceCommit':sha,'qualificationRun':int(run_id),'artifactId':a['id'],'artifactSha256':digest,'archive':str(archive),'rebuilds':0}
(out/'artifact-admission.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
