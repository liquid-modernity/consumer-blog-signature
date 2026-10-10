export type WorkspaceContext =
  | 'home'
  | 'article'
  | 'topic'
  | 'library'
  | 'archive';

export const contextRegistry = {
  home: {
    leftSurface: 'home-context',
    rightSurface: 'intelligence'
  },
  article: {
    leftSurface: 'article-context',
    rightSurface: 'intelligence'
  },
  topic: {
    leftSurface: 'topic-context',
    rightSurface: 'intelligence'
  },
  library: {
    leftSurface: 'library-context',
    rightSurface: 'intelligence'
  },
  archive: {
    leftSurface: 'archive-context',
    rightSurface: 'intelligence'
  }
} as const;
