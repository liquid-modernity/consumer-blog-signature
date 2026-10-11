import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Single Action Runtime Architecture - No duplicate components', () => {
  const componentsDir = 'src/components/frame';
  const files = fs.readdirSync(componentsDir);
  const actionRuntimes = files.filter(f => f.toLowerCase().includes('actionruntime'));
  assert.equal(actionRuntimes.length, 1, 'Only ONE ActionRuntime component must exist');
});

test('Action Runtime & Actions Config integrity', () => {
  const actionsConfig = fs.readFileSync('src/config/actions.ts', 'utf8');
  assert.ok(actionsConfig.includes("'smart-back'"), 'Must contain smart-back action');
  assert.ok(actionsConfig.includes("'share-page'"), 'Must contain share-page action');
  assert.ok(actionsConfig.includes("'toggle-focus-mode'"), 'Must contain toggle-focus-mode action');
  assert.ok(actionsConfig.includes("'highlight'"), 'Must contain highlight action');
  assert.ok(actionsConfig.includes("'speak'"), 'Must contain speak action');
  assert.ok(actionsConfig.includes("'toggle-reader-preferences'"), 'Must contain toggle-reader-preferences action');
});

test('Reader Runtime tokens and schema configuration', () => {
  const readerConfig = fs.readFileSync('src/config/reader.ts', 'utf8');
  assert.ok(readerConfig.includes('fontFamily'), 'Must include fontFamily preferences');
  assert.ok(readerConfig.includes('lineHeight'), 'Must include lineHeight preferences');
  assert.ok(readerConfig.includes('letterSpacing'), 'Must include letterSpacing preferences');
  assert.ok(readerConfig.includes('measure'), 'Must include reading measure preferences');
  assert.ok(readerConfig.includes('contrast'), 'Must include contrast mode preferences');
  assert.ok(readerConfig.includes('motion'), 'Must include motion preferences');
  assert.ok(readerConfig.includes('links'), 'Must include links appearance preferences');
});

test('Article canvas completeness & rich typography', () => {
  const articleContent = fs.readFileSync('src/pages/article.astro', 'utf8');
  assert.ok(!articleContent.includes('gaga-reading-progress-bar'), 'Legacy viewport progress bar must be removed from flagship article');
  const actionRuntime = fs.readFileSync('src/components/frame/ActionRuntime.astro', 'utf8');
  assert.ok(actionRuntime.includes('data-gaga-reading-progress'), 'Reading progress must live in Gaga Dynamic Notch Island');
  assert.ok(articleContent.includes('gaga-flagship-article__author-card'), 'Must include rich author identity');
  assert.ok(articleContent.includes('gaga-editorial-quote'), 'Must include editorial quotes');
  assert.ok(articleContent.includes('MediaCarousel'), 'Must include carousel rich media');
  assert.ok(articleContent.includes('ResponsiveImage'), 'Must include responsive hero image');
  assert.ok(articleContent.includes('VideoPlayer'), 'Must include video media player');
  assert.ok(articleContent.includes('AudioPlayer'), 'Must include audio narration player');
  assert.ok(articleContent.includes('RelatedKnowledge'), 'Must include semantic related knowledge');
  assert.ok(articleContent.includes('--gaga-article-font-family'), 'Must connect to Gaga Reader Runtime CSS tokens');
});

test('Contextual Rails separation: Navigation vs Intelligence', () => {
  const leftRail = fs.readFileSync('src/components/frame/LeftRail.astro', 'utf8');
  const rightRail = fs.readFileSync('src/components/frame/RightInfoRail.astro', 'utf8');
  assert.ok(leftRail.includes('gaga-left-rail'), 'Left rail is dedicated to navigation ("Where can I go?")');
  assert.ok(rightRail.includes('gaga-right-rail'), 'Right rail is dedicated to intelligence ("What should I know?")');
  assert.ok(!rightRail.includes('TocBlock'), 'Right Intelligence Rail must not duplicate the bottom semantic outline');
  assert.ok(rightRail.includes('SummaryBlock'), 'Right rail includes contextual summary intelligence');
});

