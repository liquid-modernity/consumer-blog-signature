"""Admit the already-qualified CMS ZIP; never build or contact Cloudflare."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import urllib.error
import urllib.request
import zipfile

SOURCE = 'df3c022368726f07545f1736184ea77fe24ce5cf'
RUN = 40165537376
ARTIFACT = 12588356357
SHA256 = 'e063e7ff2dec9c8212ff883e1d1e164ce4df5ca8e4b8fab7fb1d48bb57c2b518'
VERSION = '3b493d27-84ee-47b9-a2f3-2ebd4794dadb'
REPO = 'liquid-modernity/consumer-blog-signature'
root = Path(__file__).resolve().parents[2]
out = Path(os.environ['GAGA_EVIDENCE_DIRECTORY']).resolve()
assert not out.is_relative_to(root), 'External evidence required'
out.mkdir(parents=True, exist_ok=True)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_args):
        return None

def github(path):
    request = urllib.request.Request('https://api.github.com/repos/' + REPO + path,
        headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json'})
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        if error.code != 302:
            raise RuntimeError('GitHub admission failed: HTTP ' + str(error.code)) from None
        location = error.headers['Location']
        assert location.startswith('https://'), 'Unsafe artifact redirect'
        # The signed download receives no GitHub Authorization header.
        with urllib.request.urlopen(location, timeout=60) as response:
            return response.read()

run = json.loads(github('/actions/runs/' + str(RUN)))
assert run['head_sha'] == SOURCE and run['conclusion'] == 'success'
artifact = json.loads(github('/actions/artifacts/' + str(ARTIFACT)))
assert artifact['name'] == 'cms-worker-candidate' and not artifact['expired']
assert artifact['workflow_run']['id'] == RUN and artifact['workflow_run']['head_sha'] == SOURCE
assert artifact['digest'] == 'sha256:' + SHA256
archive = out.parent / 'approved-cms-worker.zip'
archive.write_bytes(github('/actions/artifacts/' + str(ARTIFACT) + '/zip'))
assert hashlib.sha256(archive.read_bytes()).hexdigest() == SHA256
build = root / 'cms/dist-cloudflare'
assert not build.exists(), 'Refuse pre-existing build output'
files = []
with zipfile.ZipFile(archive) as zipped:
    for item in zipped.infolist():
        path = PurePosixPath(item.filename)
        assert not path.is_absolute() and '..' not in path.parts and '\\' not in item.filename
        assert not stat.S_ISLNK(item.external_attr >> 16), 'Symlink rejected'
        if item.is_dir():
            continue
        target = build.joinpath(*path.parts)
        assert not target.exists(), 'Duplicate artifact member'
        target.parent.mkdir(parents=True, exist_ok=True)
        data = zipped.read(item)
        target.write_bytes(data)
        files.append({'path': target.relative_to(root).as_posix(), 'sha256': hashlib.sha256(data).hexdigest()})
assert files and (build / 'server/wrangler.json').is_file()
receipt = {'source': SOURCE, 'run': RUN, 'artifactId': ARTIFACT, 'sha256': SHA256,
    'expectedVersion': VERSION, 'archive': str(archive), 'files': files,
    'authorization': 'User approved one pinned CMS update and built-in core/collection initialization only; no editorial import/admin/PAT/resource creation.'}
(out / 'artifact-admission.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'status': 'PASS', 'source': SOURCE, 'run': RUN, 'sha256': SHA256, 'files': len(files), 'rebuilds': 0}))
