import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const article='/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity',out='.gaga/polish-v2';mkdirSync(out,{recursive:true});
const island=(p:Page)=>p.locator('[data-gaga-action-runtime]');
const toggle=(p:Page)=>p.locator('[data-gaga-action-island-toggle]');
const prefs=(p:Page)=>p.locator('[data-gaga-notch-context] [data-gaga-action="toggle-reader-preferences"]');
async function ready(p:Page,route=article){await p.goto(route);await expect(p.locator('html')).toHaveAttribute('data-gaga-runtime','ready');await p.evaluate(()=>document.fonts.ready);}
async function open(p:Page){if(await island(p).getAttribute('data-gaga-level')==='0')await toggle(p).click();}
async function settled(p:Page){await p.waitForTimeout(350);await p.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));}
async function bounds(p:Page,selector:string){await settled(p);const b=await p.locator(selector).boundingBox();expect(b).not.toBeNull();const v=p.viewportSize()!;expect(b!.x).toBeGreaterThanOrEqual(-1);expect(b!.y).toBeGreaterThanOrEqual(-1);expect(b!.x+b!.width).toBeLessThanOrEqual(v.width+1);expect(b!.y+b!.height).toBeLessThanOrEqual(v.height+1);expect(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);return b!;}

test('compact identity, first-level actions, accessible targets and expanding native search',async({page},info)=>{
 await ready(page);const rest=await bounds(page,'[data-gaga-action-runtime]');expect(rest.height).toBeLessThan(65);expect(rest.width).toBeLessThan(290);
 await expect(island(page).locator('img')).toHaveAttribute('src','/favicon.svg');
 await toggle(page).focus();await page.keyboard.press('Enter');await expect(island(page)).toHaveAttribute('data-gaga-level','1');
 for(const action of ['save','copy-link','share','focusmode','speak']){const button=island(page).locator('[data-gaga-action-id="'+action+'"]');await expect(button).toBeVisible();const b=await button.boundingBox();expect(b!.height).toBeGreaterThanOrEqual(44);expect(b!.width).toBeGreaterThanOrEqual(44);expect(await button.getAttribute('aria-label')).toBeTruthy();}
 await expect(prefs(page)).toBeVisible();await expect(page.locator('[data-gaga-island-focus-title]')).toHaveText(await page.locator('h1').innerText());
 await page.locator('[data-gaga-notch-search-toggle]').click();const input=page.locator('#notch-query');await expect(input).toBeFocused();await input.fill('Akal Imitasi');await input.press('Enter');await expect(page).toHaveURL(/\/search\?q=Akal/);await expect(page.locator('[data-gaga-search-results]')).toContainText('Akal Imitasi');
 await ready(page,'/');await open(page);await expect(island(page)).not.toContainText('01 · Publikasi Terbaru');await expect(page.locator('[data-gaga-outline-stack]')).toHaveCount(0);
 await page.screenshot({path:out+'/'+info.project.name+'-root.png'});
});

test('integrated preferences respond immediately, persist, reset and restore keyboard focus',async({page},info)=>{
 await ready(page);await open(page);await prefs(page).click();const panel=page.locator('[data-gaga-reader-panel]');await expect(panel).toHaveAttribute('data-gaga-state','open');await bounds(page,'[data-gaga-action-runtime]');
 await expect(panel.locator('[data-gaga-reader-advanced]')).not.toHaveAttribute('open');await expect.poll(()=>panel.evaluate(el=>el.contains(document.activeElement))).toBe(true);
 await panel.locator('[data-gaga-reader-pref="theme"][data-gaga-reader-value="dark"]').click();await expect(page.locator('body')).toHaveAttribute('data-gaga-theme','dark');
 await panel.locator('[data-gaga-reader-pref="font"][data-gaga-reader-value="lg"]').click();await panel.locator('[data-gaga-reader-pref="fontFamily"][data-gaga-reader-value="serif"]').click();
 await expect(page.locator('body')).toHaveAttribute('data-gaga-reader-font-family','serif');await expect(page.locator('body')).toHaveAttribute('data-gaga-reader-font','lg');
 await expect(panel.locator('[data-gaga-reader-specimen]')).toBeVisible();await page.screenshot({path:out+'/'+info.project.name+'-preferences-dark.png'});
 const state=await page.evaluate(()=>localStorage.getItem('gaga:reader:v2'));await page.keyboard.press('Escape');await expect(panel).toHaveAttribute('data-gaga-state','closed');await expect(prefs(page)).toBeFocused();
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');expect(await page.evaluate(()=>localStorage.getItem('gaga:reader:v2'))).toBe(state);await open(page);await prefs(page).click();
 await panel.locator('[data-gaga-reader-advanced] summary').click();await panel.locator('[data-gaga-reader-pref="motion"][data-gaga-reader-value="reduced"]').click();await expect(page.locator('body')).toHaveAttribute('data-gaga-reader-motion','reduced');
 await panel.locator('[data-gaga-reader-reset]').click();await expect(page.locator('body')).toHaveAttribute('data-gaga-reader-font','md');await expect(page.locator('body')).toHaveAttribute('data-gaga-reader-letter-spacing','normal');
 await page.keyboard.press('Escape');await expect(prefs(page)).toBeFocused();await page.keyboard.press('Escape');await page.keyboard.press('Escape');await expect(toggle(page)).toBeFocused();
});

