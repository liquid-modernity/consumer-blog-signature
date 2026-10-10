type EntityTabId = 'profile' | 'writings';

const legacyEntityFragmentAliases = {
  'gaga-entity-profile': 'profile',
  'gaga-entity-writings': 'writings'
} satisfies Record<string, EntityTabId>;

type LegacyEntityFragmentAlias = keyof typeof legacyEntityFragmentAliases;

function isLegacyEntityFragmentAlias(value: string): value is LegacyEntityFragmentAlias {
  return Object.prototype.hasOwnProperty.call(legacyEntityFragmentAliases, value);
}

function panelFor(root: HTMLElement, id: EntityTabId) {
  return root.querySelector<HTMLElement>(`[data-gaga-entity-panel="${id}"]`);
}

function tabFor(root: HTMLElement, id: EntityTabId) {
  return root.querySelector<HTMLAnchorElement>(`[data-gaga-entity-tab="${id}"]`);
}

function panelIdFromHash(root: HTMLElement, hash: string): EntityTabId | null {
  const targetId = hash.replace(/^#/, '');
  if (!targetId) return null;
  if (isLegacyEntityFragmentAlias(targetId)) return legacyEntityFragmentAliases[targetId];
  const target = document.getElementById(targetId);
  if (!target) return null;

  for (const id of ['profile', 'writings'] as const) {
    const panel = panelFor(root, id);
    if (panel && (panel === target || panel.contains(target))) return id;
  }
  return null;
}

function activate(root: HTMLElement, activeId: EntityTabId) {
  for (const id of ['profile', 'writings'] as const) {
    const active = id === activeId;
    const tab = tabFor(root, id);
    const panel = panelFor(root, id);

    if (tab) {
      if (active) tab.setAttribute('aria-current', 'location');
      else tab.removeAttribute('aria-current');
    }
    if (panel) panel.hidden = !active;
  }

  root.dataset.gagaEntityActiveView = activeId;
}

function initRoot(root: HTMLElement) {
  if (root.dataset.gagaEntityTabsReady === 'true') return;
  root.dataset.gagaEntityTabsReady = 'true';
  root.dataset.gagaEnhanced = 'true';

  const syncFromLocation = () => activate(root, panelIdFromHash(root, location.hash) ?? 'profile');
  syncFromLocation();

  window.addEventListener('hashchange', syncFromLocation);
  window.addEventListener('popstate', syncFromLocation);
}

export function initEntityTabs() {
  for (const root of document.querySelectorAll<HTMLElement>('[data-gaga-entity-tabs]')) {
    initRoot(root);
  }
}
