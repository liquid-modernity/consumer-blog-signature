import { createWebCommandRegistry, type WebCommandInputSource } from '@gaga/engine-web/runtime/command-registry';
import {
  requestCloseTopSurface,
  requestFocusMode,
  requestLeftRail,
  requestOutline,
  requestReaderPanel,
  requestToast
} from '@gaga/engine-web/runtime/events';
import { actionForCommand, type GagaActionCommand } from '../../config/actions';
import { supportsGagaDock } from '../../config/systems';
import { isSameSitePath } from '../../lib/url-semantics';

type SiteCommandHandler = (detail: SiteCommandDetail) => boolean | void | Promise<boolean | void>;

export type SiteCommandDetail = {
  source?: string;
  target?: HTMLElement | null;
  pointer?: { x?: number; y?: number };
};

const commandRegistry = createWebCommandRegistry();

function commandId(command: GagaActionCommand) {
  return `gaga.command.site.${command}`;
}

function inputSource(detail: SiteCommandDetail): WebCommandInputSource {
  const source = detail.source ?? "programmatic";
  if (source === "keyboard" || source === "mouse" || source === "pointer" || source === "touch" || source === "pen" || source === "agent") return source;
  return "programmatic";
}

function viewportPoint(fallbackY = 24) {
  return {
    x: window.innerWidth / 2,
    y: fallbackY
  };
}

function canUseTarget(element: HTMLElement | null): element is HTMLElement {
  if (!element || !element.isConnected) return false;
  if (element.hasAttribute('disabled') || element.closest('[inert], [aria-hidden="true"]')) return false;
  if (element.closest('[hidden]')) return false;
  if (element.getClientRects().length === 0) return false;
  return true;
}

export function activeCommandTarget(command: GagaActionCommand) {
  return activeSelectorTarget(`[data-gaga-action="${command}"]`);
}

export function activeSelectorTarget(selector: string) {
  return [...document.querySelectorAll<HTMLElement>(selector)].find(canUseTarget) ?? null;
}

export function triggerActiveCommandTarget(command: GagaActionCommand) {
  return triggerActiveSelector(`[data-gaga-action="${command}"]`);
}

export function triggerActiveSelector(selector: string) {
  const target = activeSelectorTarget(selector);
  if (!target) return false;
  target.click();
  return true;
}

function openSearch() {
  const action = actionForCommand('open-search');
  const input = document.querySelector<HTMLInputElement>('[data-gaga-search-input]');
  if (input && canUseTarget(input) && action?.href && isSameSitePath(location.pathname, action.href, location.origin)) {
    input.focus({ preventScroll: true });
    return true;
  }
  const trigger = document.querySelector<HTMLAnchorElement>('[data-gaga-search-trigger]');
  if (trigger?.href && canUseTarget(trigger)) window.location.href = trigger.href;
  else window.location.href = action?.href ?? '/search';
  return true;
}

function shareCurrentPage(pointer: { x?: number; y?: number }) {
  const shareData = {
    title: document.title,
    text: document.querySelector('meta[name="description"]')?.getAttribute('content') || document.title,
    url: window.location.href
  };
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
    navigator.share(shareData)
      .then(() => requestToast({ message: 'Tautan berhasil dibagikan', tone: 'ok', x: pointer.x, y: pointer.y }))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          requestToast({ message: 'Berbagi dibatalkan', tone: 'info', x: pointer.x, y: pointer.y });
        }
      });
  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href)
      .then(() => requestToast({ message: 'Tautan disalin ke papan klip', tone: 'ok', x: pointer.x, y: pointer.y }))
      .catch(() => requestToast({ message: 'Gagal menyalin tautan', tone: 'warn', x: pointer.x, y: pointer.y }));
  }
  return true;
}

function smartBack(pointer: { x?: number; y?: number }) {
  if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
    requestToast({ message: 'Kembali ke halaman sebelumnya', tone: 'info', x: pointer.x, y: pointer.y });
    window.history.back();
  } else {
    requestToast({ message: 'Kembali ke beranda', tone: 'info', x: pointer.x, y: pointer.y });
    window.location.assign('/');
  }
  return true;
}

function resetKnowledgeGraph(pointer: { x?: number; y?: number }) {
  window.dispatchEvent(new CustomEvent('gaga:graph:reset'));
  requestToast({ message: 'Tampilan graf di-reset', tone: 'ok', x: pointer.x, y: pointer.y });
  return true;
}

function runBuiltInCommand(command: GagaActionCommand, detail: SiteCommandDetail) {
  const pointer = detail.pointer ?? viewportPoint();
  if (command === 'close-top-surface') {
    requestCloseTopSurface({ source: detail.source ?? 'site-command', x: pointer.x ?? window.innerWidth / 2, y: pointer.y ?? window.innerHeight / 2 });
    return true;
  }
  if (command === 'open-search') return openSearch();
  if (command === 'share-page') return shareCurrentPage(pointer);
  if (command === 'smart-back') return smartBack(pointer);
  if (command === 'reset-knowledge-graph') return resetKnowledgeGraph(pointer);
  if (command === 'toggle-focus-mode') {
    requestFocusMode({ action: 'toggle', source: detail.source ?? 'site-command', x: pointer.x ?? window.innerWidth / 2, y: pointer.y ?? 24 });
    return true;
  }
  if (command === 'toggle-reader-preferences') {
    requestReaderPanel({
      action: 'toggle',
      source: detail.source ?? 'site-command',
      x: pointer.x ?? window.innerWidth / 2,
      y: pointer.y ?? (supportsGagaDock(document.documentElement.dataset.gagaLayout) ? window.innerHeight - 72 : 24)
    });
    return true;
  }
  if (command === 'toggle-left-rail') {
    requestLeftRail({ action: 'toggle', source: detail.source ?? 'site-command', x: pointer.x ?? 24, y: pointer.y ?? window.innerHeight / 2 });
    return true;
  }
  if (command === 'toggle-outline') {
    requestOutline({
      action: 'toggle',
      source: detail.source ?? 'site-command',
      x: pointer.x ?? window.innerWidth / 2,
      y: pointer.y ?? (supportsGagaDock(document.documentElement.dataset.gagaLayout) ? window.innerHeight - 72 : 24)
    });
    return true;
  }
  return false;
}

export function registerSiteCommand(command: GagaActionCommand, handler: SiteCommandHandler) {
  const id = commandId(command);
  commandRegistry.unregister(id);
  commandRegistry.register({
    id,
    sideEffect: 'LOCAL_STATE',
    execute(detail: SiteCommandDetail) {
      return handler(detail);
    }
  });
}

export function runSiteCommand(command: GagaActionCommand, detail: SiteCommandDetail = {}) {
  const result = commandRegistry.dispatch(commandId(command), detail, { inputSource: inputSource(detail) });
  if (result instanceof Promise) {
    void result;
    return true;
  }
  if (result.ok) return result.value !== false;
  if (result.code !== 'GAGA_COMMAND_NOT_FOUND') return true;
  if (runBuiltInCommand(command, detail)) return true;

  // Avoid recursively clicking the same projection when its runtime handler
  // has not registered yet. Programmatic callers can still fall back to an
  // active projection elsewhere on the page.
  if (detail.target?.matches(`[data-gaga-action="${command}"]`)) return false;
  return triggerActiveCommandTarget(command);
}
