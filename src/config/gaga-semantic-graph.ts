export const gagaSemanticGraph = {
  nodes: [
    'article',
    'topic',
    'author',
    'source',
    'media'
  ],
  edges: [
    'related',
    'writtenBy',
    'belongsTo',
    'references'
  ]
} as const;
