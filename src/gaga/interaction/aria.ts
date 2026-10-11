export interface GagaAriaState {
  expanded?: boolean;
  hidden?: boolean;
  pressed?: boolean;
}

export function applyAriaState(
  element: HTMLElement,
  state: GagaAriaState,
): void {
  if ('expanded' in state) {
    element.setAttribute('aria-expanded', String(state.expanded));
  }

  if ('hidden' in state) {
    element.setAttribute('aria-hidden', String(state.hidden));
  }

  if ('pressed' in state) {
    element.setAttribute('aria-pressed', String(state.pressed));
  }
}
