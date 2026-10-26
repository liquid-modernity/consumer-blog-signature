import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableStringify } from "@gaga/arsenal";
import { projectPublished, profile } from "./adapter.mjs";
import { qualifyEditorial } from "../../editorial/content-release.mjs";
import { buildContent } from "./build.mjs";
const check = (x, m) => {
  if (!x) throw Error(m);
};
export async function materializePublished({
  source,
  context,
  baseline,
  request,
  publishedRevision,
  simulation = false,
  build = buildContent,
}) {
  const snapshot = JSON.parse(
      readFileSync(
        resolve(
          baseline.content.export.storage === "artifact"
            ? context.artifactRoot
            : source,
          baseline.content.export.path,
        ),
      ),
    ),
    reads = [];
  let projection = structuredClone(snapshot);
  for (const pin of baseline.content.records) {
    const a = await context.readPublished(pin.resource),
      b = await context.readPublished(pin.resource);
    check(
      stableStringify(a) === stableStringify(b),
      "Published content changed during materialization.",
    );
    check(
      pin.resource === b.type + "/" + b.id,
      "Published provider identity differs.",
    );
    const changed = pin.resource === request.resource;
    if (changed && request.action === "unpublish") {
      check(
        b.status === "draft" && !b.liveRevisionId,
        "Content is still published.",
      );
      projection = projectPublished(projection, request, b);
      continue;
    }
    check(
      b.status === "published" &&
        b.liveRevisionId === (changed ? publishedRevision : pin.revision),
      "Published revision changed.",
    );
    const data = b.liveData ?? b.data;
    if (!changed) {
      check(
        context.fingerprint(data) === pin.dataDigest &&
          b.updatedAt === pin.updatedAt,
        "Unrelated published content changed.",
      );
      continue;
    }
    check(
      b.liveRevisionId === request.selectedRevision,
      "A different revision was published.",
    );
    const selected = { published: b, revision: { data } },
      body = qualifyEditorial({ request, selected, profile, snapshot });
    check(body.title, "Published content is invalid.");
    projection = projectPublished(projection, request, b);
    reads.push({ resource: pin.resource, revision: b.liveRevisionId });
  }
  projection.mode = simulation
    ? "prospective-content-preview"
    : "published-emdash-export";
  projection.provenance = {
    ...projection.provenance,
    liveEmDashExportVerified: !simulation,
    prospective: simulation,
    realProviderReads: simulation ? 0 : baseline.content.records.length * 2,
  };
  const built = await build({
    source,
    projection,
    baseline: context.artifactRoot,
    cache: context.cache,
    origin: profile.publicationOrigin,
    preview: simulation,
    retain: true,
  });
  return {
    ...built,
    projection,
    exportPath: "content/emdash/published.json",
    simulation,
    readback: [
      { path: "/api/search?q=", status: 400 },
      ...built.affected.removed.map((path) => ({ path, status: 404 })),
    ],
    checks: [
      "portable-text",
      "references",
      "route-conflicts",
      "canonical-projection",
      "affected-rendering",
      "search-text",
    ],
    publishedReads: reads,
  };
}
