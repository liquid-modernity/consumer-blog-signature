import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import {
  qualifyEditorial,
  previewDocument,
} from "../../editorial/content-release.mjs";
import { editorialBody } from "../../editorial/portable-text.mjs";
import { readEmDashPublished } from "@gaga/corps-emdash";
import { stableStringify, normalizeApplication } from "@gaga/arsenal";
import {
  defineQuery,
  executeSearchReference,
} from "@gaga/engine-capabilities/search";
import { withEditorialText } from "../../editorial/search.mjs";
export const profile = JSON.parse(
  readFileSync(new URL("../../content-release.json", import.meta.url)),
);
const hash = (x) => "sha256:" + createHash("sha256").update(x).digest("hex");
export function projectPublished(snapshot, request, item) {
  const next = structuredClone(snapshot),
    index = next.documents.findIndex(
      (d) => d.item.type + "/" + d.item.id === request.resource,
    );
  if (index < 0) throw Error("New content needs explicit route admission.");
  if (request.action === "unpublish") {
    next.documents.splice(index, 1);
    return next;
  }
  const d = next.documents[index];
  if (item.status !== "published" || !item.liveRevisionId)
    throw Error("Only published revisions may be projected.");
  const raw = item.liveData ?? item.data,
    data = Object.fromEntries(
      Object.entries(raw).filter(([k]) => !k.startsWith("_")),
    );
  d.item = Object.fromEntries(
    [
      "id",
      "type",
      "slug",
      "status",
      "updatedAt",
      "publishedAt",
      "liveRevisionId",
    ].map((k) => [k, item[k]]),
  );
  d.item.data = data;
  d.item.draftRevisionId = null;
  d.pin = {
    ...d.pin,
    liveRevisionId: item.liveRevisionId,
    updatedAt: item.updatedAt,
  };
  const body = editorialBody(data);
  d.bodySha256 = hash(
    typeof body === "string" ? body : JSON.stringify(body),
  ).slice(7);
  return next;
}
// A private projection must use the selected revision, never the provider's published overlay.
export function projectPreview(snapshot, request, selected, slug) {
  const data = { ...selected.revision.data };
  const next = projectPublished(snapshot, request, {
    ...selected.published,
    data,
    liveData: data,
    slug,
    status: "published",
    liveRevisionId: request.selectedRevision,
    draftRevisionId: null,
  });
  next.mode = "prospective-content-preview";
  next.provenance = {
    ...next.provenance,
    liveEmDashExportVerified: false,
    prospective: true,
    realProviderReads: 0,
  };
  return next;
}
export function createContentApplication({
  source,
  identity,
  manifest,
  context,
}) {
  return {
    profile,
    identity,
    changedFiles: [],
    changeSet: (selected) => ({
      before: {
        ...(selected.published.liveData ?? selected.published.data),
        _slug: selected.published.slug,
      },
      after: {
        ...selected.revision.data,
        _slug: selected.revision.data._slug ?? selected.published.slug,
      },
    }),
    async qualify({ request, selected }) {
      const snapshot = JSON.parse(
        readFileSync(
          resolve(
            manifest.content.export.storage === "artifact"
              ? context.artifactRoot
              : source,
            manifest.content.export.path,
          ),
        ),
      );
      const declaration = readFileSync(
          resolve(source, "gaga.app.json"),
          "utf8",
        ),
        normalized = normalizeApplication(declaration);
      if (!normalized.ok) throw Error("Application declaration is invalid.");
      const result = qualifyEditorial({ request, selected, profile, snapshot });
      const projection = projectPreview(
        snapshot,
        request,
        selected,
        result.slug,
      );
      const document = projection.documents.find(
        (d) => d.item.type + "/" + d.item.id === request.resource,
      );
      if (document) {
        const projected = await readEmDashPublished(document.pin, {
          origin: profile.cmsOrigin,
          authorizeRead: async (resource) => ({ decision: "ALLOW", resource }),
          readRaw: async () => structuredClone(document.item),
        });
        if (projected.status !== "projected")
          throw Error("Public Corps projection rejected the selected content.");
        const artifact = withEditorialText(projected, result.body),
          search = executeSearchReference({
            id: "content-preview-proof",
            query: defineQuery({
              id: "selected-content",
              text: result.title,
              filters: [],
              facets: [],
              scope: [],
              constraints: [],
              diagnostics: [],
            }),
            artifacts: [artifact],
            limitations: [],
            diagnostics: [],
          });
        if (search.status !== "succeeded" || !search.output.results.length)
          throw Error("Public Engine Search rejected projected content.");
      }
      const styles = [];
      const page = await fetch(profile.publicationOrigin + "/", {
        redirect: "error",
      });
      if (page.status !== 200)
        throw Error("Qualified typography is unavailable.");
      const text = await page.text();
      for (const m of text.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)) {
        const u = new URL(m[1], profile.publicationOrigin);
        if (u.origin === profile.publicationOrigin) styles.push(u.href);
      }
      const html = previewDocument(result, styles),
        secret = randomBytes(32).toString("hex");
      const server = createServer((req, res) => {
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        res.setHeader("Referrer-Policy", "no-referrer");
        if (req.headers.authorization !== "Bearer " + secret) {
          res.writeHead(401);
          res.end("Private preview");
          return;
        }
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
      });
      server.listen(0, "127.0.0.1");
      await once(server, "listening");
      const url = "http://127.0.0.1:" + server.address().port;
      try {
        const denied = await fetch(url),
          allowed = await fetch(url, {
            headers: { Authorization: "Bearer " + secret },
          });
        if (
          denied.status !== 401 ||
          allowed.status !== 200 ||
          (await allowed.text()) !== html
        )
          throw Error("Private preview access proof failed.");
      } finally {
        await new Promise((r) => server.close(r));
      }
      if (process.env.GAGA_CONTENT_BUILD_PROOF === "1") {
        const { proveContentBuild } = await import("./build.mjs");
        result.affected = await proveContentBuild({
          source: resolve(import.meta.dirname, "../.."),
          projection,
          baseline: context.artifactRoot,
          cache: context.cache,
          origin: profile.publicationOrigin,
        });
      }
      return {
        status: "passed",
        candidateDigest: hash(stableStringify(selected.revision)),
        qualification: {
          status: "passed",
          checks: [
            "exact-revision",
            "portable-text",
            "references",
            "route-conflicts",
            "canonical-renderer",
            "corps-prospective-projection",
            "search-text",
            "private-preview",
          ],
        },
        affected: result.affected,
        preview: {
          authorized: true,
          anonymousStatus: 401,
          authorizedStatus: 200,
          htmlDigest: hash(html),
          renderer: "application/portable-text",
          styles: styles.length,
          selectedRevision: request.selectedRevision,
        },
        projectionDigest: hash(stableStringify(projection)),
      };
    },
  };
}
