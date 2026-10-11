export type GagaInputMode = 'keyboard' | 'pointer' | 'touch' | 'assistive';

export interface GagaFocusTarget {
  id: string;
  restore?: string;
}

export interface GagaAccessibilityContext {
  reducedMotion: boolean;
  inputMode: GagaInputMode;
  focus?: GagaFocusTarget;
}

export function createAccessibilityContext(): GagaAccessibilityContext {
  return {
    reducedMotion: false,
    inputMode: 'pointer',
  };
}
