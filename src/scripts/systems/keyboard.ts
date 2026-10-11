import { createKeyboardCapability } from '@gaga/engine-web/runtime/keyboard';
import { keyboardActionBindings, type GagaAction } from '../../config/actions';
import { supportsGagaDock } from '../../config/systems';
import { runSiteCommand } from './site-commands';

let initialized = false;

function activeModalSurface() {
  const context = document.querySelector<HTMLElement>('[data-gaga-right-rail][data-gaga-context-surface-state="open"]');
  if (context) return context;

  const reader = document.querySelector<HTMLElement>('[data-gaga-reader-panel]');
  if (reader?.dataset.gagaState === 'open') return reader;

  const rail = document.querySelector<HTMLElement>('[data-gaga-left-rail]');
  if (supportsGagaDock(document.documentElement.dataset.gagaLayout) && rail?.dataset.gagaState === 'drawer') return rail;

  const consoleDialog = document.querySelector<HTMLDialogElement>('[data-gaga-console-dialog]');
  if (consoleDialog?.open) return consoleDialog;

  return null;
}


function handleGraphNodeKeydown(event: KeyboardEvent) {
  const target = event.target instanceof Element
    ? event.target.closest<SVGGElement>('[data-gaga-graph-node]')
    : null;
  if (!target) return false;

  if (event.key === 'Enter') {
    const href = target.dataset.gagaGraphHref;
    if (!href) return false;
    event.preventDefault();
    window.location.assign(href);
    return true;
  }

  if (event.key === ' ') {
    event.preventDefault();
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  }

  if (event.key === 'Escape') {
    const graphRoot = target.closest<HTMLElement>('[data-gaga-knowledge-graph]');
    if (!graphRoot) return false;
    event.preventDefault();
    runSiteCommand('reset-knowledge-graph', { source: 'keyboard', target: graphRoot });
    target.blur();
    return true;
  }

  return false;
}

function runAction(action: GagaAction) {
  if (!action.command) return;
  runSiteCommand(action.command, { source: 'keyboard' });
}

export function initKeyboard() {
  if (initialized) return;
  initialized = true;
  document.addEventListener('keydown', (event) => {
    if (handleGraphNodeKeydown(event)) return;

    // Check if target is editable
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    if (event.key === '[' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      runSiteCommand('toggle-left-rail', { source: 'keyboard' });
    } else if (event.key === ']' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      runSiteCommand('toggle-right-rail', { source: 'keyboard' });
    }
  });

  createKeyboardCapability<GagaAction>({
    getActiveModalSurface: activeModalSurface,
    bindings: () => {
      const modal = activeModalSurface();
      return keyboardActionBindings().filter(({ action }) => !modal || action.command === 'close-top-surface');
    },
    dispatchAction: runAction
  }).init();
}
