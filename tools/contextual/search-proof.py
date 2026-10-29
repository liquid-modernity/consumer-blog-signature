"""Bound the emitted Search change to admitted editorial dates and their ordering."""
from copy import deepcopy
from hashlib import sha256
from pathlib import Path
import json
import os
import sys


def verify(before, after, documents):
    assert before.keys() == after.keys()
    for key in before.keys() - {'items', 'records'}:
        assert before[key] == after[key], ('unrelated Search field', key)
    posts = {d['applicationId']: d['item']['data'] for d in documents if d['pin']['collection'] == 'posts'}
    expected = {}
    for identity, data in posts.items():
        editorial, metadata = data.get('editorial', {}), data.get('metadata', {})
        published = editorial.get('publicationDate') or metadata.get('publishedAt')
        updated = editorial.get('updatedDate') or metadata.get('updatedAt') or published
        expected[identity] = (published[:10], updated[:10])
    for key, date_fields in [('items', ('date', 'updated')), ('records', ('publishedAt', 'updatedAt'))]:
        strip = lambda item: {k: v for k, v in item.items() if k not in date_fields}
        assert sorted(map(strip, before[key]), key=lambda x: x['href']) == sorted(map(strip, after[key]), key=lambda x: x['href']), ('non-date identity or content drift', key)
    for record in after['records']:
        if record['id'] in expected:
            assert (record.get('publishedAt'), record.get('updatedAt')) == expected[record['id']], ('source date mismatch', record['id'])
        else:
            assert record == next(r for r in before['records'] if r['id'] == record['id']), ('non-publication record drift', record['id'])
    records = {r['href']: r for r in after['records'] if r['id'] in expected}
    for item in after['items']:
        assert (item.get('date'), item.get('updated')) == expected[records[item['href']]['id']]
    dates = [item['date'] for item in after['items']]
    assert dates == sorted(dates, reverse=True), 'chronological ordering'


if __name__ == '__main__':
    before_path, after_path = map(Path, sys.argv[1:])
    before, after = json.loads(before_path.read_text()), json.loads(after_path.read_text())
    documents = json.loads(Path('content/emdash/published.json').read_text())['documents']
    verify(before, after, documents)
    for defect in ['content', 'date', 'ordering']:
        changed = deepcopy(after)
        if defect == 'content': changed['items'][0]['title'] += ' unapproved'
        elif defect == 'date': changed['items'][0]['date'] = '1900-01-01'
        else: changed['items'].reverse()
        try: verify(before, changed, documents)
        except AssertionError: pass
        else: raise AssertionError(('unapproved change accepted', defect))
    result = {'status': 'PASS', 'historicalSha256': sha256(before_path.read_bytes()).hexdigest(), 'candidateSha256': sha256(after_path.read_bytes()).hexdigest(), 'allowedChange': 'Source-backed publication dates and chronological ordering only', 'negativeCases': ['content drift rejected', 'incorrect date rejected', 'incorrect ordering rejected']}
    Path(os.environ['GAGA_EVIDENCE_DIRECTORY'], 'search-equivalence.json').write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps(result))
