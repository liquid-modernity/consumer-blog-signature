import { createQuickActionsStateCapability, type QuickActionElement } from '@gaga/engine-web/runtime/quick-actions-state';
import { isSavedItem } from '@gaga/engine-web/reader';
import { readArray } from '@gaga/engine-web/runtime/storage';
import { actionById, actionForCommand, isGagaActionId, type GagaAction } from '../../config/actions';
import { storageKeys, supportsGagaDock } from '../../config/systems';
import { isSameSitePath, normalizeSitePath } from '../../lib/url-semantics';

function currentPageId() {
  const frame = document.querySelector('[data-gaga-app-frame]') as HTMLElement | null;
  return frame?.dataset.gagaPageId ?? normalizeSitePath(location.pathname);
}

function isSavedCurrentPage() {
  const id = currentPageId();
  return readArray(storageKeys.saved, isSavedItem).some((item) => item.id === id);
}

function routeIsActive(action: GagaAction, href: string | null) {
  if (action.activeSource !== 'route' || !href) return false;
  return isSameSitePath(location.pathname, href, location.origin);
}

function readerIsOpen() {
  const panel = document.querySelector('[data-gaga-reader-panel]') as HTMLElement | null;
  return panel?.dataset.gagaState === 'open' || panel?.hasAttribute('open') === true;
}

function leftRailIsOpen() {
  const rail = document.querySelector('[data-gaga-left-rail]') as HTMLElement | null;
  return supportsGagaDock(document.documentElement.dataset.gagaLayout) && rail?.dataset.gagaState === 'drawer';
}

function actionIsActive(action: GagaAction) {
  if (action.activeSource === 'focus-mode') return document.body.dataset.gagaFocusMode === 'on';
  if (action.activeSource === 'reader-panel') return readerIsOpen();
  if (action.activeSource === 'left-rail-drawer') return leftRailIsOpen();
  if (action.activeSource === 'saved-current-page') return isSavedCurrentPage();
  return false;
}

function resolveActionState(el: QuickActionElement) {
  const id = el.dataset.gagaQuickAction ?? '';
  if (!isGagaActionId(id)) return null;
  const action = actionById(id);
  const commandAction = actionForCommand(el.dataset.gagaAction) ?? action;
  const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') : null;
  return {
    active: routeIsActive(action, href) || (el instanceof HTMLButtonElement && actionIsActive(commandAction)),
    kind: commandAction.kind
  };
}

export function initQuickActionsState() {
  createQuickActionsStateCapability({
    resolveActionState,
    getObservationTargets: () => [
      document.body,
      document.querySelector('[data-gaga-reader-panel]'),
      document.querySelector('[data-gaga-left-rail]')
    ].filter((node): node is Element => !!node)
  });
}
