// Application composition over the published packages; not an extension to gaga.app/v1.
export const notchPresentation = Object.freeze({ placement: 'top', shape: 'notch' });
const shapes = Object.freeze({ top: ['notch', 'island', 'pill'], bottom: ['island', 'pill'], left: ['island', 'pill'], right: ['island', 'pill'] });
export function resolveNotchPresentation(input = notchPresentation, width = 1440) {
  if (!input || Object.keys(input).some(key => !['placement', 'shape'].includes(key)) || !shapes[input.placement]?.includes(input.shape) || !Number.isFinite(width) || width <= 0) throw new TypeError('Unsupported Notch presentation');
  if (width < 1280 && ['left', 'right'].includes(input.placement)) return { placement: 'top', shape: 'island' };
  return { placement: input.placement, shape: width < 768 && input.shape === 'notch' ? 'island' : input.shape };
}
export function contextualRails(path) {
  const route = path.replace(/\/+$/, '') || '/';
  return {
    left: /^\/(topics|sections|knowledge|tags|authors|system)(\/|$)/.test(route),
    right: /^\/(topics|sections)\/[^/]+$/.test(route)
  };
}
export function positionLinkPreview(anchor, box, viewport) {
  const gap = 10, margin = 8, width = Math.min(box.width, viewport.width - margin * 2);
  const below = anchor.bottom + gap, above = anchor.top - box.height - gap;
  const top = below + box.height <= viewport.height - margin ? below : above >= margin ? above : Math.max(margin, viewport.height - box.height - margin);
  const left = Math.max(margin, Math.min(anchor.left, viewport.width - width - margin));
  return { left, top, width };
}

export function outlineForRoute(items, path, kind, document = false) {
  if (kind !== 'article' && !document) return [];
  const meaningful = items.filter(item => item.slug !== '_top');
  return document && meaningful.length < 2 ? [] : meaningful;
}
