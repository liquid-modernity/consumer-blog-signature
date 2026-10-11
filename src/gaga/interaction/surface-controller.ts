import { applyAriaState } from './aria';

export function setSurfaceExpanded(
  element: HTMLElement,
  expanded: boolean,
): void {
  element.dataset.gagaState = expanded ? 'expanded' : 'collapsed';
  applyAriaState(element, { expanded });
}

export function dismissSurface(element: HTMLElement): void {
  element.dataset.gagaState = 'hidden';
  applyAriaState(element, { hidden: true });
}
