"""Offline regression tests for the pinned artifact downloader; no provider calls."""
import hashlib
import io
import json
import os
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch
import zipfile

class ArtifactTests(unittest.TestCase):
    def simulate(self, scenario):
        source = Path(__file__).with_name('repair-artifact.py').read_text()
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as archive:
            archive.writestr('../escape' if scenario == 'traversal' else 'server/wrangler.json', '{}')
        blob = buffer.getvalue()
        digest = hashlib.sha256(blob).hexdigest()
        source = source.replace('e063e7ff2dec9c8212ff883e1d1e164ce4df5ca8e4b8fab7fb1d48bb57c2b518', digest)
        run = {'head_sha': 'df3c022368726f07545f1736184ea77fe24ce5cf', 'conclusion': 'failure' if scenario == 'failed-run' else 'success'}
        artifact = {'name': 'cms-worker-candidate', 'expired': False, 'workflow_run': {'id': 0 if scenario == 'wrong-run' else 40165537376, 'head_sha': run['head_sha']}, 'digest': 'sha256:' + ('0'*64 if scenario == 'wrong-digest' else digest)}
        calls = []
        class Opener:
            def open(self, request, timeout):
                path = request.full_url
                calls.append(path)
                assert path.startswith('https://api.github.com/repos/liquid-modernity/consumer-blog-signature/')
                if path.endswith('/zip'):
                    return io.BytesIO(b'altered' if scenario == 'altered-zip' else blob)
                return io.BytesIO(json.dumps(run if '/runs/' in path else artifact).encode())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)/'project'
            script = root/'tools/cms/repair-artifact.py'
            script.parent.mkdir(parents=True)
            script.write_text(source)
            out = Path(directory)/'evidence'
            with patch.dict(os.environ, {'GAGA_EVIDENCE_DIRECTORY': str(out), 'GH_TOKEN': 'fake-read-token'}, clear=True), patch('urllib.request.build_opener', return_value=Opener()):
                if scenario == 'ok':
                    runpy.run_path(str(script))
                    receipt = json.loads((out/'artifact-admission.json').read_text())
                    self.assertEqual(receipt['sha256'], digest)
                    self.assertEqual((root/'cms/dist-cloudflare/server/wrangler.json').read_text(), '{}')
                else:
                    with self.assertRaises(AssertionError):
                        runpy.run_path(str(script))
                    self.assertFalse((out/'artifact-admission.json').exists())
                self.assertFalse((root/'escape').exists())
                self.assertTrue(all('cloudflare' not in url for url in calls))
    def test_exact_artifact(self):
        self.simulate('ok')
    def test_rejections(self):
        for scenario in ['failed-run', 'wrong-run', 'wrong-digest', 'altered-zip', 'traversal']:
            with self.subTest(scenario=scenario):
                self.simulate(scenario)

if __name__ == '__main__':
    unittest.main()
