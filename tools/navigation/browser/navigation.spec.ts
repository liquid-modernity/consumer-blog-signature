import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { assertDocumentBytes } from '../../documentation/source-readback.mjs';
import { getEnabledTopics } from '../../../src/config/pakrpp-architecture';
const manifest=process.env.GAGA_PRODUCTION_BROWSER_URL?JSON.parse(readFileSync('.gaga/deployment-manifest.json','utf8')):undefined;
async function ready(page:Page,path:string) {
 const r=await page.goto(path);expect(r?.status()).toBe(200);
 if(manifest)await test.info().attach('navigation-source-bytes',{body:JSON.stringify(assertDocumentBytes(manifest,path,await r!.body())),contentType:'application/json'});
 await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');
}
async function open(page:Page) {
 const opener=page.locator('[data-gaga-outline-opener]');await opener.focus();await opener.click();
 const sheet=page.locator('[data-gaga-outline-peek]');await expect(sheet).toHaveAttribute('data-gaga-state','open');return sheet;
}
for(const family of ['knowledge','sections','legal','archive','system','topics','about']) {
 test(family+' root and available children resolve family membership, active identity and canonical destinations',async({page})=>{
  const root='/'+family;await ready(page,root);let sheet=await open(page);
  const nav=sheet.locator('[data-gaga-local-navigation]');await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute('href',root);
  const destinations=await nav.locator('a').evaluateAll(links=>links.map(a=>a.getAttribute('href')!));expect(destinations.length).toBeGreaterThan(1);expect(new Set(destinations).size).toBe(destinations.length);
  for(const path of destinations){expect((await page.request.get(path)).status()).toBe(200);}
  const child=destinations.find(p=>p!==root)!;await nav.locator(`a[href="${child}"]`).click();await expect(page).toHaveURL(new RegExp(child+'/?$'));
  await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');sheet=await open(page);
  await expect(sheet.locator('[data-gaga-local-navigation] a[aria-current="page"]')).toHaveAttribute('href',child);
  await expect(page.locator('[data-gaga-document-navigation], .pakrpp-kindex__letters, .gaga-knowledge-letter-pager, .pakrpp-archive-year__months')).toHaveCount(0);
  const railLinks=await page.locator('.gaga-left-rail__context-groups a').evaluateAll(links=>links.map(a=>a.getAttribute('href')));expect(railLinks.filter(h=>destinations.includes(h!))).toEqual([]);
  await page.keyboard.press('Escape');await expect(page.locator('[data-gaga-outline-opener]')).toBeFocused();await expect(sheet).toHaveAttribute('aria-hidden','true');
  if(family==='topics'){const allowed=getEnabledTopics().map(t=>'/topics/'+t.slug);expect(destinations.slice(1).every(p=>allowed.includes(p))).toBe(true);await expect(sheet.locator('[data-gaga-toc-block]')).toHaveCount(0);}
  if(family==='sections')await expect(sheet.locator('[data-gaga-toc-block]')).toHaveCount(0);
 });
}
test('archive navigation includes actual periods only and explicit temporal siblings',async({page})=>{
 await ready(page,'/archive');let sheet=await open(page);
 const years=await sheet.locator('[data-gaga-local-navigation] > ul > li > a').evaluateAll(links=>links.map(a=>a.getAttribute('href')!).filter(h=>/\/\d{4}$/.test(h)));
 expect(years.length).toBeGreaterThan(0);
 for(const year of years){await ready(page,year);expect(await page.locator('.pakrpp-archive-year__list > li').count()).toBeGreaterThan(0);sheet=await open(page);const months=await sheet.locator(`[data-gaga-local-navigation] a[href^="${year}/"]`).evaluateAll(links=>links.map(a=>a.getAttribute('href')!));expect(months.length).toBeGreaterThan(0);await ready(page,months[0]);sheet=await open(page);await expect(sheet.locator(`[data-gaga-local-navigation] a[href="${months[0]}"]`)).toHaveAttribute('aria-current','page');const next=sheet.locator('[data-gaga-local-sequence] a[rel="next"]');if(await next.isVisible()){const href=await next.getAttribute('href');await next.click();await expect(page).toHaveURL(new RegExp(href+'/?$'));}}
 for(const year of years){await ready(page,year);sheet=await open(page);await expect(sheet.locator(`[data-gaga-local-navigation] a[href="${year}"]`)).toHaveAttribute('aria-current','page');}expect((await page.request.get('/archive/1900')).status()).toBe(404);
});
test('short documents keep family navigation without fabricated TOC; deep document outline and sequence coexist',async({page})=>{
 await ready(page,'/legal/privacy');let sheet=await open(page);await expect(sheet.locator('[data-gaga-info-field="outline"] a')).toHaveCount(0);await expect(sheet.locator('[data-gaga-local-sequence]')).toHaveCount(0);await page.keyboard.press('Escape');
 await ready(page,'/knowledge/index');sheet=await open(page);const headings=sheet.locator('[data-gaga-info-field="outline"] a');expect(await headings.count()).toBeGreaterThan(1);const target=await headings.nth(1).getAttribute('href');await headings.nth(1).click();await expect(page).toHaveURL(new RegExp(target+'$'));await expect(page.locator(target!)).toBeInViewport();await expect(page.locator(target!)).toBeFocused();sheet=await open(page);const next=sheet.locator('[data-gaga-local-sequence] a[rel="next"]');await expect(next).toBeVisible();const nextTarget=await next.getAttribute('href');await next.click();await expect(page.locator(nextTarget!)).toBeInViewport();await expect(page.locator(nextTarget!)).toBeFocused();
 await ready(page,'/about#prinsip-editorial');await expect(page.locator('#prinsip-editorial')).toBeInViewport();sheet=await open(page);await expect(sheet.locator('[data-gaga-info-field="outline"] a[href="#prinsip-editorial"]')).toBeVisible();
});
test('narrow and reduced-motion navigation stays contained, keyboard reachable, and pins the orientation surface',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,360,390,768,1440]){
  await page.setViewportSize({width,height:844});await ready(page,'/legal/terms');const sheet=await open(page);
  await expect(sheet.locator('[data-gaga-local-navigation] a[aria-current="page"]')).toBeFocused();const box=(await sheet.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await page.keyboard.press('Tab');await expect(sheet.locator(':focus')).toHaveCount(1);if(width===(info.project.name==='touch'?320:1440))await page.screenshot({path:'.gaga/navigation-'+info.project.name+'.png'});await page.keyboard.press('Escape');await expect(page.locator('[data-gaga-outline-opener]')).toBeFocused();
 }
});
