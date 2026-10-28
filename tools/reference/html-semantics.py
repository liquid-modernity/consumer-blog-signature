"""Inventory app-shell HTML; browser/receipt gates enforce these observations."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import json


class Shell(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids = Counter()
        self.targets = {}
        self.mains = []
        self.skips = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        identity = attrs.get('id')
        if identity:
            self.ids[identity] += 1
            self.targets[identity] = (tag, attrs)
        if tag == 'main' or attrs.get('role') == 'main':
            self.mains.append(identity)
        if tag == 'a' and 'gaga-skip-link' in attrs.get('class', '').split():
            self.skips.append(attrs.get('href', ''))

    def valid(self):
        if len(self.mains) != 1 or len(self.skips) != 1:
            return False
        href = self.skips[0]
        if not href.startswith('#') or self.ids[href[1:]] != 1:
            return False
        tag, attrs = self.targets[href[1:]]
        return (tag == 'main' or attrs.get('role') == 'main') and attrs.get('tabindex') == '-1'


assert Shell('<a class="gaga-skip-link" href="#m">Skip</a><main id="m" tabindex="-1"></main>').valid()
assert not Shell('<a class="gaga-skip-link" href="#m">Skip</a><div id="m" tabindex="-1"></div>').valid()
assert not Shell('<a class="gaga-skip-link" href="#m">Skip</a><main id="m" tabindex="-1"></main><main id="m"></main>').valid()
assert not Shell('<a class="gaga-skip-link" href="#missing">Skip</a><main id="m" tabindex="-1"></main>').valid()

routes, without_skip = [], []
for file in sorted(Path('dist').rglob('*.html')):
    rel = file.relative_to('dist')
    path = '/' + str(rel.parent if rel.name == 'index.html' else rel.with_suffix('')).replace('\\', '/')
    path = '/' if path == '/.' else path
    shell = Shell(file.read_text())
    if shell.skips:
        routes.append({'path': path, 'mainCount': len(shell.mains), 'skipLinks': shell.skips,
                       'targetCount': shell.ids[shell.skips[0][1:]], 'valid': shell.valid()})
    else:
        without_skip.append({'path': path, 'mainCount': len(shell.mains)})
assert routes, 'No app-shell routes inventoried'
result = {'status': 'PASS' if all(r['valid'] for r in routes) else 'BLOCKED',
          'routes': routes, 'withoutAppSkipLink': without_skip}
Path('.gaga/reference-quality').mkdir(parents=True, exist_ok=True)
Path('.gaga/reference-quality/html-semantics.json').write_text(json.dumps(result, indent=2) + '\n')
print('App-shell HTML semantics:', result['status'], 'routes:', len(routes))
