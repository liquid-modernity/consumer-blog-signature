export interface GagaRouteContext {
  id: string;
  pathname: string;
  title?: string;
  description?: string;
  toc: Array<{
    depth: number;
    text: string;
    slug: string;
  }>;
}

export function normalizeGagaRouteContext(
  route?: GagaRouteContext | null
): GagaRouteContext {
  return (
    route ?? {
      id: '',
      pathname: '/',
      toc: []
    }
  );
}
