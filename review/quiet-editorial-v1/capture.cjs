// Local-only review against actual published content; no application runtime changes.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/private/tmp/gaga-reference-application/node_modules/playwright');
const base = process.env.REVIEW_BASE || 'https://consumer-blog-signature.ratriatra.workers.dev';
const out = process.env.REVIEW_OUTPUT || '/private/tmp/gaga-quiet-editorial-evidence';
const here = __dirname;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--no-sandbox']});
  const results = [];
  for (const variant of ['quiet','refined']) for (const [width,height] of [[320,700],[390,844],[768,1024],[1440,900]]) for (const route of ['home','topics']) {
    const context = await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const page = await context.newPage(); const errors=[]; const mutations=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('request', r=>{ if (!['GET','HEAD','OPTIONS'].includes(r.method())) mutations.push(r.method()+' '+r.url()); });
    const response = await page.goto(base+(route==='topics'?'/topics':'/'),{waitUntil:'networkidle'});
    const selector = route==='home' ? '.pakrpp-publication-row__title' : '.gaga-topic-index a';
    await page.locator(selector).first().waitFor();
    const before=await page.locator(selector).evaluateAll(es=>es.map(e=>({text:e.textContent.trim(),href:e.getAttribute('href')})));
    await page.evaluate(v=>{document.body.classList.add('gaga-review-'+v);const first=document.querySelector('#stage-01 .pakrpp-section--latest');if(first){const el=document.createElement('div');el.className='gaga-review-intro';const label=document.createElement('div');label.className='gaga-review-intro__label';label.textContent=first.getAttribute('aria-label');const title=document.createElement('div');title.className='gaga-review-intro__title';title.textContent=document.querySelector('#pakrpp-root-title')?.textContent?.trim()||'';el.append(label,title);first.prepend(el);}},variant);
    await page.addStyleTag({content:fs.readFileSync(path.join(here,variant+'.css'),'utf8')});
    await page.screenshot({path:path.join(out,`${variant}-${route}-${width}.png`),fullPage:false});
    const after=await page.locator(selector).evaluateAll(es=>es.map(e=>({text:e.textContent.trim(),href:e.getAttribute('href')})));
    const layout=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
    const first=page.locator(selector).first(); await first.focus(); const focus=await first.evaluate(e=>document.activeElement===e);
    results.push({variant,route,width,height,status:response.status(),sameLinks:JSON.stringify(before)===JSON.stringify(after),count:after.length,layout,focus,errors,mutations});
    await context.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  await browser.close();
  if(results.some(r=>r.status!==200 || !r.sameLinks || r.layout.scrollWidth>r.layout.viewport || !r.focus || r.errors.length || r.mutations.length)) process.exitCode=1;
  console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
