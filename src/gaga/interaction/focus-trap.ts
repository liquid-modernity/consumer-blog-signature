/**
 * GAGA Focus Trap foundation.
 * Keeps focus inside an active surface without coupling to UI components.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));
}

export function restoreFocus(target: HTMLElement | null): void {
  target?.focus();
}

export function focusFirst(container: HTMLElement): void {
  getFocusableElements(container)[0]?.focus();
}
