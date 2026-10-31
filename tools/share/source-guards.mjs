import assert from 'node:assert/strict';
export const selectionImport="import { openSuperShare, shareSelectionIsCurrent } from './super-share';\n";
export const selectionHandler=" menu.querySelector('[data-gaga-action=\"selection-super-share\"]')?.addEventListener('click',event=>{event.stopPropagation();if(shareSelectionIsCurrent(c)){closeSelectionMenu();openSuperShare({selection:c.text,anchor:c.block.id||undefined,target:c.block});}});\n";
export const selectionDisclosure=" menu.querySelector('details')?.addEventListener('toggle',()=>{if(menu.isConnected)placeSurface(menu,c.range.getBoundingClientRect());});\n";
// Exclude only this additive entry hook when retaining the historical annotation-controller proof.
export function stripSuperShareSelection(source){if(!source.includes(selectionImport)){assert.ok(!source.includes('openSuperShare'));return source;}for(const block of [selectionImport,selectionHandler,selectionDisclosure])assert.equal(source.split(block).length,2,'Exactly one validated Super Share selection entry');return source.replace(selectionImport,'').replace(selectionHandler,'').replace(selectionDisclosure,'');}
