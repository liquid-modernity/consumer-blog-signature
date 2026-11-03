const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
  const records = [];
  for (const width of [390, 1440]) for (const motion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport: {width, height: 844}, reducedMotion: motion });
    await context.addInitScript(() => {
      window.__diagnostic = {shifts: [], mutations: [], fonts: []};
      try { new PerformanceObserver(list => list.getEntries().forEach(e => { if (!e.hadRecentInput) window.__diagnostic.shifts.push({value:e.value, startTime:e.startTime}); })).observe({type:'layout-shift', buffered:true}); } catch {}
      document.fonts.addEventListener('loading', () => window.__diagnostic.fonts.push({type:'loading',at:performance.now()}));
      document.fonts.addEventListener('loadingdone', () => window.__diagnostic.fonts.push({type:'done',at:performance.now()}));
      new MutationObserver(ms => ms.forEach(m => { if (m.attributeName && /^(data-gaga-reader|data-gaga-signature-state|data-gaga-state|style)/.test(m.attributeName)) window.__diagnostic.mutations.push({at:performance.now(),target:m.target.tagName,attribute:m.attributeName}); })).observe(document, {attributes:true, subtree:true});
    });
    const page = await context.newPage();
    let errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      const response = await page.goto('http://127.0.0.1:3020/publications/designing-context-aware-reading-surface',{waitUntil:'networkidle'});
      await page.waitForTimeout(700);
      const before = await page.evaluate(() => window.__diagnostic.mutations.length);
      for (const f of [0,.1,.3,.6,.9,.5,.2,0]) { await page.evaluate(x => window.scrollTo(0, (document.documentElement.scrollHeight-innerHeight)*x), f); await page.waitForTimeout(100); }
      await page.waitForTimeout(400);
      const data = await page.evaluate(() => ({diagnostic:window.__diagnostic,scrollY, docHeight:document.documentElement.scrollHeight, main:(()=>{const e=document.querySelector('#gaga-main');const s=getComputedStyle(e);return {height:e.getBoundingClientRect().height,overflowY:s.overflowY,marginTop:s.marginBlockStart}})(), title:document.querySelector('h1')?.textContent?.trim()}));
      await page.screenshot({path:`/private/tmp/gaga-quiet-v4-final-convergence-evidence/render-${width}-${motion}.png`});
      records.push({width,motion,status:response.status(),errors,mutationCountBeforeScroll:before,...data});
    } catch(e) { records.push({width,motion,errors:[...errors,e.message]}); }
    await context.close();
  }
  fs.writeFileSync('/private/tmp/gaga-quiet-v4-final-convergence-evidence/render-diagnostic.json',JSON.stringify(records,null,2));
  await browser.close();
  if (records.some(x => x.status !== 200 || x.errors.length)) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
