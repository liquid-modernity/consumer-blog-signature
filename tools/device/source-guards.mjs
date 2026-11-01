import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const deltas=JSON.parse(readFileSync(new URL('./runtime-deltas.json',import.meta.url)));
// Only the exact viewport, hybrid-pointer and draft-preservation edits may cross historical byte guards.
export function stripDeviceRuntime(path,source){for(const {before,after} of [...(deltas[path]??[])].reverse()){assert.equal(source.split(after).length,2,'Exactly one reviewed multi-device edit: '+path);source=source.replace(after,before);}return source;}
