export interface GagaRouteTocItem {
  depth: number;
  text: string;
  slug: string;
}

export interface GagaRouteContext {
  id: string;

  lang?: string;

  entryData?: Record<string, unknown>;

  entry?: {
    data?: Record<string, unknown>;
  };

  toc: {
    items: GagaRouteTocItem[];
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

    lang: route?.lang,

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
  input?: GagaRouteContext | GagaRouteContext['head'] | null
) {
  const data =
    Array.isArray(input)
      ? {}
      : input?.entryData ?? {};

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
  const replacedMetaNames =
    options?.replacedMetaNames ?? [];

  if (!replacedMetaNames.length) {
    return entries.filter(Boolean);
  }

  return entries.filter((entry) => {
    const name = entry.attrs?.name;

    return !(
      name &&
      replacedMetaNames.includes(name)
    );
  });
}
