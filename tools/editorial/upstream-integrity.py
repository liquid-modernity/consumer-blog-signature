"""Compare every shipped EmDash core file with its locked, anonymous npm artifact."""
import base64,hashlib,io,json,os,tarfile,urllib.request
from pathlib import Path
root=Path.cwd();out=Path(os.environ['GAGA_EVIDENCE_DIRECTORY']).resolve()
assert not out.is_relative_to(root.resolve())
locked=json.loads((root/'cms/package-lock.json').read_text())['packages']['node_modules/emdash']
assert locked['version']=='1.3.1' and locked['resolved']=='https://registry.npmjs.org/emdash/-/emdash-1.3.1.tgz'
with urllib.request.urlopen(locked['resolved'],timeout=60) as response: data=response.read()
assert 'sha512-'+base64.b64encode(hashlib.sha512(data).digest()).decode()==locked['integrity']
files=0
with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as archive:
 for member in archive:
  if member.isdir(): continue
  assert member.isfile() and member.name.startswith('package/') and '..' not in Path(member.name).parts
  path=root/'cms/node_modules/emdash'/member.name.removeprefix('package/')
  assert path.is_file() and path.read_bytes()==archive.extractfile(member).read(),str(path)
  files+=1
out.mkdir(parents=True,exist_ok=True)
(out/'emdash-core-integrity.json').write_text(json.dumps({'status':'PASS','package':'emdash','version':'1.3.1','artifactSha256':hashlib.sha256(data).hexdigest(),'integrity':locked['integrity'],'officialFilesByteIdentical':files,'corePatches':0},indent=2)+'\n')
print('Official EmDash core files byte-identical:',files)
