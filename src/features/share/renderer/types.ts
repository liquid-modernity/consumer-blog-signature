export type ShareRenderKind =
  | "article-card"
  | "breaking-card"
  | "reading-progress";

export interface ShareRenderPayload {
  title: string;
  summary?: string;
  author?: string;
  section?: string;
  readTime?: string;
}
