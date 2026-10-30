from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from collections import Counter
import json

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.ids=Counter(); self.main=0; self.h1=0; self.links=[]; self.profile=None; self.body_depth=0; self.depth=0; self.headings=[]
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag not in ['meta','link','input','img','br','hr','source','wbr','area','embed','param','track','col','base']:self.depth+=1
        if 'data-gaga-document-body' in a:self.body_depth=self.depth
        if a.get('id'):self.ids[a['id']]+=1
        if tag=='main' or a.get('role')=='main':self.main+=1
        if tag=='h1':self.h1+=1
        if 'data-gaga-app-frame' in a:self.profile=a.get('data-gaga-experience')
        if tag=='a' and a.get('href'):self.links.append(a['href'])
        if self.body_depth and tag in ['h2','h3']:self.headings.append(a.get('id'))
    def handle_endtag(self, tag):
        if self.body_depth==self.depth:self.body_depth=0
        self.depth-=1

def local_file(path):
    p=Path('dist')/path.lstrip('/')
    return p if p.is_file() else p/'index.html'

violations=[]
def check(condition, *context):
    if not condition:violations.append(context)

profiles={'knowledge':'knowledge','about':'information','legal':'legal','system':'system','sections':'section'}
results=[]
for family,profile in profiles.items():
    for file in sorted((Path('dist')/family).rglob('*.html')):
        page=Page(file);route='/'+str(file.parent.relative_to('dist'))
        check(page.profile==profile,route,'profile',page.profile)
        check(page.main==page.h1==1,route,'main/H1',page.main,page.h1)
        check(page.ids['gaga-main']==1 and '#gaga-main' in page.links,route,'skip link')
        check(all(page.headings),route,'heading without stable ID')
        for identity in page.headings:check(page.ids[identity]==1,route,'heading identity',identity)
        check(not [k for k,v in page.ids.items() if v>1],route,'duplicate IDs')
        for href in page.links:
            u=urlsplit(href)
            if u.scheme or u.netloc or not href.startswith(('/','#')):continue
            target=local_file(u.path) if u.path else file
            check(target.exists(),route,href,'unbuilt public link')
            if not target.exists():continue
            if u.fragment:
                parsed=page if target==file else Page(target)
                check(parsed.ids[unquote(u.fragment)]==1,route,href,'missing/ambiguous fragment')
        results.append({'route':route,'profile':profile,'headings':page.headings,'main':page.main,'h1':page.h1})
assert all(any(r['profile']==p for r in results) for p in profiles.values())
index=json.loads(Path('dist/search-index.json').read_text())
for kind in ['knowledge','information','legal','system']:assert any(r['kind']==kind for r in index['records']),kind
assert len(index['items'])==7
for file in (Path('dist')/'system').rglob('*.html'):
    text=file.read_text()
    for secret in ['CLOUDFLARE_API_TOKEN','EMDASH_ENCRYPTION_KEY','b26b0e8a-e193-4a7d-8e1d-c553de22fd27','a0ad6f282a314e17bbdfec6c4e0c9fa2']:assert secret not in text,file
Path('.gaga').mkdir(exist_ok=True)
Path('.gaga/documentation-html.json').write_text(json.dumps({'status':'BLOCKED' if violations else 'PASS','violations':violations,'routes':results,'articleItems':7,'documentRecords':sum(r['kind'] in ['knowledge','information','legal','system'] for r in index['records'])},indent=2)+'\n')
assert not violations, violations
print('Document HTML/links/anchors/profile/discovery proof PASS:',len(results),'routes')
