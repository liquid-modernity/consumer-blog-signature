import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assertExtractedMotionIntegrity,assertExtractedShareIntegrity,readPublicModule} from '../reference-extraction-equivalence.mjs';
import {projectNotchContext} from '@gaga/arsenal/experience';
const baseline='1edf5c63117e6529c4460ddfb9c34c9a0b31e03e',read=p=>readFileSync(p,'utf8');
test('extracted motion and geometry remain exactly equivalent to the admitted application policy',()=>assertExtractedMotionIntegrity());
test('extracted share identity, payload, card and outcome semantics preserve admitted behavior',()=>assertExtractedShareIntegrity());
test('the package token primitive consumes unchanged instance appearance values',()=>{
 const path='src/styles/partials/_contextual-surfaces.scss',before=execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'}),current=read(path);
 assert.ok(current.startsWith("@use '@gaga/arsenal/experience.scss';"));assert.equal(current.replace(/^@use[^\n]*\n/,''),before.slice(0,before.indexOf('[data-gaga-context-surface] {')));
 const primitive=readFileSync(new URL(import.meta.resolve('@gaga/arsenal/experience.scss')),'utf8').replace('width:var(--gaga-context-icon-size,16px); min-width:var(--gaga-context-icon-size,16px); height:var(--gaga-context-icon-size,16px);','width:16px; min-width:16px; height:16px;').replace('min-block-size:var(--gaga-context-target-size,44px); min-inline-size:var(--gaga-context-target-size,44px);','min-block-size:44px; min-inline-size:44px;');assert.equal(primitive,before.slice(before.indexOf('[data-gaga-context-surface] {')));
});
test('Notch continuity preserves capability precedence, pin context and optional title',()=>{
 for(const state of ['collapsed','micro','peek','expanded'])for(let flags=0;flags<128;flags++){
  const [shareOpen,readerOpen,readerClosing,audioOpen,searchOpen,informationOpen,h1Visible]=Array.from({length:7},(_,i)=>!!(flags&(1<<i)));
  const capability=shareOpen?'share':readerOpen&&!readerClosing?'reader':audioOpen?'audio':searchOpen?'search':informationOpen?'information':state==='expanded'?'navigation':'';
  assert.deepEqual(projectNotchContext({state,shareOpen,readerOpen,readerClosing,audioOpen,searchOpen,informationOpen,h1Visible}),{capability,contextHidden:state==='collapsed'||state==='micro'||['share','reader','audio','information'].includes(capability),systemHidden:state!=='expanded'||!!capability&&capability!=='navigation',titleHidden:h1Visible||!!capability,level:state==='expanded'?'2':state==='peek'?'1':'0'});
 }
 assert.ok(read('src/scripts/systems/notch.ts').includes('projectNotchContext'));
});
test('application consumes public implementations and removes superseded copies',()=>{
 for(const path of ['src/features/search/model.mjs','src/features/local-navigation/model.mjs','src/features/personal-presence/model.mjs','src/features/super-share/model.mjs','src/config/contextual-surfaces.mjs'])assert.equal(existsSync(path),false,path);
 for(const specifier of ['site','application','experience','search','share','presence'])assert.doesNotMatch(readPublicModule('@gaga/arsenal/'+specifier),/consumer-blog|PakRPP|ratriatra|from ['"][^'"]*(?:emdash|cms\/)|\b(?:localStorage|sessionStorage|document|navigator)\s*\./,specifier);
 execFileSync(process.execPath,['tools/reference/dead-imports.mjs','--verify-removed']);
});
test('personal data, CMS authority, source content and deployment ownership are untouched',()=>{
 for(const path of ['src/config/personal-state.mjs','src/lib/personal-state.ts','src/config/reader.ts','src/scripts/systems/saved-reading.ts','src/scripts/systems/reading-knowledge.ts','src/scripts/systems/reader-preferences.ts','cms/package.json','cms/package-lock.json','content/emdash/published.json','content/emdash/published-receipt.json','content-release.json','gaga.app.json','wrangler.jsonc'])assert.equal(read(path),execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'}),path);
});
