export type ShareState =
  | 'idle'
  | 'prepared'
  | 'previewing'
  | 'sharing'
  | 'completed';

export interface ShareContext {
  id: string;
  title: string;
  url: string;
  description?: string;
  author?: string;
  section?: string;
  freshness?: string;
}

export interface ShareIntent {
  mode: 'article' | 'breaking' | 'reading';
  context: ShareContext;
}
