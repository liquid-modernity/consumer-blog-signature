import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const directory = '.gaga/contextual-ux', article = '/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity';
mkdirSync(directory, { recursive: true });
const save = (page: Page) => page.locator('[data-gaga-action-runtime] [data-gaga-action="save-reading"]');
const opener = (page: Page) => page.locator('[data-gaga-action-island-toggle]');
async function ready(page: Page, route: string) { await page.goto(route); await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime', 'ready'); await page.evaluate(() => document.fonts.ready); }
async function actions(page: Page) { if (!await save(page).isVisible()) await opener(page).click(); await expect(save(page)).toBeVisible(); }
async function settings(page: Page) {
  if (!await page.locator('[data-gaga-notch-more]').isVisible()) await opener(page).click();
  if (!await page.locator('[data-gaga-notch-system]').isVisible()) await page.locator('[data-gaga-notch-more]').click();
  await page.locator('[data-gaga-notch-system] [data-gaga-action="toggle-reader-preferences"]').click();
  await expect(page.locator('[data-gaga-reader-panel]')).toHaveAttribute('data-gaga-state', 'open');
}
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().endTime !== Infinity).length)).toBe(0);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().endTime !== Infinity).length)).toBe(0);
}
async function geometry(page: Page, panel?: string) {
  const g = await page.evaluate(selector => {
    const node = selector ? document.querySelector<HTMLElement>(selector) : null;
    const box = node?.getBoundingClientRect();
    return { offenders: Array.from(document.querySelectorAll<HTMLElement>('body *')).filter(el => { const r=el.getBoundingClientRect(); return r.width>0 && (r.right>innerWidth+1 || r.left < -1); }).slice(0,40).map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,class:el.className,left:r.left,right:r.right,width:r.width,client:el.clientWidth,scroll:el.scrollWidth,position:s.position,boxSizing:s.boxSizing,padding:s.padding,whiteSpace:s.whiteSpace,minWidth:s.minWidth,maxWidth:s.maxWidth,text:el.textContent?.trim().slice(0,90)};}), width: innerWidth, height: innerHeight, mainOverflow: (() => { const m=document.querySelector('[data-gaga-main-region]'); return m ? m.scrollWidth-m.clientWidth : 0; })(), document: document.documentElement.scrollWidth, main: document.querySelector('[data-gaga-main-region]')?.getBoundingClientRect().width, panel: box ? { left: box.left, right: box.right, top: box.top, bottom: box.bottom } : null };
  }, panel);
  writeFileSync(directory+'/geometry-'+g.width+'.json',JSON.stringify(g,null,2));
  expect(g.document).toBeLessThanOrEqual(g.width + 1);
  expect(g.mainOverflow).toBeLessThanOrEqual(1);
  if (g.panel) { expect(g.panel.left).toBeGreaterThanOrEqual(-1); expect(g.panel.right).toBeLessThanOrEqual(g.width + 1); expect(g.panel.top).toBeGreaterThanOrEqual(-1); expect(g.panel.bottom).toBeLessThanOrEqual(g.height + 1); }
  return g;
}

async function contrast(page: Page, selector: string) {
  const values = await page.locator(selector).evaluateAll(nodes => {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d')!;
    function rgba(color:string) {ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data);}
    function luminance(c:number[]) {const v=c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];}
    return nodes.filter(n=>n.getClientRects().length&&!(n as HTMLButtonElement).disabled).slice(0,8).map(node=>{
      const chain:Element[]=[];for(let el:Element|null=node;el;el=el.parentElement)chain.unshift(el);
      let bg=[255,255,255];for(const el of chain){const c=rgba(getComputedStyle(el).backgroundColor),a=c[3]/255;bg=bg.map((b,i)=>c[i]*a+b*(1-a));}
      const fg=rgba(getComputedStyle(node).color),a=fg[3]/255,color=bg.map((b,i)=>fg[i]*a+b*(1-a));const x=luminance(color),y=luminance(bg);return {text:node.textContent?.trim(),ratio:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
    });
  });
  expect(values.length).toBeGreaterThan(0);for(const value of values)expect(value.ratio,value.text).toBeGreaterThanOrEqual(4.5);
  return values;
}

