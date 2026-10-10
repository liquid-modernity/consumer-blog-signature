import { createPersonalHighlight } from '@gaga/engine/annotation';
import { captureSelectionTarget, createAnnotationStorage } from '@gaga/engine-web/runtime/annotation';
import { createSpokenContentCapability } from '@gaga/engine-web/runtime/spoken-content';

const ANNOTATION_KEY = 'gaga:annotations:v1';

function feedback(button: HTMLButtonElement, text: string) {
  const original = button.getAttribute('aria-label') || button.textContent || '';
  button.dataset.gagaFeedback = text;
  button.setAttribute('aria-label', text);
  window.setTimeout(() => {
    button.removeAttribute('data-gaga-feedback');
    button.setAttribute('aria-label', original);
  }, 1400);
}

export function initReaderEnhancements() {
  const article = document.querySelector<HTMLElement>('[data-gaga-article-shell]');
  if (!article) return;

  const highlightButton = article.querySelector<HTMLButtonElement>('[data-gaga-highlight-selection]');
  if (highlightButton) {
    const storage = createAnnotationStorage(ANNOTATION_KEY);
    highlightButton.addEventListener('mousedown', (event) => event.preventDefault());
    highlightButton.addEventListener('click', () => {
      const contentId = article.dataset.gagaArticleRoute || location.pathname;
      const target = captureSelectionTarget({
        contentId,
        selection: window.getSelection(),
        blockSelector: '.sl-markdown-content :is(p,li,blockquote,h2,h3,h4), [data-gaga-content-block]'
      });
      if (!target) {
        feedback(highlightButton, 'Select text first');
        return;
      }
      storage.save(createPersonalHighlight({
        id: globalThis.crypto?.randomUUID?.() || `highlight-${Date.now()}`,
        target,
        createdAt: new Date().toISOString()
      }));
      feedback(highlightButton, 'Highlight saved');
    });
  }

  const speakButton = article.querySelector<HTMLButtonElement>('[data-gaga-speak-article]');
  if (speakButton) {
    const speech = createSpokenContentCapability({ defaultLanguage: document.documentElement.lang || 'id-ID' });
    if (!speech.available) {
      speakButton.hidden = true;
    } else {
      let speaking = false;
      speakButton.addEventListener('click', () => {
        if (speaking) {
          speech.stop();
          speaking = false;
          speakButton.setAttribute('aria-pressed', 'false');
          feedback(speakButton, 'Speech stopped');
          return;
        }
        const readingSurface = article.querySelector<HTMLElement>('.sl-markdown-content') || article;
        const text = readingSurface.innerText.replace(/\s+/g, ' ').trim();
        if (!text) return;
        speaking = speech.speakBlock({ id: article.dataset.gagaArticleRoute || location.pathname, text, language: document.documentElement.lang || 'id-ID' });
        speakButton.setAttribute('aria-pressed', speaking ? 'true' : 'false');
        feedback(speakButton, speaking ? 'Speaking article' : 'Speech unavailable');
      });
    }
  }
}
