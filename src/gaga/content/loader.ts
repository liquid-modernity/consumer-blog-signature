import {glob} from 'astro/loaders';
import type {Loader} from 'astro/loaders';
import {verifySnapshot,cmsFrontmatter} from '../../../tools/gaga/snapshot.mjs';
import migration from '../../../cms/migration/source-map.json';
import {renderPortableText,plainText,editorialBody} from '../../../editorial/portable-text.mjs';
export function gagaContentLoader():Loader {
 const delegate=glob({pattern:['**/*.{md,mdx}',...migration.map(d=>'!'+d.originalPath.replace('src/content/docs/',''))],base:'./src/content/docs'});
 return {...delegate,name:'blog-emdash-content',async load(context){
  const {snapshot}=await verifySnapshot();
  await delegate.load(context);
  for(const d of snapshot.documents){
   const id=d.path.replace('src/content/docs/','').replace(/\.md$/,''),body=editorialBody(d.item.data);
   const data=await context.parseData({id,data:cmsFrontmatter(d),filePath:d.path});
   const rendered=Array.isArray(body)?{html:renderPortableText(body,{mediaOrigin:snapshot.origin})}:await context.renderMarkdown(body,{fileURL:new URL(d.path,context.config.root)});
   context.store.set({id,data,body:Array.isArray(body)?plainText(body):body,rendered,filePath:d.path,digest:context.generateDigest(d)});
  }
 }};
}
