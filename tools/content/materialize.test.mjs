import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { materializePublished } from "./materialize.mjs";
const snapshot = JSON.parse(readFileSync("content/emdash/published.json")),
  canonical = (x) =>
    JSON.stringify(x, (_k, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(
            Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)),
          )
        : v,
    ),
  fingerprint = (x) =>
    "sha256:" + createHash("sha256").update(canonical(x)).digest("hex");
function fixture() {
  const d = snapshot.documents.find((x) => x.item.type === "posts"),
    request = {
      action: "publish",
      resource: d.item.type + "/" + d.item.id,
      selectedRevision: "published-exact",
      expectedPublishedRevision: d.item.liveRevisionId,
    },
    records = snapshot.documents.map((x) => ({
      resource: x.item.type + "/" + x.item.id,
      revision: x.item.liveRevisionId,
      updatedAt: x.item.updatedAt,
      dataDigest: fingerprint(x.item.data),
    })),
    items = new Map(
      snapshot.documents.map((x) => [
        x.item.type + "/" + x.item.id,
        structuredClone(x.item),
      ]),
    );
  items.get(request.resource).liveRevisionId = "published-exact";
  return {
    request,
    items,
    source: process.cwd(),
    baseline: {
      content: { export: { path: "content/emdash/published.json" }, records },
    },
    context: {
      artifactRoot: process.cwd(),
      cache: "/unused",
      fingerprint,
      readPublished: async (r) => structuredClone(items.get(r)),
    },
    publishedRevision: "published-exact",
    build: async (o) => ({
      payload: "/test-only",
      root: "/test-only",
      affected: { proposed: ["/"], removed: [] },
      observed: o.projection,
    }),
  };
}
test("post-publish materialization re-reads exact native identities and emits published-only canonical input", async () => {
  const f = fixture(),
    r = await materializePublished(f);
  assert.equal(r.projection.mode, "published-emdash-export");
  assert.equal(r.projection.provenance.liveEmDashExportVerified, true);
  assert.equal(
    r.projection.documents.find(
      (d) => d.item.id === f.request.resource.split("/")[1],
    ).item.liveRevisionId,
    "published-exact",
  );
});
test("a revision race or unrelated published change blocks before build", async () => {
  for (const mode of ["selected", "unrelated"]) {
    const f = fixture();
    let builds = 0;
    f.build = async () => {
      builds++;
    };
    if (mode === "selected")
      f.items.get(f.request.resource).liveRevisionId = "different";
    else {
      const other = [...f.items.values()].find(
        (x) => x.id !== f.request.resource.split("/")[1],
      );
      other.data.title = "conflicting";
    }
    await assert.rejects(materializePublished(f));
    assert.equal(builds, 0);
  }
});
test("unpublished content disappears from projection and history input remains unchanged", async () => {
  const f = fixture();
  f.request = { ...f.request, action: "unpublish", selectedRevision: null };
  f.publishedRevision = null;
  const item = f.items.get(f.request.resource);
  item.status = "draft";
  item.liveRevisionId = null;
  const r = await materializePublished(f);
  assert.equal(r.projection.documents.length, snapshot.documents.length - 1);
  assert.equal(snapshot.documents.length, 8);
});
test("materialization rehearsal is explicitly private and cannot claim a live provider export", async () => {
  const f = fixture(),
    r = await materializePublished({ ...f, simulation: true });
  assert.equal(r.simulation, true);
  assert.equal(r.projection.mode, "prospective-content-preview");
  assert.equal(r.projection.provenance.liveEmDashExportVerified, false);
});
