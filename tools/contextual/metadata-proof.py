"""Read-only proof of the emitted public projection against the admitted eight-record export."""
from pathlib import Path
from html.parser import HTMLParser
import json

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.fields = {}; self.rows = []; self.canonical = None; self.title = ''; self.depth = 0
        self.field = None; self.heading = None; self.hrefs = []; self.description = None
        self.times = {}; self.time = None
        self.topic = None; self.topic_label = ''; self.topic_heading = None; self.topic_links = []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = a.get('href')
        if tag == 'meta' and a.get('name') == 'description': self.description = a.get('content')
        if tag in ['meta','link','br','hr','img','input','source','wbr']: return
        self.depth += 1
        if tag == 'td' and a.get('data-gaga-info-field'):
            self.field = (self.depth, a['data-gaga-info-field']); self.fields[self.field[1]] = ''
        if a.get('data-gaga-info-block'): self.rows.append(a['data-gaga-info-block'])
        if tag == 'h1' and a.get('id') == '_top': self.heading = self.depth
        if a.get('data-gaga-topic-screen'): self.topic = {'slug':a['data-gaga-topic-screen'],'id':a['data-gaga-topic-id'],'count':int(a['data-gaga-topic-count'])}
        if tag == 'h2' and a.get('id') == 'topic-title': self.topic_heading = self.depth
        if tag == 'a' and 'gaga-mission-link' in a.get('class','').split(): self.topic_links.append(a.get('href'))
        if tag == 'a' and 'pakrpp-publication-row__title' in a.get('class','').split(): self.hrefs.append(a.get('href'))
        if tag == 'time' and self.field: self.times[self.field[1]] = a.get('datetime')
    def handle_endtag(self, tag):
        if tag in ['meta','link','br','hr','img','input','source','wbr']: return
        if self.field and self.field[0] == self.depth: self.field = None
        if self.heading == self.depth: self.heading = None
        if self.topic_heading == self.depth: self.topic_heading = None
        self.depth -= 1
    def handle_data(self, text):
        if self.field: self.fields[self.field[1]] += text
        if self.heading is not None: self.title += text
        if self.topic_heading is not None: self.topic_label += text

export = json.loads(Path('content/emdash/published.json').read_text())
origin = json.loads(Path('gaga.app.json').read_text())['host']['site']
posts = [d for d in export['documents'] if d['pin']['collection'] == 'posts']
labels = {'essay':'Esai','experiment':'Eksperimen','analysis':'Analisis','case-study':'Studi Kasus'}
records = []
for d in posts:
    item = d['item']; path = '/publications/' + item['slug']
    page = Page(Path('dist'+path+'/index.html').read_text())
    assert page.canonical.rstrip('/') == origin + path, ('canonical', path, page.canonical)
    assert page.title.strip() == item['data']['title'], ('title', path)
    metadata = item['data']['metadata']
    assert page.description == item['data'].get('summary'), ('summary',path)
    if metadata.get('topics'): assert page.fields.get('topic','').strip() == ' · '.join(metadata['topics']), ('published topic labels',path,page.fields.get('topic'))
    if metadata.get('tags'): assert page.fields.get('tags','').strip() == ' · '.join('#'+tag for tag in metadata['tags']), ('published tag labels',path)
    if metadata.get('type') in labels: assert page.fields.get('publicationType','').strip() == labels[metadata['type']], ('explicit published type',path,page.fields.get('publicationType'),metadata['type'])
    if metadata.get('readTime'): assert page.fields.get('readTime','').strip() == metadata['readTime'], ('readTime',path)
    if metadata.get('section'): assert page.fields.get('section','').strip() == metadata['section'], ('section',path)
    assert len(page.rows) == len(set(page.rows)), ('duplicate metadata row',path)
    assert 'contextMeta' not in page.fields and 'objectId' not in page.fields and 'knowledgeRelations' not in page.fields
    if metadata.get('publishedAt'): assert page.times.get('publishedDate','')[:10] == metadata['publishedAt'][:10], ('date',path)
    records.append({'path':path,'contentId':d['applicationId'],'publishedRevision':d['pin']['liveRevisionId'],'title':page.title.strip(),'canonical':page.canonical,'fields':{k:v.strip() for k,v in page.fields.items()},'times':page.times,'publishedSummary':item['data'].get('summary'),'headDescription':page.description})
root = Page(Path('dist/index.html').read_text()); assert len(root.hrefs) == min(20,len(posts)) and len(set(root.hrefs)) == len(root.hrefs)
by_path = {r['path']:r for r in records}
dates = [next(d['item']['data']['metadata'].get('publishedAt','') for d in posts if '/publications/'+d['item']['slug'] == href) for href in root.hrefs]
assert dates == sorted(dates,reverse=True), 'Published chronological ordering changed'
topics = []
for file in sorted(Path('dist/topics').glob('*/index.html')):
    page = Page(file.read_text())
    assert page.topic is not None, ('missing published topic projection', str(file))
    expected = ['/'+d['item']['slug'].strip('/') for d in posts if page.topic['id'] in d['item']['data'].get('metadata',{}).get('topicRefs',[])]
    assert page.topic_label.strip() == page.title.strip() and page.topic_label.strip() != 'Unknown Topic', ('topic identity',str(file))
    assert sorted(page.topic_links) == sorted(expected) and len(set(page.topic_links)) == len(expected), ('topic membership',str(file),page.topic_links,expected)
    assert page.topic['count'] == len(expected), ('topic count',str(file))
    topics.append({**page.topic,'title':page.topic_label.strip(),'links':page.topic_links})
assert len(topics) == 5, 'Existing topic route inventory changed'
result = {'status':'PASS','topics':topics,'recordCount':len(export['documents']),'articleCount':len(records),'records':records,'rootOrder':root.hrefs,'rootUnique':True,'ordering':'Published editorial date descending; no artificial repetition','schemaWrites':0,'contentWrites':0}
Path('.gaga/contextual-ux').mkdir(parents=True,exist_ok=True)
Path('.gaga/contextual-ux/metadata-proof.json').write_text(json.dumps(result,indent=2)+'\n')
print('Public metadata, canonical identity and root ordering: PASS',len(records),'articles')
