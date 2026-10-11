export type GagaViewport = 'mobile' | 'tablet-mini' | 'tablet' | 'desktop';

export interface GagaContext {
  pathname: string;
  viewport: GagaViewport;
  contentType?: string;
}

export interface GagaRelation {
  id: string;
  type: 'related' | 'reference' | 'source';
}
