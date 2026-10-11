export interface GagaRouteContext {
  id: string;

  entryData?: Record<string, unknown>;

  entry?: {
    data?: Record<string, unknown>;
  };

  toc: {
    items: Array<unknown>;
  };

  head: Array<{
    tag: string;
    attrs?: Record<string, string>;
    content?: string;
  }>;
}


export function normalizeGagaRouteContext(
  route?: Partial<GagaRouteContext> | null
): GagaRouteContext {
  return {
    id: route?.id ?? '',

    entryData:
      route?.entryData ??
      route?.entry?.data ??
      {},

    entry: {
      data:
        route?.entry?.data ??
        route?.entryData ??
        {}
    },

    toc: {
      items: route?.toc?.items ?? []
    },

    head: route?.head ?? []
  };
}


export function extractGagaHeadTitle(
  route?: GagaRouteContext | null
) {
  const data = route?.entryData ?? {};

  return {
    title: data.title as string | undefined,
    socialTitle:
      data.socialTitle as string | undefined
  };
}


export function filterGagaHeadEntries(
  entries: GagaRouteContext['head'] = [],
  options?: {
    replacedMetaNames?: string[];
  }
) {
  if (!options?.replacedMetaNames?.length) {
    return entries.filter(Boolean);
  }

  return entries.filter((entry) => {
    const name = entry.attrs?.name;

    return !(
      name &&
      options.replacedMetaNames.includes(name)
    );
  });
}
