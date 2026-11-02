import {stripProductionTraceRetention} from './hierarchy/release-browser-guards.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as motion from '../src/config/signature-motion.mjs';
import * as share from '../src/config/super-share.mjs';
import {personalCanonicalOrigin} from '../src/config/personal-state.mjs';
const baseline='1edf5c63117e6529c4460ddfb9c34c9a0b31e03e';
const before=path=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'});
// Evaluate only the pinned, formerly admitted pure module as a test oracle.
function oracle(path,names,bindings={}){const source=before(path).replace(/^import[^\n]*\n/gm,'').replace(/\bexport (?=function|const)/g,'');return Function(...Object.keys(bindings),source+'\nreturn {'+names.join(',')+'};')(...Object.values(bindings));}
export function assertExtractedMotionIntegrity(){
 const names=['initialScrollIntent','resolveScrollIntent','signatureVisibility','notchGeometry','signatureReducedMotion','signatureMotion'];const old=oracle('src/config/signature-motion.mjs',names);
 const {geometry,...policy}=motion.signatureMotion;assert.deepEqual(policy,old.signatureMotion,'Instance motion values remain frozen');
 for(const start of [0,100,900,4000]){let previous=old.initialScrollIntent(start);assert.deepEqual(motion.initialScrollIntent(start),previous);for(let i=0;i<250;i++){const input={position:Math.max(0,start+(i%2?i*13:-i*3)),viewport:800,contentEnd:5000,active:i%7!==0};assert.deepEqual(motion.resolveScrollIntent(previous,input),old.resolveScrollIntent(previous,input));previous=old.resolveScrollIntent(previous,input);}}
 for(const viewport of [320,360,390,768,1024,1440])for(const state of ['collapsed','peek','expanded'])for(const actions of [0,5,10])for(const flags of [{},{search:true},{audio:true},{panel:true}]){const input={state,actions,viewport,...flags};assert.deepEqual(motion.notchGeometry(input),old.notchGeometry(input));}
 for(const previous of ['visible','pinned','retracted'])for(const signal of ['hold','retract','reveal'])for(const pinned of [true,false])assert.equal(motion.signatureVisibility(previous,signal,pinned),old.signatureVisibility(previous,signal,pinned));
}
export function assertExtractedShareIntegrity(){
 const names=['resolveShareContext','shareSourceUrl','shareCopy','sharePayload','shareActions','textCard','posterInput','wrapPosterText','shareOutcomeMessage'];const old=oracle('src/features/super-share/model.mjs',names,{personalCanonicalOrigin});
 const input={contentIdentity:'fixture',title:'Exact source',canonicalUrl:personalCanonicalOrigin+'/publications/fixture',author:'Fixture Author',date:'2026-10-31'};
 for(const extra of [{},{selection:' Exact “fragment”.\nSecond line.',anchor:'fixture-heading'},{selection:'x'.repeat(601)},{date:'invalid'},{author:undefined}]){const a=share.resolveShareContext({...input,...extra}),b=old.resolveShareContext({...input,...extra});assert.deepEqual(a,b);for(const kind of ['link','rich','quote','reference','unknown'])assert.equal(share.shareCopy(a,kind),old.shareCopy(b,kind));for(const method of ['sharePayload','textCard','posterInput','shareActions','shareSourceUrl'])assert.deepEqual(share[method](a),old[method](b));}
 for(const status of ['shared','copied','cancelled','unsupported','failed','unknown'])assert.equal(share.shareOutcomeMessage({status}),old.shareOutcomeMessage({status}));
}
export function assertExtractionDependencyDelta(file){
 const previous=JSON.parse(before(file)),current=JSON.parse(readFileSync(file));
 if(file==='package.json'){for(const name of ['@gaga/arsenal','@gaga/arsenal-contracts'])previous.dependencies[name]=current.dependencies[name];}
 else for(const name of ['@gaga/arsenal','@gaga/arsenal-contracts']){previous.packages[''].dependencies[name]=current.packages[''].dependencies[name];previous.packages['node_modules/'+name]=current.packages['node_modules/'+name];}
 assert.deepEqual(current,previous,'Only two admitted Arsenal dependency identities may change');
}

export function readPublicModule(specifier){return readFileSync(new URL(import.meta.resolve(specifier)),'utf8');}
export function assertFrozenInput(path,current,expected){
 if(path==='package.json'||path==='package-lock.json')return assertExtractionDependencyDelta(path);
 if(path==='src/config/signature-motion.mjs')return assertExtractedMotionIntegrity();
 if(path==='.github/workflows/deploy.yml')return assert.equal(stripProductionTraceRetention(current.toString()),expected.toString(),path);
 assert.deepEqual(current,expected,path);
}