test('pointer placement, 500ms preview retention, Escape and stable publication metadata',async({page},info)=>{
 await ready(page);const meta=page.locator('[data-gaga-page-metadata-table]');const before=await meta.innerText();const link=page.locator('.gaga-article-pager a[data-gaga-preview]').first();await link.scrollIntoViewIfNeeded();const card=page.locator('[data-gaga-hover-preview-card]');
 if(info.project.name==='desktop'){
  await link.hover({position:{x:12,y:8}});await expect(card).toBeVisible();const box=await bounds(page,'[data-gaga-hover-preview-card]');const rect=await link.boundingBox();expect(Math.abs(box.x-rect!.x)).toBeLessThan(370);await page.mouse.move(4,4);await page.waitForTimeout(250);await expect(card).toBeVisible();await expect(card).toBeHidden({timeout:1500});
  await link.hover();await expect(card).toBeVisible();await card.hover();await page.waitForTimeout(650);await expect(card).toBeVisible();await page.mouse.move(3,3);await expect(card).toBeHidden({timeout:1500});
 }
 await link.focus();await expect(card).toBeVisible();await page.keyboard.press('Escape');await expect(card).toBeHidden();expect(await meta.innerText()).toBe(before);
 await expect(page.locator('.gaga-article-header__bar')).toHaveCount(0);await expect(page.locator('[data-gaga-knowledge-details] summary')).toHaveText('Pengetahuan');
});

test('contextual outline and truthful progress bar, no completed-reading footer',async({page},info)=>{
 await ready(page);const handle=page.locator('[data-gaga-outline-opener]');await expect(handle).toBeVisible();await handle.click();const sheet=page.locator('[data-gaga-outline-peek]');await expect(sheet).toHaveAttribute('data-gaga-state','open');await expect(sheet.locator('h2')).toHaveText('Daftar Isi');await bounds(page,'[data-gaga-outline-peek]');
 const link=sheet.locator('a[href^="#"]').last();const hash=await link.getAttribute('href');await link.click();await expect(sheet).toHaveAttribute('data-gaga-state','closed');expect(new URL(page.url()).hash).toBe(hash);await expect(page.locator('[data-gaga-outline-progress]')).toHaveAttribute('max','100');
 await expect.poll(()=>page.locator('[data-gaga-outline-progress]').evaluate((p:HTMLProgressElement)=>p.value)).toBeGreaterThan(0);await expect(page.locator('[data-gaga-article-reading-utilities]')).toHaveCount(0);
 await page.screenshot({path:out+'/'+info.project.name+'-article.png'});
});

