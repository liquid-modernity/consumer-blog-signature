import { getPublicRelationRecords } from './content';

export type KnowledgeGraphNodeKind = 'article' | 'topic' | 'author';
export type KnowledgeGraphRelation = 'author' | 'contributor' | 'topic' | 'related' | 'entity' | 'main-entity' | 'source';

export type KnowledgeGraphNode = {
  id: string;
  kind: KnowledgeGraphNodeKind;
  label: string;
  href: string;
  summary?: string;
};

export type KnowledgeGraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: KnowledgeGraphRelation;
};

export type KnowledgeGraphData = {
  version: 1;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
};

type RelationField = 'authorRefs' | 'contributorRefs' | 'topicRefs' | 'relatedRefs' | 'entityRefs' | 'mainEntityRefs' | 'sourceRefs';

function edgeIdentity(relation: KnowledgeGraphRelation, source: string, target: string) {
  if (relation === 'related') {
    const [left, right] = [source, target].sort();
    return `${relation}:${left}:${right}`;
  }
  return `${relation}:${source}:${target}`;
}

export async function getPublicKnowledgeGraph(): Promise<KnowledgeGraphData> {
  const records = await getPublicRelationRecords();

  const nodes = records
    .map((record): KnowledgeGraphNode => ({
      id: record.contentId,
      kind: record.contentKind,
      label: record.title,
      href: record.href,
      ...(record.summary ? { summary: record.summary } : {})
    }))
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.label.localeCompare(right.label));

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = new Map<string, KnowledgeGraphEdge>();
  const relationFields = [
    ['authorRefs', 'author'],
    ['contributorRefs', 'contributor'],
    ['topicRefs', 'topic'],
    ['relatedRefs', 'related'],
    ['entityRefs', 'entity'],
    ['mainEntityRefs', 'main-entity'],
    ['sourceRefs', 'source']
  ] as const satisfies readonly (readonly [RelationField, KnowledgeGraphRelation])[];

  for (const record of records) {
    const source = record.contentId;

    for (const [field, relation] of relationFields) {
      for (const target of record[field]) {
        if (target === source || !nodeIds.has(target)) continue;
        const id = edgeIdentity(relation, source, target);
        if (edges.has(id)) continue;
        edges.set(id, { id, source, target, relation });
      }
    }
  }

  return {
    version: 1,
    nodes,
    edges: [...edges.values()].sort((left, right) => left.id.localeCompare(right.id))
  };
}
