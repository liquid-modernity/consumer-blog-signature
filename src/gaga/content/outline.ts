import type { GagaSemanticDocument, GagaSemanticNode } from './tree';

export interface GagaOutlineItem {
  id: string;
  title: string;
  level: number;
}

function collect(nodes: GagaSemanticNode[], result: GagaOutlineItem[]) {
  for (const node of nodes) {
    if (node.type === 'heading' && node.id && node.title) {
      result.push({
        id: node.id,
        title: node.title,
        level: node.level ?? 2,
      });
    }
    if (node.children) collect(node.children, result);
  }
}

export function createGagaOutline(document: GagaSemanticDocument): GagaOutlineItem[] {
  const items: GagaOutlineItem[] = [];
  collect(document.nodes, items);
  return items;
}
