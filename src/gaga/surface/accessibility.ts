export interface GagaSurfaceAccessibilityState {
  expanded: boolean;
  hidden: boolean;
}

export function syncSurfaceAccessibility(
  element: HTMLElement,
  state: GagaSurfaceAccessibilityState,
): void {
  element.setAttribute("aria-expanded", String(state.expanded));
  element.setAttribute("aria-hidden", String(state.hidden));
}
