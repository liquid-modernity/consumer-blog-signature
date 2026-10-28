import { test, expect, type Page } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const directory = '.gaga/reference-quality';
const article = '/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity';
const saved = [{ id: article, href: article, title: 'Akal Imitasi sebagai Pekerja Tanpa Dignity', savedAt: '2026-10-28T00:00:00.000Z' }];
mkdirSync(directory, {recursive: true});
const record = (name: string, value: unknown) => writeFileSync(directory + '/' + name + '.json', JSON.stringify(value, null, 2) + '\n');

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(async () => page.evaluate(() => {
    const active = document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().endTime !== Infinity);
    return active.length;
  })).toBe(0);
  // A new IntersectionObserver animation can start on the next paint.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().endTime !== Infinity).length)).toBe(0);
}
async function metrics(page: Page) {
  return page.evaluate(() => {
    const box = (selector: string) => {
      const el = document.querySelector<HTMLElement>(selector)!;
      const r = el.getBoundingClientRect(), css = getComputedStyle(el);
      return { x:r.x, right:r.right, y:r.y, bottom:r.bottom, width:r.width, height:r.height,
        scrollWidth:el.scrollWidth, clientWidth:el.clientWidth, opacity:css.opacity,
        display:css.display, grid:css.gridTemplateColumns, minWidth:css.minWidth,
        overflowX:css.overflowX, fontSize:css.fontSize };
    };
    return { viewport:innerWidth, documentWidth:document.documentElement.scrollWidth,
      page:box('[data-gaga-saved-page]'), header:box('.gaga-saved-screen > header'),
      head:box('.gaga-library-head'), stats:box('.gaga-library-stats'), nav:box('[data-gaga-library-nav]'),
      item:box('[data-gaga-saved-bookmarks-list] .gaga-saved-item'),
      tabs:[...document.querySelectorAll<HTMLElement>('[data-gaga-library-tab]')].map(el => ({name:el.dataset.gagaLibraryTab,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),
      activeAnimations:document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getComputedTiming().endTime!==Infinity).length };
  });
}

test.beforeEach(async ({context, page}) => {
  page.setDefaultTimeout(5000);
  await context.route('**/*', route => ['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

test('settled saved library layout, tab strip, touch targets and keyboard focus', async ({page}, info) => {
  // Layout fixture only. The actual Save→reload→remove journey runs separately, unchanged.
  await page.addInitScript(items => localStorage.setItem('gaga:saved:v1', JSON.stringify(items)), saved);
  await page.goto('/saved');
  await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');
  const item=page.locator('[data-gaga-saved-bookmarks-list] .gaga-saved-item');
  await expect(item).toHaveCount(1); await settle(page);
  const before=await metrics(page);
  record(info.project.name+'-layout',before);
  await page.screenshot({path:directory+'/'+info.project.name+'-saved.png'});
  expect.soft(before.activeAnimations).toBe(0);
  expect.soft(before.documentWidth).toBeLessThanOrEqual(before.viewport+1);
  for(const [name,b] of Object.entries({page:before.page,header:before.header,head:before.head,stats:before.stats,nav:before.nav,item:before.item})) {
    expect.soft(b.x,name+' left').toBeGreaterThanOrEqual(before.page.x-1);
    expect.soft(b.right,name+' right').toBeLessThanOrEqual(before.page.right+1);
  }
  expect.soft(Number(before.item.opacity),'settled saved item opacity').toBe(1);
  for(const tab of before.tabs) {
    expect.soft(tab.height,tab.name+' touch height').toBeGreaterThanOrEqual(44);
    expect.soft(tab.width,tab.name+' touch width').toBeGreaterThanOrEqual(44);
  }
  const nav=page.locator('[data-gaga-library-nav]');
  const tabs=nav.locator('[data-gaga-library-tab]');
  for(const name of ['highlights','notes','quotes','history','saved']) {
    const tab=nav.locator('[data-gaga-library-tab="'+name+'"]');
    if(info.project.name==='1440') await tab.click(); else await tab.tap();
    await expect(tab).toHaveAttribute('aria-selected','true');
    await expect(page.locator('[data-gaga-library-section]:not([hidden])')).toHaveAttribute('data-gaga-library-section',name);
  }
  await tabs.first().focus();
  await page.keyboard.press('End');
  const keyboardEnd=await tabs.last().evaluate(el=>el===document.activeElement);
  expect.soft(keyboardEnd,'End moves to final library tab').toBe(true);
  await settle(page);
  const endGeometry=await tabs.last().evaluate(el=>{const r=el.getBoundingClientRect(),nav=el.closest<HTMLElement>('[data-gaga-library-nav]')!,n=nav.getBoundingClientRect();return {x:r.x,right:r.right,navX:n.x,navRight:n.right,scrollLeft:nav.scrollLeft};});
  if(keyboardEnd){expect.soft(endGeometry.x).toBeGreaterThanOrEqual(endGeometry.navX-1);expect.soft(endGeometry.right).toBeLessThanOrEqual(endGeometry.navRight+1);}

  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  const keyboardRight=await tabs.nth(1).evaluate(el=>el===document.activeElement);
  expect.soft(keyboardRight,'ArrowRight advances library tab').toBe(true);
  await page.keyboard.press('ArrowLeft');
  const keyboardLeft=await tabs.first().evaluate(el=>el===document.activeElement);
  expect.soft(keyboardLeft,'ArrowLeft returns to saved tab').toBe(true);
  await settle(page);
  const focus=await page.evaluate(()=>{const el=document.activeElement as HTMLElement,css=getComputedStyle(el);return {visible:el.matches(':focus-visible'),outline:css.outlineStyle,width:parseFloat(css.outlineWidth),shadow:css.boxShadow};});
  expect.soft(focus.visible).toBe(true);
  expect.soft((focus.outline!=='none'&&focus.width>=2)||focus.shadow!=='none','visible keyboard focus').toBe(true);
  expect.soft(await nav.getAttribute('role'),'native tab-list semantics').toBe('tablist');
  await settle(page);
  const after=await metrics(page);
  record(info.project.name+'-interaction',{before,after,keyboardEnd,keyboardRight,keyboardLeft,endGeometry,focus,storage:await page.evaluate(()=>JSON.parse(localStorage.getItem('gaga:saved:v1')??'[]'))});
  expect.soft(after.documentWidth).toBeLessThanOrEqual(after.viewport+1);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gaga:saved:v1')??'[]'))).toEqual(saved);
});

test('all affected built page shells have one main and a working keyboard skip target', async ({page}, info) => {
  const inventory=JSON.parse(readFileSync(directory+'/html-semantics.json','utf8'));
  const results=[];
  for(const route of inventory.routes) {
    await page.goto(route.path);
    await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime','ready');
    const skip=page.locator('a.gaga-skip-link');
    await expect(skip).toHaveCount(1);
    const autofocus=await page.locator('[autofocus]').count()>0;
    await page.keyboard.press('Tab');
    let backwardSteps=0;
    if(autofocus){
      // Preserve native Search autofocus; reach the existing skip link using real keyboard navigation.
      const limit=await page.locator('a[href],button,input,select,textarea,[tabindex]').count()+1;
      while(!(await skip.evaluate(el=>el===document.activeElement))&&backwardSteps<limit){
        await page.keyboard.press('Shift+Tab');backwardSteps++;
      }
    }
    await expect(skip).toBeFocused();
    await settle(page);
    const visible=await skip.evaluate(el=>{const b=el.getBoundingClientRect();return b.x>=0&&b.y>=0&&b.right<=innerWidth&&b.bottom<=innerHeight;});
    const href=await skip.getAttribute('href');
    await page.keyboard.press('Enter');
    const semantic=await page.evaluate(id=>{
      const targets=[...document.querySelectorAll<HTMLElement>('[id]')].filter(el=>el.id===id);
      const target=targets[0];return {mainCount:document.querySelectorAll('main,[role="main"]').length,targetCount:targets.length,targetTag:target?.tagName,targetRole:target?.getAttribute('role'),focusOnTarget:document.activeElement===target,containsContent:!!target?.querySelector('h1,article,section'),hash:location.hash};
    },href!.slice(1));
    results.push({path:route.path,skipVisible:visible,autofocus,backwardSteps,href,...semantic});
    expect.soft(semantic.mainCount,route.path+' main').toBe(1);
    expect.soft(semantic.targetCount,route.path+' unique skip target').toBe(1);
    expect.soft(semantic.targetTag==='MAIN'||semantic.targetRole==='main',route.path+' target is main').toBe(true);
    expect.soft(semantic.focusOnTarget,route.path+' focus').toBe(true);
    expect.soft(semantic.containsContent,route.path+' meaningful content').toBe(true);
    expect.soft(visible,route.path+' visible skip link').toBe(true);
  }
  record(info.project.name+'-semantics',{status:results.every(r=>r.mainCount===1&&r.targetCount===1&&r.focusOnTarget&&(r.targetTag==='MAIN'||r.targetRole==='main')&&r.skipVisible&&r.containsContent)?'PASS':'BLOCKED',routes:results});
});
