"""Extract only the approved ZIP's independently verified public deployment payload."""
import hashlib,json,stat,sys,zipfile
from pathlib import Path,PurePosixPath
archive,root=Path(sys.argv[1]),Path(sys.argv[2]).resolve()
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='2d13f5867eb3d7a4a18171e8226dd7adca3ad366d9eeacb7b8c08f73d3fb13e9'
with zipfile.ZipFile(archive) as z:
 m=json.loads(z.read('.gaga/deployment-manifest.json'))
 assert m['sourceCommit']=='2f6fd0f6ec6af4302c34628da2c43a0c99266474'
 assert m['sourceTree']=='c642ffb12b2b24cd866f12253355fc320658a336'
 assert m['sourceSha256']=='0e095fec33206d9cec15ca538d2faf4206a2d46a3e952781bb27b25be4c201c5'
 expected={f['path']:f['sha256'] for f in m['files']};assert len(expected)==len(m['files'])
 expected['.gaga/deployment-manifest.json']=hashlib.sha256(z.read('.gaga/deployment-manifest.json')).hexdigest()
 members=[i for i in z.infolist() if not i.is_dir()];assert len(members)==len(expected) and {i.filename for i in members}==set(expected)
 for item in members:
  p=PurePosixPath(item.filename);assert not p.is_absolute() and '..' not in p.parts and '\\' not in item.filename and not stat.S_ISLNK(item.external_attr>>16)
  assert item.filename in ['wrangler.jsonc','worker/bundle.mjs','.gaga/deployment-manifest.json'] or item.filename.startswith('dist/')
  data=z.read(item);assert hashlib.sha256(data).hexdigest()==expected[item.filename];target=root.joinpath(*p.parts)
  if target.exists():assert target.is_file() and not target.is_symlink() and target.read_bytes()==data,'Refuse to replace source/artifact'
  else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
print('Approved exact payload extracted; no build')
