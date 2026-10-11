export type GagaSemanticNodeType =
  | 'document'
  | 'section'
  | 'heading'
  | 'paragraph'
  | 'media';

export interface GagaSemanticNode {
  type: GagaSemanticNodeType;
  id?: string;
  title?: string;
  level?: number;
  children?: GagaSemanticNode[];
}

export interface GagaSemanticDocument {
  id: string;
  title: string;
  nodes: GagaSemanticNode[];
}
