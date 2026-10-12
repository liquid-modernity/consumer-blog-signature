export interface GagaShareContext {
  id: string;
  title: string;
  url: string;
  description?: string;
  cover?: string;
  author?: {
    name?: string;
    avatar?: string;
  };
  section?: string;
  tags?: string[];
  freshness?: {
    published?: string;
    updated?: string;
  };
}