test('Personal Reading Intelligence & Persistent Knowledge Memory', () => {
  const knowledgeCode = fs.readFileSync('src/scripts/systems/reading-knowledge.ts', 'utf8');
  assert.ok(knowledgeCode.includes('readAllHighlights'), 'Must support reading all highlights');
  assert.ok(knowledgeCode.includes('saveHighlight'), 'Must support saving highlight entities');
  assert.ok(knowledgeCode.includes('resolveContentLanguage'), 'Must provide Content Language Resolver');

  const readerEnhancements = fs.readFileSync('src/scripts/systems/reader-enhancements.ts', 'utf8');
  assert.ok(readerEnhancements.includes('initSelectionIntelligence'), 'Must provide floating selection menu');
  assert.ok(readerEnhancements.includes('restoreArticleHighlights'), 'Must support automatic highlight restoration');
  assert.ok(readerEnhancements.includes('playSelection'), 'Must support listening only selected text');
  assert.ok(readerEnhancements.includes('playArticle'), 'Must support full article reading');

  const libraryPage = fs.readFileSync('src/components/reader/SavedReadingPage.astro', 'utf8');
  assert.ok(libraryPage.includes('data-gaga-library-tab="saved"'), 'Must include Saved Articles tab');
  assert.ok(libraryPage.includes('data-gaga-library-tab="highlights"'), 'Must include Highlights tab');
  assert.ok(libraryPage.includes('data-gaga-library-tab="notes"'), 'Must include Notes tab');
  assert.ok(libraryPage.includes('data-gaga-library-tab="quotes"'), 'Must include Quotes tab');
  assert.ok(libraryPage.includes('data-gaga-library-tab="history"'), 'Must include Reading History tab');
  assert.ok(libraryPage.includes('data-gaga-highlight-jump'), 'Must support return jump back to article');
});


test('Reading Intelligence uses one runtime path without legacy component-local duplication', () => {
  const actionRuntime = fs.readFileSync('src/components/frame/ActionRuntime.astro', 'utf8');
  assert.ok(!actionRuntime.includes('SpeechSynthesisUtterance'), 'ActionRuntime must not own speech synthesis');
  assert.ok(!actionRuntime.includes('gaga:highlights:v1'), 'ActionRuntime must not own highlight persistence');
  assert.ok(!actionRuntime.includes('gaga-selection-popover'), 'ActionRuntime must not own a duplicate selection menu');
  assert.ok(actionRuntime.includes('runSiteCommand'), 'ActionRuntime must dispatch through the site command registry');

  const enhancements = fs.readFileSync('src/scripts/systems/reader-enhancements.ts', 'utf8');
  assert.ok(enhancements.includes("registerSiteCommand('highlight'"), 'Highlight command must be owned by Reader Enhancements');
  assert.ok(enhancements.includes("registerSiteCommand('speak'"), 'Speak command must be owned by Reader Enhancements');
  assert.ok(enhancements.includes('language: meta.language'), 'Highlight entities must preserve content language');
  assert.ok(enhancements.includes('textRangeForHighlight'), 'Restoration must support offset-aware text ranges');

  const continuity = fs.readFileSync('src/scripts/systems/reading-continuity.ts', 'utf8');
  assert.ok(continuity.includes("updateHighlightNote(highlight.id, '')"), 'Removing a note must preserve its highlight');
  assert.ok(continuity.includes('normalizeSpeechLang(highlight.language'), 'Library speech must follow stored content language');

  const knowledge = fs.readFileSync('src/scripts/systems/reading-knowledge.ts', 'utf8');
  assert.ok(knowledge.includes('LEGACY_HIGHLIGHT_STORAGE_KEY'), 'Legacy highlights must migrate into the unified knowledge store');
  assert.ok(knowledge.includes('language?: string'), 'Highlight schema must carry content language metadata');
});


