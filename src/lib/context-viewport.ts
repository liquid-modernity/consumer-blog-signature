export function contextViewport() {
  const root = document.documentElement, viewport = window.visualViewport;
  const left = Math.max(0, viewport?.offsetLeft ?? 0), top = Math.max(0, viewport?.offsetTop ?? 0);
  const width = Math.max(1, Math.min(root.clientWidth - left, viewport?.width || root.clientWidth));
  const height = Math.max(1, Math.min(innerHeight, viewport?.height || innerHeight));
  const style = getComputedStyle(root);
  const inset = (edge: string) => Math.max(0, parseFloat(style.getPropertyValue('--gaga-safe-area-' + edge)) || 0);
  return { left: left + inset('left'), top: top + inset('top'), width: Math.max(1, width - inset('left') - inset('right')), height: Math.max(1, height - inset('top') - inset('bottom')), viewportLeft: left, viewportTop: top, viewportWidth: width, viewportHeight: height };
}