test('one Engine Save state: Notch, reload, root, library, unsave and denied storage', async ({ page }, info) => {
  await ready(page, article); await actions(page); await save(page).click();
  await expect(save(page)).toHaveAttribute('aria-pressed', 'true');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('gaga:saved:v1') ?? '[]')); expect(stored).toHaveLength(1);
  expect(await page.evaluate(() => localStorage.getItem('gaga:saved-items:v1'))).toBeNull();
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready'); await actions(page); await expect(save(page)).toHaveAttribute('aria-pressed','true');
  await ready(page, '/'); await expect(page.locator('[data-pakrpp-saved-root-list] a')).toHaveAttribute('href', article);
  await page.reload(); await expect(page.locator('[data-pakrpp-saved-root-list] a')).toHaveCount(1);
  await ready(page, '/saved'); const item=page.locator('[data-gaga-saved-bookmarks-list] .gaga-saved-item').filter({has:page.locator('a[href="'+article+'"]')}); await expect(item).toHaveCount(1);
  await item.locator('[data-gaga-saved-remove]').click(); await expect(item).toHaveCount(0);
  await ready(page, '/'); await expect(page.locator('[data-pakrpp-saved-root-list] a')).toHaveCount(0); await expect(page.locator('[data-pakrpp-saved-empty]')).toBeVisible();
  await ready(page, article); await actions(page); await expect(save(page)).toHaveAttribute('aria-pressed','false'); await save(page).click(); await save(page).click(); await expect(save(page)).toHaveAttribute('aria-pressed','false');
  await page.addInitScript(() => { const set=Storage.prototype.setItem; Storage.prototype.setItem=function(key,value){if(key==='gaga:saved:v1')throw new DOMException('Denied test storage','SecurityError'); return set.call(this,key,value);}; });
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready'); await actions(page); await save(page).click(); await expect(save(page)).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('body')).toContainText('Penyimpanan tidak tersedia');
  writeFileSync(directory+'/'+info.project.name+'-save.json',JSON.stringify({status:'PASS',singleStorage:'gaga:saved:v1',notch:true,root:true,library:true,reload:true,unsave:true,deniedStorage:true}));
});