test('settled responsive shells, configured presets, stable rails and semantic landmarks',async({page},info)=>{
 const widths=info.project.name==='desktop'?[320,360,390,768,1440]:[390];
 for(const width of widths){await page.setViewportSize({width,height:900});for(const route of ['/',article,'/topics','/saved']){await ready(page,route);await bounds(page,'[data-gaga-action-runtime]');await expect(page.getByRole('main')).toHaveCount(1);expect(await page.locator('main').getAttribute('id')).toBeTruthy();await expect(page.locator('a.gaga-skip-link')).toHaveCount(1);expect(await page.locator('[data-gaga-main-region]').evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);}}
 await ready(page,'/topics');const rail=page.locator('[data-gaga-left-rail]');if(await rail.isVisible()) {const state=await rail.getAttribute('data-gaga-state');await rail.hover();await page.waitForTimeout(500);await expect(rail).not.toHaveAttribute('data-gaga-hover-expanded','true');expect(await rail.getAttribute('data-gaga-state')).toBe(state);}
 await ready(page);for(const preset of [{placement:'top',shape:'notch'},{placement:'bottom',shape:'island'},{placement:'left',shape:'pill'},{placement:'right',shape:'island'}]){await page.locator('[data-gaga-action-runtime-container]').evaluate((el,p)=>{(el as HTMLElement).dataset.gagaNotchConfig=JSON.stringify(p);dispatchEvent(new Event('resize'));},preset);await bounds(page,'[data-gaga-action-runtime]');await open(page);await bounds(page,'[data-gaga-action-runtime]');await toggle(page).click();}
});

test('Saved remains a simple keyboard-operable collection; Archive uses native disclosure',async({page})=>{
 await ready(page);await open(page);const save=page.locator('[data-gaga-action-runtime] [data-gaga-action="save-reading"]');await save.click();await expect(save).toHaveAttribute('aria-pressed','true');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');await open(page);await expect(save).toHaveAttribute('aria-pressed','true');
 await ready(page,'/saved');const item=page.locator('[data-gaga-saved-bookmarks-list] .gaga-saved-item');await expect(item).toHaveCount(1);await expect(page.locator('[data-gaga-library-stats]')).toHaveCount(0);await page.locator('[role="tab"]').first().focus();await page.keyboard.press('End');await expect(page.locator('[data-gaga-library-tab="history"]')).toBeFocused();await page.keyboard.press('Home');await item.locator('[data-gaga-saved-remove]').click();await expect(item).toHaveCount(0);
 await ready(page,'/');await expect(page.locator('[data-pakrpp-saved-root-list] a')).toHaveCount(0);
 await ready(page,'/archive');const group=page.locator('details.gaga-archive-month').first();await expect(group).toHaveAttribute('open');await group.locator('summary').focus();await page.keyboard.press('Enter');await expect(group).not.toHaveAttribute('open');await page.keyboard.press('Enter');await expect(group.locator('a').first()).toBeVisible();
});

test('narration keeps playback context, native API controls and progress without unrelated actions',async({page})=>{
 await page.addInitScript(()=>{const queue:SpeechSynthesisUtterance[]=[];const synth={speaking:false,paused:false,getVoices:()=>[],cancel(){this.speaking=false;},pause(){this.paused=true;},resume(){this.paused=false;},speak(u:SpeechSynthesisUtterance){queue.push(u);this.speaking=true;u.onstart?.({} as SpeechSynthesisEvent);},addEventListener(){},removeEventListener(){}};Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});(window as unknown as {testSpeechQueue:unknown}).testSpeechQueue=queue;});
 await ready(page);await open(page);await page.locator('[data-gaga-action-id="speak"]').click();const player=page.locator('[data-gaga-action-runtime-live]');await expect(player).toBeVisible();await expect(player.locator('progress')).toHaveAttribute('max','1');await expect(page.locator('[data-gaga-notch-context]')).toBeHidden();
 await player.locator('[data-speech="pause"]').click();await expect(player.locator('[data-speech="resume"]')).toBeVisible();await player.locator('[data-speech="resume"]').click();await expect(player.locator('[data-speech="pause"]')).toBeVisible();await player.locator('[data-speech="stop"]').click();await expect(player).toBeHidden();await expect(island(page)).toHaveAttribute('data-gaga-state','collapsed');
});

test('reduced motion, visible keyboard focus and dismissal remain supported',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await toggle(page).focus();await page.keyboard.press('Enter');const control=prefs(page);await control.focus();expect(await control.evaluate(el=>({style:getComputedStyle(el).outlineStyle,width:parseFloat(getComputedStyle(el).outlineWidth),visible:el.matches(':focus-visible')}))).toMatchObject({visible:true});expect(await control.evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);
 await control.click();await expect(page.locator('[data-gaga-reader-panel]')).toHaveAttribute('aria-hidden','false');expect(await page.locator('[data-gaga-reader-panel]').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');await page.keyboard.press('Escape');await expect(control).toBeFocused();
});
