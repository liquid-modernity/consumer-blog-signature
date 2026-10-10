import { onRuntimeEvent } from '@gaga/engine-web/runtime/events';

const groupSelector = '[data-gaga-nav-group]';
const triggerSelector = '[data-gaga-nav-group-trigger]';
const panelSelector = '[data-gaga-nav-child-panel]';

let initialized = false;

function leftRail() {
  return document.querySelector<HTMLElement>('[data-gaga-left-rail]');
}

function isCollapsedRail() {
  return leftRail()?.dataset.gagaState === 'collapsed';
}

function groups() {
  const rail = leftRail();
  return rail ? [...rail.querySelectorAll<HTMLElement>(groupSelector)] : [];
}

function groupParts(group: HTMLElement) {
  return {
    trigger: group.querySelector<HTMLElement>(triggerSelector),
    panel: group.querySelector<HTMLElement>(panelSelector)
  };
}

function setPanelState(group: HTMLElement, expanded: boolean, restoreFocus = false) {
  const { trigger, panel } = groupParts(group);
  if (!trigger || !panel) return;
  group.classList.toggle('gaga-is-expanded', expanded);
  trigger.setAttribute('aria-expanded', String(expanded));
  const activeElement = document.activeElement;
  panel.hidden = !expanded;
  panel.toggleAttribute('inert', !expanded);
  if (!expanded && restoreFocus && activeElement instanceof HTMLElement && panel.contains(activeElement)) {
    trigger.focus({ preventScroll: true });
  }
}

function closePanels(except?: HTMLElement) {
  for (const group of groups()) {
    if (group !== except) setPanelState(group, false);
  }
}

export function collapsedNavChildPanelIsOpen() {
  return groups().some((group) => group.classList.contains('gaga-is-expanded'));
}

export function closeCollapsedNavChildPanel(detail: { source?: string } = {}) {
  const activeGroup = groups().find((group) => group.classList.contains('gaga-is-expanded'));
  if (!activeGroup) return false;
  setPanelState(activeGroup, false, detail.source === 'keyboard');
  return true;
}

function syncCollapsedPanels() {
  for (const group of groups()) {
    const { panel } = groupParts(group);
    const activeElement = document.activeElement;
    setPanelState(group, false, activeElement instanceof HTMLElement && !!panel?.contains(activeElement));
  }
}

function onClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const trigger = target.closest<HTMLElement>(triggerSelector);
  if (trigger) {
    const group = trigger.closest<HTMLElement>(groupSelector);
    if (!group || !isCollapsedRail()) return;
    const expanded = !group.classList.contains('gaga-is-expanded');
    closePanels(group);
    setPanelState(group, expanded);
    return;
  }

  const openGroup = groups().find((group) => group.classList.contains('gaga-is-expanded'));
  if (openGroup && !target.closest(groupSelector)) setPanelState(openGroup, false);
}

export function initCollapsedNav() {
  if (initialized) return;
  if (!leftRail()) return;
  initialized = true;

  syncCollapsedPanels();
  document.addEventListener('click', onClick);
  onRuntimeEvent('layoutChanged', syncCollapsedPanels);
  onRuntimeEvent('leftRailCommand', syncCollapsedPanels);
}
