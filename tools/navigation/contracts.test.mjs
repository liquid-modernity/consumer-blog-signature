import {readPublicModule} from '../reference-extraction-equivalence.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveLocalContext, hasLocalNavigation, flattenNavigation, headingSequence } from '@gaga/arsenal/site';
import { localContext } from '../../src/lib/local-navigation.ts';
import { presence } from '../../src/lib/presence.ts';
const item=(id,href='/family/'+id)=>({id,label:id,href});
test('local context separates family, outline, explicit sequence and exact/parent position',()=>{
 const items=[item('root','/family'),item('one'),{...item('two'),children:[item('child','/family/two/child')]}];
 const c=resolveLocalContext({path:'/family/two/child/',title:'Child',family:'fixture',items,documentOutline:[{id:'heading'}]});
 assert.equal(c.position.currentId,'child');assert.equal(c.position.exact,true);assert.equal(c.documentOutline[0].id,'heading');assert.deepEqual(c.sequence,{previous:undefined,next:undefined});assert.equal(flattenNavigation(c.localNavigation).filter(i=>i.relation==='current').length,1);
 const nested=resolveLocalContext({path:'/family/two/unknown',title:'Unknown',items});assert.equal(nested.position.currentId,'two');assert.equal(nested.position.exact,false);
});
test('empty and self-only context are dormant; no arbitrary previous/next from menu order',()=>{
 assert.equal(hasLocalNavigation(resolveLocalContext({path:'/family',title:'Root'})),false);
 assert.equal(hasLocalNavigation(resolveLocalContext({path:'/family',title:'Root',items:[item('root','/family')]})),false);
 const items=[item('one'),item('two'),item('three')];assert.deepEqual(resolveLocalContext({path:'/family/two',title:'Two',items}).sequence,{previous:undefined,next:undefined});
 const c=resolveLocalContext({path:'/family/two',title:'Two',items,ordered:items});assert.equal(c.sequence.previous.href,'/family/one');assert.equal(c.sequence.next.href,'/family/three');
 assert.deepEqual(headingSequence(items,'missing'),{previous:undefined,next:undefined});assert.equal(headingSequence(items,'one').next.href,'/family/two');assert.equal(headingSequence(items,'three').next,undefined);
});
test('invalid or duplicate identity/destination and unregistered sequences fail closed',()=>{
 for(const items of [[item('a'),item('a')],[item('a'),item('b','/family/a')],[item('x','//foreign.test')],[item('x','javascript:alert(1)')],[item('x','/safe\\evil')]]) assert.throws(()=>resolveLocalContext({path:'/family',title:'Root',items}));
 assert.throws(()=>resolveLocalContext({path:'/family',title:'Root',items:[item('a')],ordered:[item('bad')]}));
});
test('alternate provider/config navigation changes labels, membership and paths without renderer edits',()=>{
 const first=resolveLocalContext({path:'/family/a',title:'A',items:[item('a'),item('b')]});
 const alternate=resolveLocalContext({path:'/other',title:'Alternate',items:[{id:'b',label:'Different',labelEn:'Other',href:'/other'}]});
 assert.equal(first.localNavigation[0].href,'/family/a');assert.equal(alternate.localNavigation[0].label,'Different');assert.equal(alternate.localNavigation[0].labelEn,'Other');assert.equal(alternate.localNavigation.length,1);assert.equal(alternate.position.currentId,'b');
});
test('all seven families resolve canonical registry-driven root and child context',async()=>{
 const topics=[{slug:'teknologi',count:1}],sections=[{slug:'editorial',name:'Editorial',href:'/sections/editorial'}];
 for(const [root,child,family] of [['/knowledge','/knowledge/graph','knowledge'],['/legal','/legal/privacy','legal'],['/system','/system/rss','system'],['/topics','/topics/teknologi','topics'],['/sections','/sections/editorial','sections'],['/about','/about/author','about']]){
  for(const path of [root,child]){const c=await localContext(path,'Title',topics,sections);assert.equal(c.family,family);assert.ok(hasLocalNavigation(c));assert.equal(c.position.exact,true);}
 }
 const archiveData=[{year:'2027',href:'/archive/2027',count:1,months:[{month:'01',label:'January 2027',href:'/archive/2027/01',count:1}]},{year:'2024',href:'/archive/2024',count:0,months:[]}];
 const archive=localContext('/archive','Archive',[],[],archiveData);assert.equal(archive.family,'archive');assert.ok(hasLocalNavigation(archive));assert.equal(archive.localNavigation[1].href,'/archive/2027');assert.ok(!archive.localNavigation.some(y=>y.id==='2024'));
 const month=localContext('/archive/2027/01','January',[],[],archiveData);assert.equal(month.position.currentId,'2027-01');assert.equal(month.position.exact,true);
 const tag=localContext('/knowledge/tags/real','Real',[],[],[],[{slug:'real',tag:'Real',count:1},{slug:'empty',tag:'Empty',count:0}]);assert.equal(tag.position.currentId,'tag-real');assert.ok(!flattenNavigation(tag.localNavigation).some(i=>i.id==='tag-empty'));
 assert.deepEqual((await localContext('/topics','Topics',[],[])).localNavigation.map(i=>i.href),['/topics']);assert.deepEqual((await localContext('/sections','Sections',[],[])).localNavigation.map(i=>i.href),['/sections']);
 assert.deepEqual((await localContext('/about','About',[],[])).localNavigation.map(i=>i.href),presence.navigation().map(i=>i.href));
});
test('renderer/controller remain provider neutral and retain Engine availability/focus boundary',()=>{assert.doesNotMatch(readPublicModule('@gaga/arsenal/site'),/from ['\"][^'\"]*(?:emdash|cms\/)/);
 for(const p of ['src/lib/local-navigation.ts','src/components/frame/ArticleOutlinePeek.astro','src/scripts/systems/outline-peek.ts'])assert.doesNotMatch(readFileSync(p,'utf8'),/from ['"][^'"]*(?:emdash|cms\/)/);
 assert.match(readFileSync('src/scripts/systems/outline-peek.ts','utf8'),/createOutlinePeekCapability/);
 assert.match(readFileSync('src/scripts/systems/toc-spy.ts','utf8'),/data-gaga-outline-toc-eligible/);
});
