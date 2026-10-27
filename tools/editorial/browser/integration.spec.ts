import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {richFixture} from '../fixture.mjs';
import {validatePortableText} from '../../../editorial/content-semantics.mjs';
test('packed Arsenal in actual local editor: draft save/reload and canonical preview',async({page,context})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const api=async(path:string,method='GET',data?:unknown)=>{
    const r=await page.request.fetch('http://localhost:4322/_emdash/api/'+path,{method,headers:{'X-EmDash-Request':'1'},...(data?{data}:{})});
    expect(r.ok()).toBeTruthy();const result=await r.json();expect(result.success).toBe(true);return result.data;
  };
  await page.goto('/_emdash/api/setup/dev-bypass?content=1&redirect=/_emdash/admin');
  await page.waitForURL(/\/_emdash\/admin(?:\/)?$/);
  const me=await api('auth/me');
  if(me.isFirstLogin){await page.getByRole('button',{name:'Get Started',exact:true}).click();}
  const {body}=richFixture();
  // No external media or reusable-section dependency is needed to exercise the changed graph.
  const content=body.filter((b:any)=>!['sectionRef','image','gallery','figure','video'].includes(b._type));
  const created=await api('content/posts','POST',{slug:'packed-integration-proof',data:{title:'Packed integration proof',summary:'Local qualification only',body:content}});
  const id=created.item.id;
  await page.goto('/_emdash/admin/content/posts/'+id);
  await expect(page.getByRole('region',{name:'PAKRPP Editorial Studio'})).toBeVisible({timeout:30000});
  const canvas=page.locator('.studio-canvas .tiptap');
  const writing=canvas.locator('p').filter({hasText:'Strong'}).first();
  await writing.click();await page.keyboard.press('End');
  const saved=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().includes('/_emdash/api/content/posts/'+id)&&r.status()===200);
  await page.keyboard.type(' Packed consumer persisted.');await saved;
  let current=await api('content/posts/'+id);validatePortableText(current.item.data.body);
  expect(current.item.status).toBe('draft');expect(current.item.liveRevisionId).toBeFalsy();
  await page.reload();await expect(canvas).toContainText('Packed consumer persisted.');
  await page.locator('.studio-workspace aside nav button').filter({hasText:/^preview$/}).click();
  const preview=page.frameLocator('iframe[title="PAKRPP article preview"]');
  await expect(preview.locator('#editorial-preview-body')).toContainText('Packed consumer persisted.');
  await expect(preview.locator('[role="doc-bibliography"]')).toContainText('Evidence and methods');
  await expect(preview.locator('[role="doc-endnotes"]')).toContainText('method is explicitly');
  const anonymous=await context.browser()!.newContext();
  expect((await anonymous.request.get('http://localhost:4322/_emdash/api/content/posts/'+id)).status()).toBe(401);await anonymous.close();
  expect(errors).toEqual([]);mkdirSync('.gaga/editorial',{recursive:true});
  await page.screenshot({path:'.gaga/editorial/packed-integration.png',fullPage:true});
  writeFileSync('.gaga/editorial/packed-integration.json',JSON.stringify({status:'PASS',mode:'LOCAL_ONLY',publicRootCandidate:true,draftSaveReload:true,canonicalPreview:true,anonymousDenied:true,publishUnpublishOperations:0,productionWrites:0}));
});
