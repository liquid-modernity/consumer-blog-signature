import type { GagaDocument } from './types';

export function adaptContentDocument(input: {
  id: string;
  title: string;
  description?: string;
}): GagaDocument {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    nodes: []
  };
}