test('Gaga Dynamic Notch Island + Dynamic Outline Peek signature', () => {
  const actionRuntime = fs.readFileSync('src/components/frame/ActionRuntime.astro', 'utf8');
  const actionStyles = fs.readFileSync('src/styles/partials/_action-island.scss', 'utf8');
  const outline = fs.readFileSync('src/components/frame/ArticleOutlinePeek.astro', 'utf8');
  const outlineStyles = fs.readFileSync('src/styles/partials/_outline-peek.scss', 'utf8');
  const systems = fs.readFileSync('src/config/systems.ts', 'utf8');
  const appFrame = fs.readFileSync('src/components/frame/AppFrameBase.astro', 'utf8');
  const experience = fs.readFileSync('src/config/experience.ts', 'utf8');
  const dockStyles = fs.readFileSync('src/styles/partials/_gaga-dock.scss', 'utf8');

  assert.ok(actionRuntime.includes('data-gaga-action-runtime') && actionRuntime.includes("i18nLabel('actionIsland.label')"), 'ActionRuntime must project the localized top-center Dynamic Notch Island');
  assert.ok(actionRuntime.includes('data-gaga-action-island-toggle'), 'Island must have an explicit expand/collapse control');
  assert.ok(actionRuntime.includes('data-gaga-action-runtime-live'), 'Island must expose one live state surface for speech/status');
  assert.ok(actionStyles.includes('var(--gaga-safe-area-top)'), 'Island must be safe-area aware');
  assert.ok(actionStyles.includes('--gaga-action-progress'), 'Island must render reading progress from one progress state');
  assert.ok(actionRuntime.includes('gaga-action-runtime__perimeter-progress'), 'Notch v2 must render perimeter reading progress');
  assert.ok(actionStyles.includes('border-radius: 0 0'), 'Notch v2 must attach visually to the top viewport edge');
  assert.ok(outline.includes('data-gaga-outline-current-index'), 'Outline Peek must expose semantic section position');
  assert.ok(outline.includes('data-gaga-outline-sheet-current-label'), 'Expanded outline must expose the current semantic section label');
  assert.ok(!outline.includes('data-gaga-outline-close'), 'Outline v2 must not use a legacy close button');
  assert.ok(!outline.includes('gaga-outline-peek__head'), 'Outline v2 must not restore the legacy visible utility header');
  assert.ok(outline.includes('data-gaga-depth="expanded"'), 'Outline v2 must support progressive sheet depth');
  assert.ok(!outline.includes('gaga-outline-progress'), 'Bottom Outline Peek must not duplicate the numeric reading progress bar');
  assert.ok(outlineStyles.includes('inset-inline-start: 50%'), 'Outline Peek must anchor bottom-center');
  assert.ok(systems.includes("enabledModes: ['mobile', 'tablet-mini', 'tablet-large', 'desktop']"), 'Outline Peek must be available across all device classes');
  assert.ok(appFrame.includes('showGagaDock'), 'Layout must resolve Gaga Dock coexistence from the surface profile');
  assert.ok(!fs.existsSync('src/components/navigation/NotchIslandAction.astro'), 'Legacy parallel notch action component must be removed');
  assert.ok(fs.existsSync('src/components/frame/GagaDock.astro'), 'Gaga Dock v1 must replace the legacy mobile dock');
  assert.ok(!fs.existsSync('src/components/frame/MobileDock.astro'), 'Legacy MobileDock component must be removed');
  assert.ok(fs.existsSync('src/config/experience.ts'), 'Surface behavior must be centralized in the experience contract');
  assert.ok(experience.includes('resolveExperienceContext') && experience.includes('surfaces:'), 'Experience contract must own context resolution and surface policy');
  assert.ok(experience.includes("articleDock: 'hidden'"), 'Immersive article mode must suppress Gaga Dock');
  assert.ok(dockStyles.includes('inset-inline-start: 50%'), 'Gaga Dock must be a compact contextual workspace surface, not a full-width legacy nav bar');
});

test('Human Behaviour Algorithms & Algorithmic Self-Healing Diagnostic HUD', () => {
  const behaviourCode = fs.readFileSync('src/scripts/systems/reading-behaviour.ts', 'utf8');
  assert.ok(behaviourCode.includes('SKIMMING'), 'Must classify SKIMMING behavior state');
  assert.ok(behaviourCode.includes('DEEP_READING'), 'Must classify DEEP_READING behavior state');
  assert.ok(behaviourCode.includes('calculateVisibleWords'), 'Must calculate words in viewport');
  assert.ok(behaviourCode.includes('smoothedVelocity'), 'Must track smoothed scroll velocity');

  const hudCode = fs.readFileSync('src/scripts/systems/diagnostic-hud.ts', 'utf8');
  assert.ok(hudCode.includes('detectHorizontalOverflowElements'), 'Must detect horizontal overflow');
  assert.ok(hudCode.includes('selfHealLayoutOverflow'), 'Must provide self-healing for overflow');
  assert.ok(hudCode.includes('selfHealTocAlignment'), 'Must provide self-healing for TOC alignment');
  assert.ok(hudCode.includes('toggleDiagnosticHud'), 'Must provide toggleable diagnostic overlay');

  const scrollCode = fs.readFileSync('src/scripts/systems/reading-scroll.ts', 'utf8');
  assert.ok(scrollCode.includes('getUnifiedScrollMetrics'), 'Must provide unified scroll metrics');
});
