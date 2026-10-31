import test from 'node:test';
import assert from 'node:assert/strict';
import {signatureMotion as p,initialScrollIntent,resolveScrollIntent,signatureVisibility,notchGeometry,signatureReducedMotion} from '../../src/config/signature-motion.mjs';
const move=(s,y,extra={})=>resolveScrollIntent(s,{position:y,viewport:800,contentEnd:5000,...extra});
test('initial, top and programmatic anchor navigation remain visible',()=>{
 assert.equal(initialScrollIntent().signal,'reveal');assert.equal(move(initialScrollIntent(),20).signal,'reveal');assert.equal(move(initialScrollIntent(),1200,{active:false}).signal,'reveal');
});
test('accumulated downward travel retracts, upward reveal uses smaller threshold',()=>{
 let s=initialScrollIntent(100);s=move(s,150);assert.equal(s.signal,'hold');s=move(s,196);assert.equal(s.signal,'retract');s=move(s,186);assert.equal(s.signal,'hold');s=move(s,172);assert.equal(s.signal,'reveal');
});
test('jitter does not oscillate; slow cumulative travel remains detectable',()=>{
 let s=initialScrollIntent(200);for(const y of [201,199,202,200]){s=move(s,y);assert.equal(s.signal,'hold');}
 for(let y=201;y<=296;y++)s=move(s,y);assert.equal(s.direction,1);assert.equal(s.travel,0);
});
test('direction changes reset travel and hysteresis preserves retraction',()=>{
 let s=move(initialScrollIntent(200),280);s=move(s,270);assert.equal(s.travel,10);assert.equal(signatureVisibility('retracted',s.signal,false),'retracted');assert.equal(move(s,256).signal,'reveal');
});
test('actual content end reveals even when trailing page chrome remains',()=>{
 assert.equal(move(initialScrollIntent(2000),2200,{contentEnd:3000}).signal,'reveal');assert.equal(move(initialScrollIntent(2000),2200,{contentEnd:6000}).signal,'retract');
});
test('independent active pins retain controls and release visible',()=>{
 assert.equal(signatureVisibility('visible','retract',true),'pinned');assert.equal(signatureVisibility('pinned','hold',false),'visible');assert.equal(signatureVisibility('retracted','hold',false),'retracted');assert.equal(signatureVisibility('visible','retract',false),'retracted');
});
test('semantic geometry covers compact context search audio panel with deterministic bounds',()=>{
 for(const [input,state] of [[{},'compact'],[{state:'peek'},'context'],[{state:'peek',search:true},'search'],[{audio:true},'audio'],[{panel:true},'panel']]){const a=notchGeometry(input);assert.equal(a.geometry,state);assert.deepEqual(notchGeometry(input),a);}
});
test('narrow overflow retains bounded primary commands and viewport safe geometry',()=>{
 for(const viewport of [320,360,390,768,1440]){const g=notchGeometry({state:'peek',viewport,actions:10});assert.ok(g.min<=g.max);assert.ok(g.max<=viewport-p.margin*2);assert.equal(g.overflow,10-g.capacity);}
});
test('OS and existing Reader reduced motion are additive, functionality unaffected',()=>{
 assert.equal(signatureReducedMotion(true,'system'),true);assert.equal(signatureReducedMotion(false,'reduced'),true);assert.equal(signatureReducedMotion(false,'system'),false);assert.equal(signatureVisibility('visible','retract',false),'retracted');
});
