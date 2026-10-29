import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const out='.gaga/contextual-ux';mkdirSync(out,{recursive:true});
test('sealed canonical baseline reproduces duplicate root rows and wrong root saved key',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('gaga:saved:v1',JSON.stringify([{id:'baseline-proof',href:'/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity',title:'Existing saved reading',savedAt:'2026-10-29T00:00:00Z'}])));
 await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');
 const links=await page.locator('.pakrpp-publication-list .pakrpp-publication-row__title').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 expect(links).toHaveLength(20);expect(new Set(links).size).toBe(7);
 await expect(page.locator('[data-pakrpp-saved-root-list] a')).toHaveCount(0);
 writeFileSync(out+'/baseline-root.json',JSON.stringify({observedRows:links.length,uniqueRecords:new Set(links).size,savedStoredButNotListed:true}));await page.screenshot({path:out+'/baseline-root.png'});
});
test('sealed baseline reproduces intercepted Notch Save and hover replacing active context',async({page})=>{
 await page.goto('/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity');await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');
 const notch=page.locator('[data-gaga-action-runtime]');await notch.hover();await expect(notch).toHaveAttribute('data-gaga-state','peek');await page.locator('[data-gaga-action-island-toggle]').click();
 const save=notch.locator('[data-gaga-action-runtime-actions] [data-gaga-action="toggle-save"]');await save.click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gaga:saved:v1')??'[]'))).toHaveLength(0);
 const title=page.locator('[data-gaga-island-focus-title]'),original=await title.textContent();const preview=page.locator('.gaga-article-pager a').first();await preview.scrollIntoViewIfNeeded();await preview.hover();await expect.poll(()=>title.textContent()).not.toBe(original);
 writeFileSync(out+'/baseline-article.json',JSON.stringify({notchSaveDidNotPersist:true,hoverChangedActiveTitle:true,originalTitle:original,hoverTitle:await title.textContent()}));await page.screenshot({path:out+'/baseline-article.png'});
});
