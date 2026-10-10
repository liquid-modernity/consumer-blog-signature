export const gagaKnowledgeRegistry = {
  article: {
    relations: ['topic', 'author', 'source']
  },
  topic: {
    relations: ['article', 'author', 'collection']
  },
  author: {
    relations: ['article', 'topic']
  },
  source: {
    relations: ['article']
  }
} as const;
