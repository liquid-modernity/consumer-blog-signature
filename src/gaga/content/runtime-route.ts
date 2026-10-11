export interface GagaRouteContext {
  id: string;
  lang?: string;
  entry?: {
    data?: Record<string, unknown>;
  };
  toc?: {
    items: Array<{
      depth: number;
      text: string;
      slug: string;
    }>;
  };
  head?: Array<{
    tag: string;
    attrs?: Record<string, string>;
    content?: string;
  }>;
}

export function normalizeGagaRouteContext(
  route?: GagaRouteContext | null
): GagaRouteContext {
  return (
    route ?? {
      id: '',
      toc: {
        items: []
      },
      head: []
    }
  );
}

export function extractGagaHeadTitle(
  route?: GagaRouteContext | null
): string | undefined {
  return route?.entry?.data?.title as string | undefined;
}

export function filterGagaHeadEntries(
  entries: GagaRouteContext['head'] = []
) {
  return entries.filter(Boolean);
}
