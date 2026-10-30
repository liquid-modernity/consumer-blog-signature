import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const cases=[['/knowledge/index','knowledge'],['/knowledge/graph','knowledge'],['/about','information'],['/legal/privacy','legal'],['/system/sitemap','system'],['/sections','section']] as const;
async function ready(page:Page,path:string){await page.goto(path);await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');}
async function notch(page:Page){const island=page.locator('[data-gaga-action-runtime]');if(await island.getAttribute('data-gaga-level')==='0')await page.locator('[data-gaga-action-island-toggle]').click();return island;}
test('all five experience families retain main, H1, skip target, page identity and bounded layout',async({page})=>{
 for(const [path,profile] of cases){
  await ready(page,path);await expect(page.locator('[data-gaga-app-frame]')).toHaveAttribute('data-gaga-experience',profile);await expect(page.locator('main')).toHaveCount(1);await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('a.gaga-skip-link')).toHaveAttribute('href','#gaga-main');await page.locator('a.gaga-skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('#gaga-main')).toBeFocused();
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await page.waitForTimeout(120);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);}
  const title=await page.locator('h1').innerText();await expect(page.locator('.gaga-island-brand span')).toHaveText(title);
 }
});
test('knowledge hierarchy has exact current navigation and a real ordered alphabet pager',async({page})=>{
 await ready(page,'/knowledge/index');await notch(page);await page.locator('[data-gaga-notch-more]').click();await page.locator('[data-gaga-action="toggle-left-rail"]').last().click();await expect(page.locator('[data-gaga-left-rail]')).toHaveAttribute('data-gaga-state','expanded');
 await expect(page.locator('.gaga-left-rail__context-groups > [data-gaga-nav-group] > details a[href="/knowledge/index"]')).toHaveAttribute('aria-current','page');
 await expect(page.locator('.gaga-left-rail__context-groups > [data-gaga-nav-group] > details a[href="/knowledge"]')).not.toHaveAttribute('aria-current','page');
 await page.keyboard.press('Escape');
 const next=page.locator('.gaga-knowledge-letter-pager a[rel="next"]').first();const target=await next.getAttribute('href');await next.click();await expect(page).toHaveURL(new RegExp(target!.replace('#','\\#')+'$'));await expect(page.locator(target!)).toBeInViewport();
});
test('document outline uses live headings, deep links and native focus restoration',async({page},info)=>{
 await ready(page,'/about');await notch(page);const action=page.locator('[data-gaga-document-outline-action]');await expect(action).toBeVisible();await action.click();const sheet=page.locator('[data-gaga-outline-peek]');await expect(sheet).toHaveAttribute('data-gaga-state','open');await page.screenshot({path:'.gaga/documentation-'+info.project.name+'.png'});
 const link=sheet.locator('a[href="#direktori-tentang"]');await expect(link).toBeVisible();await link.click();await expect(page).toHaveURL(/#direktori-tentang$/);await expect(sheet).toHaveAttribute('data-gaga-state','closed');await expect(page.locator('#direktori-tentang')).toBeInViewport();
 await page.goto('/about#prinsip-editorial');await expect(page.locator('#prinsip-editorial')).toBeInViewport();await expect(page.locator('#prinsip-editorial [data-gaga-heading-link]')).toHaveAttribute('href','#prinsip-editorial');
 await page.locator('[data-gaga-outline-opener]').click();await page.keyboard.press('Escape');await expect(page.locator('[data-gaga-outline-opener]')).toBeFocused();
});
test('short legal document retains real text, inline navigator and no invented TOC or sibling sequence',async({page})=>{
 await ready(page,'/legal/privacy');await expect(page.locator('[data-gaga-document-navigation]')).not.toHaveAttribute('open');await page.locator('[data-gaga-document-navigation] summary').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-gaga-document-navigation] a[href="/legal/privacy"]')).toHaveAttribute('aria-current','page');
 await expect(page.locator('[data-gaga-left-rail]')).toHaveCount(0);await expect(page.locator('[data-gaga-outline-stack]')).toBeHidden();await notch(page);await expect(page.locator('[data-gaga-document-outline-action]')).toBeHidden();await expect(page.locator('[data-gaga-action-id="save"]')).toHaveCount(0);
 await page.locator('[data-gaga-document-navigation] a[href="/legal/terms"]').click();await expect(page.locator('h1')).toHaveText('Ketentuan Penggunaan');await expect(page.locator('[data-gaga-document-body]')).toContainText('Seluruh publikasi');await expect(page.locator('a[rel="prev"],a[rel="next"]')).toHaveCount(0);
});
test('system documentation is explanatory, supports actual anchors, and exposes only public discovery links',async({page})=>{
 await ready(page,'/system/sitemap');await notch(page);await page.locator('[data-gaga-document-outline-action]').click();await page.locator('[data-gaga-outline-peek] a[href="#publikasi"]').click();await expect(page).toHaveURL(/#publikasi$/);
 await ready(page,'/system/status');await expect(page.locator('h1')).toHaveText('Panduan Sistem Publik');await expect(page.locator('[data-gaga-document-body]')).not.toContainText('CLOUDFLARE');await ready(page,'/system/rss');await expect(page.locator('[data-gaga-document-body]')).toContainText('build publik yang diadmit');await expect(page.locator('[data-gaga-document-body] a[href="/rss.xml"]')).toBeVisible();
});
test('Sections use explicit editorial membership while Topics retain subject taxonomy',async({page})=>{
 const snapshot=JSON.parse(readFileSync('content/emdash/published.json','utf8'));
 const docs=snapshot.documents.filter((d:any)=>d.pin.collection==='posts');const sections=new Set(docs.map((d:any)=>d.item.data.section??d.item.data.metadata?.section).filter(Boolean));expect(sections.size).toBeGreaterThan(0);
 await ready(page,'/sections');const detail=page.locator('.gaga-section-tile h2 a').first();const href=await detail.getAttribute('href');await detail.click();await expect(page.locator('[data-gaga-app-frame]')).toHaveAttribute('data-gaga-experience','section');await expect(page.locator('[data-gaga-document-workspace]')).toHaveCount(0);await expect(page.locator('[data-gaga-outline-stack]')).toHaveCount(0);
 const links=await page.locator('.gaga-section-front a[href^="/publications/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));expect(links.length).toBeGreaterThan(0);expect(new Set(links).size).toBe(links.length);
 await ready(page,'/topics/teknologi');await expect(page.locator('[data-gaga-entity-kind="topic"]')).toHaveCount(1);await expect(page.locator('[data-gaga-document-workspace]')).toHaveCount(0);
});
test('Search uses public Engine document classifications and tag publication links remain canonical',async({page})=>{
 await ready(page,'/search?q=Kebijakan%20Privasi');await expect(page.locator('[data-gaga-document-search]')).toContainText('Legal');await expect(page.locator('[data-gaga-document-search] a[href$="/legal/privacy"]')).toBeVisible();
 await ready(page,'/knowledge/tags');const tag=page.locator('a[href^="/knowledge/tags/"]').first();await tag.click();const pub=page.locator('.pakrpp-tag-detail__title').first();await expect(pub).toHaveAttribute('href',/^\/publications\/[^/]+$/);await pub.click();await expect(page.locator('[data-gaga-article-shell]')).toHaveCount(1);
});
test('document preferences, reduced motion and metadata stay with the active document',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await ready(page,'/about/author');const before=await page.locator('[data-gaga-page-metadata-table]').textContent();await notch(page);await page.locator('[data-gaga-action="toggle-reader-preferences"]').first().click();await expect(page.locator('[data-gaga-reader-panel]')).toHaveAttribute('data-gaga-state','open');await page.keyboard.press('Escape');await expect(page.locator('[data-gaga-reader-panel]')).toHaveAttribute('data-gaga-state','closed');
 await expect(page.locator('[data-gaga-page-metadata-table]')).toHaveText(before!);expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
});
