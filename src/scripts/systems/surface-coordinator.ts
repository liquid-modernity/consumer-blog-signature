import { createSurfaceCoordinatorCapability } from '@gaga/engine-web/runtime/surface-coordinator';
import { getConfiguredLeftRailState, supportsGagaDock } from '../../config/systems';
import {
  requestFocusMode,
  requestLeftRail,
  requestOutline,
  requestReaderPanel
} from '@gaga/engine-web/runtime/events';
import { closeCollapsedNavChildPanel, collapsedNavChildPanelIsOpen } from './collapsed-nav';
import { closeContextSurface, contextSurfaceIsOpen } from './context-surface';

let initialized = false;

function outlineIsOpen() {
  return document.querySelector<HTMLElement>('[data-gaga-outline-peek]')?.dataset.gagaState === 'open';
}

function readerIsOpen() {
  const panel = document.querySelector<HTMLElement>('[data-gaga-reader-panel]');
  return panel?.dataset.gagaState === 'open' || panel?.hasAttribute('open') === true;
}

function compactLeftRailIsOpen() {
  if (!supportsGagaDock(document.documentElement.dataset.gagaLayout)) return false;
  return document.querySelector<HTMLElement>('[data-gaga-left-rail]')?.dataset.gagaState === 'drawer';
}

function persistentCollapsedLeftRailIsExpanded() {
  const mode = document.documentElement.dataset.gagaLayout;
  if (getConfiguredLeftRailState(mode) !== 'collapsed') return false;
  return document.querySelector<HTMLElement>('[data-gaga-left-rail]')?.dataset.gagaState === 'expanded';
}

function focusModeIsOpen() {
  return document.body.dataset.gagaFocusMode === 'on';
}

export function initSurfaceCoordinator() {
  if (initialized) return;
  initialized = true;

  createSurfaceCoordinatorCapability({
    surfaces: [
      {
        isOpen: collapsedNavChildPanelIsOpen,
        close: (detail) => closeCollapsedNavChildPanel({ source: detail.source })
      },
      {
        id: 'context-surface',
        priority: 40,
        isOpen: contextSurfaceIsOpen,
        close: () => closeContextSurface()
      },
      {
        isOpen: outlineIsOpen,
        close: (detail) => requestOutline({ action: 'close', source: detail.source ?? 'close-top-surface', x: detail.x, y: detail.y, target: detail.target })
      },
      {
        isOpen: readerIsOpen,
        close: (detail) => requestReaderPanel({ action: 'close', source: detail.source ?? 'close-top-surface', x: detail.x, y: detail.y, target: detail.target })
      },
      {
        isOpen: compactLeftRailIsOpen,
        close: (detail) => requestLeftRail({ action: 'close', source: detail.source ?? 'close-top-surface', x: detail.x, y: detail.y, target: detail.target })
      },
      {
        isOpen: persistentCollapsedLeftRailIsExpanded,
        close: (detail) => requestLeftRail({ action: 'close', source: detail.source ?? 'close-top-surface', x: detail.x, y: detail.y, target: detail.target })
      },
      {
        isOpen: focusModeIsOpen,
        close: (detail) => requestFocusMode({ action: 'close', source: detail.source ?? 'close-top-surface', x: detail.x, y: detail.y, target: detail.target })
      }
    ]
  });
}
