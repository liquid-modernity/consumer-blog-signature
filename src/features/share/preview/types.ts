export type PreviewVariant =
  | 'article'
  | 'breaking'
  | 'reading';

export interface SharePreviewModel {
  variant: PreviewVariant;
  title: string;
  author?: string;
  section?: string;
  readingTime?: string;
  freshness?: string;
}
