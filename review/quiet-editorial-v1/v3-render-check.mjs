import { chromium } from 'playwright';
import { renderPortableText } from '../../editorial/portable-text.mjs';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import {writeFile} from 'node:fs/promises';
const blocks=[{_type:'image',_key:'i',url:'/favicon.svg',alt:'Editorial image',caption:'Editorial credit',width:100,height:100},{_type:'video',_key:'v',url:'/fixture.mp4',title:'Editorial video',caption:'Video credit'}];
const portable=renderPortableText(blocks);
const markdown=(await (await createMarkdownProcessor()).render('![Markdown image](/favicon.svg)')).code;
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});const out=[];
try { for(const width of [320,390,768,1024,1440,1920]){
 const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
 const response=await p.goto('http://127.0.0.1:3020/publications/designing-context-aware-reading-surface',{waitUntil:'domcontentloaded'});
 await p.locator('.gaga-article-body').waitFor();
 await p.locator('.gaga-article-body').evaluate((el,html)=>el.insertAdjacentHTML('beforeend',html),portable+markdown+'<figure data-presentation="inline"><img src="/favicon.svg" alt="Inline diagram"></figure>');
 let m=await p.locator('.gaga-article-body').evaluate(el=>{const figs=[...el.querySelectorAll(':scope > figure')].slice(-3);const markdown=[...el.querySelectorAll(':scope > p')].find(e=>e.querySelector('img[alt="Markdown image"]'));return{viewport:document.documentElement.clientWidth,documentWidth:document.documentElement.scrollWidth,figures:figs.map(e=>({width:e.getBoundingClientRect().width,caption:!!e.querySelector('figcaption'),inline:e.dataset.presentation==='inline',image:e.querySelector('img')?.getBoundingClientRect().width,video:e.querySelector('video')?.getBoundingClientRect().width})),markdown:markdown?.getBoundingClientRect().width}});
 await p.locator('.gaga-article-body > figure').last().scrollIntoViewIfNeeded(); await p.screenshot({path:`/private/tmp/gaga-quiet-v3-evidence/media-${width}.png`}); out.push({width,status:response.status(),...m});await p.close();
 }} finally {await b.close();await writeFile('/private/tmp/gaga-quiet-v3-evidence/render-check.json',JSON.stringify(out,null,2));}
if(out.some(x=>x.status!==200||x.documentWidth>x.viewport||x.figures.length!==3||x.figures.slice(0,2).some(y=>Math.abs(y.width-x.viewport)>1)||Math.abs(x.markdown-x.viewport)>1||x.figures[2].width>x.viewport))process.exitCode=1;
