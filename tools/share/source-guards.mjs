import assert from 'node:assert/strict';
export const selectionImport="import { openSuperShare } from './super-share';\n";
export const selectionHandler=" menu.querySelector('[data-gaga-action=\"selection-super-share\"]')?.addEventListener('click',()=>{if(captureIsCurrent(c)){closeSelectionMenu();openSuperShare({selection:c.text,anchor:c.block.id||undefined,target:c.block});}});\n";
// Exclude only this additive entry hook when retaining the historical annotation-controller proof.
export function stripSuperShareSelection(source){if(!source.includes(selectionImport)){assert.ok(!source.includes('openSuperShare'));return source;}for(const block of [selectionImport,selectionHandler])assert.equal(source.split(block).length,2,'Exactly one validated Super Share selection entry');return source.replace(selectionImport,'').replace(selectionHandler,'');}
