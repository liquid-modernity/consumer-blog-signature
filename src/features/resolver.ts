import type { GagaShareContext } from "./contracts";

export function resolveShareContext(input: any): GagaShareContext {
  return {
    id: String(input.id ?? ""),
    title: String(input.title ?? ""),
    url: String(input.url ?? ""),
    description: input.description,
    cover: input.cover,
    author: input.author,
    section: input.section,
    tags: input.tags,
    freshness: input.freshness,
  };
}
