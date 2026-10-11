/**
 * GAGA accessibility announcement foundation.
 * Components may provide localized messages through this layer.
 */
export function announce(message: string): void {
  const region = document.querySelector<HTMLElement>("[data-gaga-live-region]");
  if (!region) return;

  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
