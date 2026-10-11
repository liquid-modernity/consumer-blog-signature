export function restoreFocus(selector?: string): void {
  if (!selector) return;

  const element = document.querySelector<HTMLElement>(selector);
  element?.focus();
}
