"""Validate generated orientation for every scoped route, including dynamic children."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json

class Context(HTMLParser):
    def __init__(self, file):
        super().__init__();self.depth=0;self.local=0;self.links=[];self.family=None
        self.feed(file.read_text())
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag not in ('meta','link','input','img','br','hr','source','wbr','area','embed','param','track','col','base'):self.depth+=1
        if 'data-gaga-outline-local' in a:self.family=a['data-gaga-outline-local']
        if 'data-gaga-local-navigation' in a:self.local=self.depth
        if self.local and tag=='a':self.links.append({'href':a.get('href'),'current':a.get('aria-current')})
    def handle_endtag(self, tag):
        if self.local==self.depth:self.local=0
        self.depth-=1

rows=[]
for family in ('knowledge','sections','legal','archive','system','topics','about'):
    files=sorted((Path('dist')/family).rglob('*.html'));assert files,family
    for file in files:
        path='/'+str(file.parent.relative_to('dist'));page=Context(file)
        assert page.family==family,(path,page.family)
        hrefs=[a['href'] for a in page.links];assert hrefs and len(hrefs)==len(set(hrefs)),path
        for href in hrefs:
            u=urlsplit(href);assert not u.scheme and not u.netloc and not u.fragment and not u.query,(path,href)
            assert (Path('dist')/unquote(u.path).strip('/')/'index.html').is_file(),(path,href)
        current=[a for a in page.links if a['current']];assert len(current)==1,(path,current)
        if path in hrefs:assert current==[{'href':path,'current':'page'}],(path,current)
        else:assert current[0]['current']=='location' and path.startswith(current[0]['href']+'/'),(path,current)
        rows.append({'path':path,'family':family,'navigation':page.links})
Path('.gaga/navigation-html.json').write_text(json.dumps({'status':'PASS','routes':rows,'families':7},indent=2)+'\n')
print('All seven local navigation families/children, canonical destinations and active states: PASS',len(rows))
