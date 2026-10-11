import { focusFirst, restoreFocus } from "../../interaction/focus-trap";

export function enterOutlineSurface(
  surface: HTMLElement,
  trigger: HTMLElement | null,
): () => void {
  focusFirst(surface);

  return () => restoreFocus(trigger);
}