test('Notch hierarchy, keyboard/touch, presets, nested preferences and persistence', async ({ page }, info) => {
  await ready(page,article); const island=page.locator('[data-gaga-action-runtime]');
  await expect(island).toHaveAttribute('data-gaga-level','0');
  await opener(page).focus(); await page.keyboard.press('Enter'); await expect(island).toHaveAttribute('data-gaga-level','1');
  await page.locator('[data-gaga-notch-more]').focus(); await page.keyboard.press('Enter'); await expect(island).toHaveAttribute('data-gaga-level','2');
  await settings(page); const panel=page.locator('[data-gaga-reader-panel]'); await expect(panel).toHaveAttribute('aria-hidden','false');
  await expect.poll(() => panel.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await panel.locator('[data-gaga-reader-pref="theme"][data-gaga-reader-value="paper"]').click();
  await panel.locator('[data-gaga-reader-pref="font"]').last().click();
  await panel.locator('[data-gaga-reader-pref="fontFamily"]').last().click();
  await panel.locator('[data-gaga-reader-pref="identity"][data-gaga-reader-value="editorial"]').click();
  await panel.locator('[data-gaga-language-option][value="en"]').check();
  const state=await page.evaluate(()=>({theme:localStorage.getItem('gaga:theme:v2'),reader:localStorage.getItem('gaga:reader:v2'),font:document.body.dataset.gagaReaderFont,language:localStorage.getItem('gaga:language:v1')}));
  await page.keyboard.press('Escape'); await expect(panel).toHaveAttribute('data-gaga-state','closed');
  await expect(page.locator('[data-gaga-notch-system] [data-gaga-action="toggle-reader-preferences"]')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(island).toHaveAttribute('data-gaga-level','1'); await expect(page.locator('[data-gaga-notch-more]')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(island).toHaveAttribute('data-gaga-level','0'); await expect(opener(page)).toBeFocused();
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready'); expect(await page.evaluate(()=>localStorage.getItem('gaga:reader:v2'))).toBe(state.reader); expect(await page.evaluate(()=>localStorage.getItem('gaga:theme:v2'))).toBe(state.theme); expect(await page.evaluate(()=>localStorage.getItem('gaga:language:v1'))).toBe(state.language);
  const container=page.locator('[data-gaga-action-runtime-container]');
  for(const preset of [{placement:'top',shape:'notch'},{placement:'top',shape:'island'},{placement:'bottom',shape:'pill'},{placement:'left',shape:'island'},{placement:'right',shape:'pill'}]){
    await container.evaluate((el,p)=>{(el as HTMLElement).dataset.gagaNotchConfig=JSON.stringify(p);window.dispatchEvent(new Event('resize'));},preset);
    await settle(page); await geometry(page,'[data-gaga-action-runtime]');
    await opener(page).click(); await settle(page); await geometry(page,'[data-gaga-action-runtime]');
    await page.keyboard.press('Escape');
    const placement=await container.getAttribute('data-gaga-notch-placement'); expect(placement).toBe(Number(info.project.name)<1280&&['left','right'].includes(preset.placement)?'top':preset.placement);
  }
  if(Number(info.project.name)<1440){await opener(page).tap();await expect(island).toHaveAttribute('data-gaga-level','1');await opener(page).tap();await expect(island).toHaveAttribute('data-gaga-level','0');}
  await page.emulateMedia({reducedMotion:'reduce'}); await opener(page).click(); await settle(page); await geometry(page,'[data-gaga-action-runtime]');
});

test('unique ordered publications, anchored previews, active metadata, rails, pager and outline', async ({ page }, info) => {
  await ready(page,'/'); const links=page.locator('.pakrpp-publication-list .pakrpp-publication-row__title');
  const hrefs=await links.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  const exportData=JSON.parse(readFileSync('content/emdash/published.json','utf8')); const posts=exportData.documents.filter((d:any)=>d.pin.collection==='posts');
  expect(hrefs).toHaveLength(Math.min(20,posts.length)); expect(new Set(hrefs).size).toBe(hrefs.length);
  await ready(page,article); const table=page.locator('[data-gaga-page-metadata-table]'),title=await page.locator('[data-gaga-article-header] h1').innerText();
  const active=await page.locator('[data-gaga-app-frame]').getAttribute('data-gaga-page-id'),metadata=await table.innerText();
  expect(await table.locator('[data-gaga-info-block]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-gaga-info-block')))).not.toContain('contextMeta');
  await expect(page.locator('[data-gaga-article-header] [data-gaga-action]')).toHaveCount(0);
  await expect(page.locator('[data-gaga-hover-preview-card]')).toHaveAttribute('data-gaga-preview-ready','true');
  const preview=page.locator('.gaga-article-pager a').first(); await preview.scrollIntoViewIfNeeded(); await preview.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  if(Number(info.project.name)===1440)await preview.hover();
  const card=page.locator('[data-gaga-hover-preview-card]'); await expect(card).toBeVisible(); await geometry(page,'[data-gaga-hover-preview-card]');
  await expect(preview).toHaveAttribute('aria-describedby',/gaga-link-preview/);
  expect(await table.innerText()).toBe(metadata); expect(await page.locator('[data-gaga-app-frame]').getAttribute('data-gaga-page-id')).toBe(active); await expect(page.locator('[data-gaga-island-focus-title]')).toHaveText(title);
  await page.screenshot({path:directory+'/'+info.project.name+'-preview.png'});
  if(Number(info.project.name)===1440){await card.hover();await expect(card).toBeVisible();}
  await page.keyboard.press('Escape'); await expect(card).toBeHidden();
  const current=hrefs.indexOf(article); const previous=current+1<hrefs.length?hrefs[current+1]:null,next=current>0?hrefs[current-1]:null;
  if(previous)await expect(page.locator('.gaga-article-pager__col').first().locator('a')).toHaveAttribute('href',previous!);
  if(next)await expect(page.locator('.gaga-article-pager__col').last().locator('a')).toHaveAttribute('href',next!);
  const alignment=await page.evaluate(()=>{const a=document.querySelector('[data-gaga-article-body]')!.getBoundingClientRect(),p=document.querySelector('.gaga-article-pager')!.getBoundingClientRect();return {article:{left:a.left,right:a.right},pager:{left:p.left,right:p.right}};});expect(Math.abs(alignment.article.left-alignment.pager.left)).toBeLessThanOrEqual(4);expect(Math.abs(alignment.article.right-alignment.pager.right)).toBeLessThanOrEqual(4);
  const outline=page.locator('[data-gaga-outline-opener]'); if(await outline.count()){
    await expect(outline).not.toContainText('Gaga Dynamic Outline Peek'); await outline.click(); await expect(page.locator('[data-gaga-outline-peek]')).toHaveAttribute('data-gaga-state','open'); await page.keyboard.press('Escape');
    await expect(page.locator('[data-gaga-outline-peek]')).toHaveAttribute('data-gaga-state','closed');
    await page.locator('[data-gaga-article-scroll]').evaluate(el=>el.scrollTop=el.scrollHeight); await expect(page.locator('[data-gaga-outline-progress]')).toHaveText('100%');
  }
  for(const route of ['/','/search','/saved',article]){await ready(page,route);await expect(page.locator('[data-gaga-left-rail], [data-gaga-right-rail]')).toHaveCount(0);await geometry(page);}
  writeFileSync(directory+'/'+info.project.name+'-mapping.json',JSON.stringify({status:'PASS',rootHrefs:hrefs,activePage:active,unchangedMetadata:true,alignment,articleCount:posts.length}));
});

test('settled five-width light/dark route and panel visual evidence', async ({ page }, info) => {
  const routes=['/',article,'/topics/teknologi','/sections','/saved','/knowledge/index'];
  for(const theme of ['paper','dark']){
    await ready(page,article); await settings(page); await page.locator('[data-gaga-reader-panel] [data-gaga-reader-pref="theme"][data-gaga-reader-value="'+theme+'"]').click();
    const contrasts=await contrast(page,'[data-gaga-reader-panel] button');writeFileSync(directory+'/'+info.project.name+'-'+theme+'-contrast.json',JSON.stringify({scope:'Representative automated control contrast only; not a full audit',measurements:contrasts}));
    await page.screenshot({path:directory+'/'+info.project.name+'-'+theme+'-preferences.png'});
    await page.locator('[data-gaga-reader-close]').click(); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    for(const [index,route] of routes.entries()){
      await ready(page,route);await settle(page);const g=await geometry(page,'[data-gaga-action-runtime]');
      await page.screenshot({path:directory+'/'+info.project.name+'-'+theme+'-'+index+'.png'});
      expect(await page.locator('main,[role="main"]').count()).toBe(1);
      if(await page.locator('[data-gaga-left-rail]').count())expect(await page.locator('[data-gaga-left-rail] a').count()).toBeGreaterThan(0);
      if(await page.locator('[data-gaga-right-rail]').count())expect(await page.locator('[data-gaga-right-rail] .gaga-right-rail__body a').count()).toBeGreaterThan(0);
      writeFileSync(directory+'/'+info.project.name+'-'+theme+'-'+index+'.json',JSON.stringify({route,theme,geometry:g}));
    }
  }
  await ready(page,article);await page.emulateMedia({reducedMotion:'reduce'});await settings(page);await page.locator('[data-gaga-reader-panel] [data-gaga-reader-pref="font"]').last().click();await page.locator('[data-gaga-reader-close]').click();await page.keyboard.press('Escape');await page.keyboard.press('Escape');await settle(page);await geometry(page);await page.screenshot({path:directory+'/'+info.project.name+'-resized-reduced-motion.png'});
});
