import {glob} from 'astro/loaders';
import type {Loader} from 'astro/loaders';
import {verifySnapshot} from '../../../tools/gaga/snapshot.mjs';
export function gagaContentLoader():Loader {
 const delegate=glob({pattern:'**/*.{md,mdx}',base:'./src/content/docs'});
 return {...delegate,name:'blog-admitted-content',async load(context){await verifySnapshot();await delegate.load(context);}};
}
