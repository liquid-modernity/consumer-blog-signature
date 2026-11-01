import { breakpoints } from './systems.ts';
// Application composition over the published packages; not an extension to gaga.app/v1.
export const notchPresentation = Object.freeze({ placement: 'top', shape: 'notch' });
const shapes = Object.freeze({ top: ['notch', 'island', 'pill'], bottom: ['island', 'pill'], left: ['island', 'pill'], right: ['island', 'pill'] });
export function resolveNotchPresentation(input = notchPresentation, width = 1440) {
  if (!input || Object.keys(input).some(key => !['placement', 'shape'].includes(key)) || !shapes[input.placement]?.includes(input.shape) || !Number.isFinite(width) || width <= 0) throw new TypeError('Unsupported Notch presentation');
  if (width < breakpoints.desktopMin && ['left', 'right'].includes(input.placement)) return { placement: 'top', shape: 'island' };
  return { placement: input.placement, shape: width < breakpoints.tabletMiniMin && input.shape === 'notch' ? 'island' : input.shape };
}
export function positionLinkPreview(anchor, box, viewport) {
  const gap = 10, margin = 8;
  const start = (viewport.left ?? 0) + margin, ceiling = (viewport.top ?? 0) + margin;
  const end = (viewport.left ?? 0) + viewport.width - margin, floor = (viewport.top ?? 0) + viewport.height - margin;
  const width = Math.max(0, Math.min(box.width, end - start));
  const below = anchor.bottom + gap, above = anchor.top - box.height - gap;
  const preferred = below + box.height <= floor ? below : above;
  const top = Math.max(ceiling, Math.min(preferred, floor - box.height));
  const left = Math.max(start, Math.min(anchor.left, end - width));
  return { left, top, width };
}

export function outlineForRoute(items, path, kind, document = false) {
  if (kind !== 'article' && !document) return [];
  const meaningful = items.filter(item => item.slug !== '_top');
  return document && meaningful.length < 2 ? [] : meaningful;
}
