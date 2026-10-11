export type GagaNodeType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'audio'
  | 'quote'
  | 'insight'
  | 'card'
  | 'code'
  | 'table';

export interface GagaNode {
  type: GagaNodeType;
  value: unknown;
}

export interface GagaDocument {
  id: string;
  title: string;
  description?: string;
  nodes: GagaNode[];
  relations?: string[];
}
