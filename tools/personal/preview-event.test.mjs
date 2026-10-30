import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import ts from'typescript';
// Execute the actual adapter helper; no parallel implementation or private Engine import.
const source=ts.createSourceFile('preview.ts',readFileSync('src/scripts/systems/information-surface.ts','utf8'),ts.ScriptTarget.Latest,true);
const fn=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='snapshotPreviewEvent');assert.ok(fn);
const code=ts.transpileModule(fn.getText(source),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {snapshotPreviewEvent}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('native delayed event loses its path; preview adapter retains the real dispatch path',async()=>{
 const target=new EventTarget(),event=new Event('pointerover');let snapshot,path;
 target.addEventListener('pointerover',e=>{path=e.composedPath();snapshot=snapshotPreviewEvent(e);});target.dispatchEvent(event);
 assert.deepEqual(event.composedPath(),[],'Reproduce native post-dispatch path clearing');assert.deepEqual(path,[target]);
 await new Promise(r=>setTimeout(r,0));assert.deepEqual(snapshot.composedPath(),path);assert.equal(snapshot.target,target);assert.equal(snapshot.type,event.type);
});
test('forwarded snapshot retains standard bound Event methods and pointer data',()=>{
 const event=new Event('pointerover',{cancelable:true});Object.defineProperties(event,{pointerType:{value:'mouse'},clientX:{value:42},relatedTarget:{value:null}});
 const snapshot=snapshotPreviewEvent(event);assert.equal(snapshot.pointerType,'mouse');assert.equal(snapshot.clientX,42);assert.equal(snapshot.relatedTarget,null);snapshot.preventDefault();assert.equal(event.defaultPrevented,true);
 const adapter=readFileSync('src/scripts/systems/information-surface.ts','utf8');assert.ok(adapter.includes('invoke(listener,delayedEvent)'));assert.ok(adapter.includes('intentTarget.contains(related)'));
});
