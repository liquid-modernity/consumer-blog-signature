export type GagaSurfaceState = 'hidden' | 'collapsed' | 'expanded';

export interface GagaSurfaceCapability {
  id: string;
  state: GagaSurfaceState;
  capabilities: string[];
}

export interface GagaSurfaceContext {
  viewport: 'mobile' | 'tablet' | 'desktop';
  route: string;
  article: boolean;
}
