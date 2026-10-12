import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const policy = JSON.parse(read('architecture/rail-interaction-policy.json'));

if (policy.schema !== 'gaga.rail-interaction-policy.v1') {
  fail('invalid rail interaction policy schema');
}

for (const file of [
  'src/scripts/systems/rail-preview.ts',
  'src/styles/partials/_rail-polish.scss',
  'src/scripts/systems/context-surface.ts'
]) {
  if (!fs.existsSync(file)) fail(`missing rail polish source: ${file}`);
}

const preview = read('src/scripts/systems/rail-preview.ts');
for (const marker of [
  "(hover: hover) and (pointer: fine)",
  "openDelayMs = 120",
  "closeDelayMs = 220",
  "event.key === 'Escape'",
  "focusin"
]) {
  if (!preview.includes(marker)) fail(`rail preview interaction marker missing: ${marker}`);
}

const left = read('src/scripts/systems/left-rail-state.ts');
const right = read('src/scripts/systems/right-rail-state.ts');
if (!left.includes('attachRailPreview')) fail('left rail does not use shared rail preview behavior');
if (!right.includes('attachRailPreview')) fail('right rail does not use shared rail preview behavior');

const context = read('src/scripts/systems/context-surface.ts');
for (const marker of [
  'requestRightRail',
  "source: 'context-surface-toggle'",
  'MutationObserver(syncTriggerState)',
  'desktopContextExpanded'
]) {
  if (!context.includes(marker)) fail(`desktop Notch/context sync marker missing: ${marker}`);
}

const rightRail = read('src/components/frame/RightInfoRail.astro');
if (!rightRail.includes('data-gaga-context-richness')) {
  fail('right rail context richness contract missing');
}

const styles = read('src/styles/partials/_rail-polish.scss');
for (const marker of [
  "data-gaga-state='collapsed'",
  "data-gaga-hover-expanded='true'",
  'bp.$tablet-mini-min',
  'bp.$mobile-max',
  'prefers-reduced-motion'
]) {
  if (!styles.includes(marker)) fail(`responsive rail polish marker missing: ${marker}`);
}

const tokens = read('src/styles/tokens.css');
for (const marker of [
  '--gaga-left-rail-width: 13.75rem',
  '--gaga-left-rail-collapsed: 3rem',
  '--gaga-right-rail-width: 15.5rem',
  '--gaga-right-rail-collapsed: 3rem'
]) {
  if (!tokens.includes(marker)) fail(`calibrated rail token missing: ${marker}`);
}


const contextSource = read('src/scripts/systems/context-surface.ts');
if (contextSource.includes("'expand'")) {
  fail('context surface must use engine SurfaceCommand values; use open/collapse instead of expand');
}
if (!contextSource.includes("const action = surface.dataset.gagaState === 'expanded' ? 'collapse' : 'open'")) {
  fail('desktop context toggle must map expanded -> collapse and collapsed -> open');
}

if (failures.length) {
  console.error('GAGA rail interaction audit FAILED');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log('GAGA rail interaction audit OK');
console.log('✓ calibrated desktop rail geometry');
console.log('✓ delayed fine-pointer hover previews + immediate keyboard preview');
console.log('✓ Escape closes transient rail preview');
console.log('✓ Dynamic Notch context trigger toggles desktop right rail');
console.log('✓ tablet-mini side sheet + mobile bottom sheet');
console.log('✓ collapsed right rail no longer leaks its full content');
