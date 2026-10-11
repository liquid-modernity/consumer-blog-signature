import type { GagaSemanticDocument } from '../content/tree';
import { createGagaOutline, type GagaOutlineItem } from '../content/outline';

export interface GagaOutlineState {
  sections: GagaOutlineItem[];
  currentSection?: string;
}

export function createOutlineState(document: GagaSemanticDocument): GagaOutlineState {
  return {
    sections: createGagaOutline(document),
  };
}
