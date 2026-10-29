import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
const require=createRequire(resolve(process.env.GAGA_APPLICATION_DIR,'package.json'));
const {test,expect}=require('@playwright/test');
const article='/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity',dir=process.env.GAGA_EVIDENCE_DIRECTORY;
const toggle=p=>p.locator('[data-gaga-action-island-toggle]'),island=p=>p.locator('[data-gaga-action-runtime]'),panel=p=>p.locator('[data-gaga-reader-panel]');
async function ready(page,path=article){await page.goto(path);await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');await page.evaluate(()=>document.fonts.ready);}
async function settled(page){await expect.poll(()=>page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getComputedTiming().endTime!==Infinity).length)).toBe(0);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function shot(page,info,name){await settled(page);await page.screenshot({path:dir+'/'+info.project.name+'-'+name+'.png'});}
async function openPrefs(page){await toggle(page).focus();await page.keyboard.press('Enter');await page.locator('[data-gaga-notch-more]').focus();await page.keyboard.press('Enter');await page.locator('[data-gaga-notch-system] [data-gaga-action="toggle-reader-preferences"]').focus();await page.keyboard.press('Enter');await expect(panel(page)).toHaveAttribute('data-gaga-state','open');}
async function bounds(page,selector){return page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight};});}
function within(g){expect.soft(g.left).toBeGreaterThanOrEqual(-1);expect.soft(g.right).toBeLessThanOrEqual(g.width+1);expect.soft(g.top).toBeGreaterThanOrEqual(-1);expect.soft(g.bottom).toBeLessThanOrEqual(g.height+1);}
function record(info,name,value){writeFileSync(dir+'/'+info.project.name+'-'+name+'.json',JSON.stringify(value,null,2)+'\n');}
async function focused(page){return page.evaluate(()=>{const el=document.activeElement,s=el&&getComputedStyle(el),r=el?.getBoundingClientRect();return {tag:el?.tagName,action:el?.getAttribute('data-gaga-action'),hidden:!!el?.closest('[hidden],[inert],[aria-hidden="true"]'),outline:s?.outlineStyle,outlineWidth:s?.outlineWidth,rect:r?{top:r.top,bottom:r.bottom}:null};});}
test.beforeEach(async({page,context},info)=>{
 page.setDefaultTimeout(5000);
 await context.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.addInitScript(theme=>localStorage.setItem('gaga:theme:v2',JSON.stringify(theme)),info.project.metadata.theme);
});
test('open Notch and relevant Outline states preserve theme, current identity and keyboard access',async({page},info)=>{
 await ready(page);await expect(page.locator('html')).toHaveAttribute('data-gaga-theme',info.project.metadata.theme);
 const before=await page.locator('[data-gaga-page-metadata-table]').innerText(),id=await page.locator('[data-gaga-app-frame]').getAttribute('data-gaga-page-id');
 await toggle(page).focus();await page.keyboard.press('Enter');await expect(island(page)).toHaveAttribute('data-gaga-level','1');within(await bounds(page,'[data-gaga-action-runtime]'));await shot(page,info,'notch-level1');
 await page.locator('[data-gaga-notch-more]').focus();await page.keyboard.press('Enter');await expect(island(page)).toHaveAttribute('data-gaga-level','2');await shot(page,info,'notch-level2');within(await bounds(page,'[data-gaga-action-runtime]'));
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');await expect(toggle(page)).toBeFocused();
 const opener=page.locator('[data-gaga-outline-opener]');await expect(opener).toHaveCount(1);await opener.focus();await page.keyboard.press('Enter');await expect(page.locator('[data-gaga-outline-peek]')).toHaveAttribute('data-gaga-state','open');within(await bounds(page,'[data-gaga-outline-peek]'));await shot(page,info,'article-outline-open');
 await page.locator('[data-gaga-outline-peek] a').first().focus();await page.keyboard.press('Escape');await expect(opener).toBeFocused();
 expect(await page.locator('[data-gaga-page-metadata-table]').innerText()).toBe(before);expect(await page.locator('[data-gaga-app-frame]').getAttribute('data-gaga-page-id')).toBe(id);
 await opener.click();const lastLink=page.locator('[data-gaga-outline-peek] a').last(),lastLabel=await lastLink.innerText();await lastLink.click();await expect(page.locator('[data-gaga-outline-current-label]')).toHaveText(lastLabel);
 await ready(page,'/saved');await expect(page.locator('[data-gaga-continuity-continue]')).toBeVisible();await settled(page);within(await bounds(page,'[data-gaga-continuity-continue]'));expect(await page.locator('[data-gaga-main-region]').evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);await shot(page,info,'saved-after-reading');
 await ready(page,'/');await page.locator('[data-gaga-outline-opener]').click();await expect(page.locator('[data-gaga-outline-peek]')).toHaveAttribute('data-gaga-state','open');await shot(page,info,'root-outline-open');await page.keyboard.press('Escape');
 for(const route of ['/topics/teknologi','/sections','/saved']){await ready(page,route);await expect(page.locator('[data-gaga-outline-opener]')).toHaveCount(0);}
 record(info,'notch-outline',{status:'PASS',activePageStable:true,outlineRoutes:['root','article'],notOn:['topic','sections','saved']});
});
test('Preferences scroll containment, bottom keyboard reachability and Escape restoration',async({page},info)=>{
 await ready(page);const read=()=>page.evaluate(()=>({main:document.querySelector('[data-gaga-main-region]').scrollTop,article:document.querySelector('[data-gaga-article-scroll]').scrollTop}));const before=await read();await openPrefs(page);await shot(page,info,'preferences-top');
 await expect.poll(()=>page.evaluate(()=>document.querySelector('[data-gaga-reader-panel]').contains(document.activeElement))).toBe(true);
 const last=panel(page).locator('fieldset button').last();let tabs=0;
 while(!await last.evaluate(el=>el===document.activeElement)&&tabs<100){await page.keyboard.press('Tab');tabs++;expect.soft(await panel(page).evaluate(el=>el.contains(document.activeElement))).toBe(true);}
 await expect(last).toBeFocused();within(await last.evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight};}));
 const scroll=await page.locator('.gaga-action-runtime__shell').evaluate(el=>({scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));expect(scroll.scrollTop).toBeGreaterThan(0);await shot(page,info,'preferences-bottom');expect(await read()).toEqual(before);
 await page.keyboard.press('Escape');await expect(panel(page)).toHaveAttribute('data-gaga-state','closed');await expect(page.locator('[data-gaga-notch-system] [data-gaga-action="toggle-reader-preferences"]')).toBeFocused();record(info,'preferences-scroll',{status:'PASS',tabs,scroll,before,after:await read(),focus:await focused(page)});
});
test('Preferences active theme, transient feedback, X and outside dismissal retain usable focus',async({page},info)=>{
 await ready(page);await openPrefs(page);const theme=info.project.metadata.theme,choice=panel(page).locator('[data-gaga-reader-pref="theme"][data-gaga-reader-value="'+theme+'"]');await choice.click();await expect(choice).toHaveAttribute('aria-pressed','true');await expect(page.locator('.gaga-toast')).toHaveAttribute('data-gaga-state','visible');await shot(page,info,'theme-feedback');await expect(page.locator('.gaga-toast')).toHaveAttribute('data-gaga-state','hidden',{timeout:2500});await shot(page,info,'preferences-feedback-expired');
 await panel(page).locator('[data-gaga-reader-close]').click();await expect(panel(page)).toHaveAttribute('data-gaga-state','closed');await expect(page.locator('[data-gaga-notch-system] [data-gaga-action="toggle-reader-preferences"]')).toBeFocused();
 await page.locator('[data-gaga-notch-system] [data-gaga-action="toggle-reader-preferences"]').click();await expect(panel(page)).toHaveAttribute('data-gaga-state','open');
 await page.mouse.click(info.project.metadata.width-2,info.project.metadata.width===1440?998:842);await expect(panel(page)).toHaveAttribute('data-gaga-state','closed');await shot(page,info,'outside-dismissed');const focus=await focused(page);record(info,'dismiss',{focus,level:await island(page).getAttribute('data-gaga-level')});await expect(toggle(page)).toBeFocused();
 await page.emulateMedia({reducedMotion:'reduce'});await toggle(page).click();await expect(island(page)).toHaveAttribute('data-gaga-level','1');await settled(page);await shot(page,info,'reduced-motion-level1');await page.keyboard.press('Escape');await expect(toggle(page)).toBeFocused();
 if(info.project.metadata.width<1440){await toggle(page).tap();await expect(island(page)).toHaveAttribute('data-gaga-level','1');await toggle(page).tap();await expect(island(page)).toHaveAttribute('data-gaga-level','0');}
});
test('all admitted articles bind Outline links to real headings; empty and single-heading fixtures remain honest',async({page,context},info)=>{
 const {readFileSync}=require('node:fs');const posts=JSON.parse(readFileSync(resolve(process.env.GAGA_APPLICATION_DIR,'content/emdash/published.json'),'utf8')).documents.filter(d=>d.pin.collection==='posts');
 const results=[];
 for(const post of posts){
  await ready(page,'/publications/'+post.item.slug);
  const headings=await page.locator('[data-gaga-article-body] h2[id], [data-gaga-article-body] h3[id]').evaluateAll(nodes=>nodes.map(n=>({href:'#'+n.id,text:n.textContent.trim()})));
  const opener=page.locator('[data-gaga-outline-opener]');
  if(headings.length){await expect(opener).toBeVisible();expect(await page.locator('[data-gaga-outline-peek] [data-gaga-info-field="outline"] a').evaluateAll(nodes=>nodes.map(n=>({href:n.getAttribute('href'),text:n.textContent.trim()})))).toEqual(headings);await expect(page.locator('[data-gaga-outline-total]')).toHaveText(String(headings.length));await expect(page.locator('[data-gaga-outline-sheet-total]')).toHaveText(String(headings.length));}
  else await expect(opener).toBeHidden();
  results.push({id:post.applicationId,revision:post.pin.liveRevisionId,headings});
 }
 for(const fixture of [{name:'no-headings',html:'<p>Short text without headings.</p>'},{name:'single-heading',html:'<h2 id="only-heading">Only heading</h2><p>Short text.</p>'}]){
  const handler=async route=>{const response=await route.fetch(),html=await response.text(),marker=html.indexOf('data-gaga-article-body'),start=html.indexOf('>',marker)+1,end=html.indexOf('</div>',start);expect(marker).toBeGreaterThan(0);expect(end).toBeGreaterThan(start);expect(html.slice(start,end)).not.toContain('<div');await route.fulfill({response,body:html.slice(0,start)+fixture.html+html.slice(end)});};
  await context.route('**'+article,handler);await ready(page);
  if(fixture.name==='no-headings')await expect(page.locator('[data-gaga-outline-opener]')).toBeHidden();
  else {await expect(page.locator('[data-gaga-outline-current-label]')).toHaveText('Only heading');await page.locator('[data-gaga-outline-opener]').click();await expect(page.locator('[data-gaga-outline-peek] a')).toHaveCount(1);await expect(page.locator('[data-gaga-outline-peek] a')).toHaveAttribute('href','#only-heading');}
  await shot(page,info,fixture.name);await context.unroute('**'+article,handler);
 }
 record(info,'all-article-headings',{status:'PASS',records:results,fixtures:['no-headings','single-heading']});
});
