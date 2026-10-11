import { createModalIsolationController } from '@gaga/engine-web/runtime/modal-isolation';
import { supportsGagaDock } from '../../config/systems';

type ModalIsolationOwner = string;

let activeOwner: ModalIsolationOwner | undefined;

function appFrame() {
  return document.querySelector<HTMLElement>('[data-gaga-app-frame]');
}

function frameChildren() {
  return Array.from(appFrame()?.children ?? []).filter((node): node is HTMLElement => node instanceof HTMLElement);
}

function backgroundElements() {
  const skipLink = document.querySelector<HTMLElement>('.gaga-skip-link');
  if (activeOwner === 'context-surface') {
    const frame = appFrame();
    const main = frame?.querySelector<HTMLElement>(':scope > [data-gaga-main-region]');
    const mainChildren = Array.from(main?.children ?? []).filter((node): node is HTMLElement => node instanceof HTMLElement);
    const frameSiblings = frameChildren().filter((element) => element !== main);
    return [...(skipLink ? [skipLink] : []), ...frameSiblings, ...mainChildren];
  }
  return [...(skipLink ? [skipLink] : []), ...frameChildren()];
}

const controller = createModalIsolationController({
  getBackgroundElements: backgroundElements,
  isOwnerElement(owner, element) {
    if (owner === 'reader-panel') return element.matches('[data-gaga-reader-panel]');
    if (owner === 'context-surface') return element.matches('[data-gaga-right-rail], [data-gaga-context-surface-scrim]');
    return element.matches('[data-gaga-left-rail], [data-gaga-left-rail-scrim]');
  },
  shouldRemainInert(element) {
    if (element.matches('[data-gaga-reader-panel]')) {
      return element.dataset.gagaState !== 'open' && !element.hasAttribute('open');
    }

    if (element.matches('[data-gaga-left-rail]')) {
      return supportsGagaDock(document.documentElement.dataset.gagaLayout) && element.dataset.gagaState !== 'drawer';
    }

    return false;
  }
});

export function activateModalIsolation(owner: ModalIsolationOwner) {
  activeOwner = owner;
  controller.activate(owner);
}

export function clearModalIsolation(owner?: ModalIsolationOwner) {
  controller.clear(owner);
  if (!owner || owner === activeOwner) activeOwner = undefined;
}
