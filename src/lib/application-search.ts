import { assembleApplication, type CompositionPlan } from "@gaga/arsenal";
import { projectAstroEntry } from "@gaga/corps-astro";
import { projectStarlightPage } from "@gaga/corps-starlight";
import { readEmDashPublished } from "@gaga/corps-emdash";
import {
  defineQuery,
  executeSearchReference,
  defineSearchableArtifact,
  type SearchableArtifactDescriptor,
} from "@gaga/engine-capabilities/search";
import { readFileSync } from "node:fs";
import snapshot from "../../content/emdash/published.json";
import type { GagaDiscoveryRecord } from "./discovery";
function publicDiscovery(
  artifact: Readonly<SearchableArtifactDescriptor>,
  record: GagaDiscoveryRecord,
) {
  return defineSearchableArtifact({
    ...artifact,
    searchableFields: [
      ...artifact.searchableFields,
      { field: "application-discovery", value: record.searchText },
    ],
    tags: record.tags ?? artifact.tags,
  });
}
export async function composeSearch(records: readonly GagaDiscoveryRecord[]) {
  const plan = JSON.parse(
    readFileSync(".gaga/composition-plan.json", "utf8"),
  ) as CompositionPlan;
  const links: Record<string, string> = {},
    cmsIds = new Set(snapshot.documents.map((d) => d.applicationId));
  const assembled = await assembleApplication(plan, {
    "published-content": async () => {
      const items = [];
      for (const document of snapshot.documents) {
        const result = await readEmDashPublished(document.pin, {
          origin: snapshot.origin,
          authorizeRead: async (resource) => ({ decision: "ALLOW", resource }),
          readRaw: async () => document.item,
        });
        if (result.status !== "projected")
          throw Error("CMS pinned revision rejected");
        const record = records.find((r) => r.id === document.applicationId);
        if (!record) continue;
        links[result.artifact.id] = record.href;
        items.push(publicDiscovery(result.artifact, record));
      }
      return items;
    },
    "application-pages": async () =>
      records
        .filter((r) => !cmsIds.has(r.id))
        .map((record) => {
          const entry = {
            id: record.id,
            collection: "application",
            data: {
              title: record.title,
              description: record.description ?? "",
            },
          };
          const projection = record.href.includes("/knowledge")
            ? projectStarlightPage(
                { entry },
                { url: record.href, visibility: "public" },
              ).content
            : projectAstroEntry(entry, {
                url: record.href,
                visibility: "public",
              });
          links[projection.artifact.id] = record.href;
          return publicDiscovery(projection.artifact, record);
        }),
  });
  if (!assembled.ok) throw Error(JSON.stringify(assembled.diagnostics));
  const proof = executeSearchReference({
    id: "blog-build-search",
    query: defineQuery({
      id: "blog-query",
      text: "Akal Imitasi",
      filters: [],
      facets: [],
      scope: [],
      constraints: [],
      diagnostics: [],
    }),
    artifacts: assembled.value.artifacts,
    limitations: [],
    diagnostics: [],
  });
  if (proof.status !== "succeeded" || !proof.output.results.length)
    throw Error("Expected publication missing from Engine Search");
  return {
    artifacts: assembled.value.artifacts,
    links,
    composition: { applicationId: plan.declaration.id, schema: plan.schema },
    searchProof: {
      status: proof.status,
      matchedArtifactIds: proof.output.matchedArtifactIds,
    },
  };
}
