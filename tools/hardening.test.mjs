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
  assert.ok(articleContent.includes('gaga-reading-progress-bar'), 'Must include reading progress bar');
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
  assert.ok(rightRail.includes('TocBlock') || rightRail.includes('outlineItems'), 'Right rail includes outline items');
  assert.ok(rightRail.includes('SummaryBlock'), 'Right rail includes summary snippet');
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
