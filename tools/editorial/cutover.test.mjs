import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCutoverPlan, digest } from "./cutover-plan.mjs";
import { executeCutover } from "./cutover-session.mjs";
const source = JSON.parse(readFileSync("cms/editorial/source-set.json")),
  plan = buildCutoverPlan(source);
test("current operator production revision and all current bodies exclusively drive deterministic conversion", () => {
  assert.deepEqual(buildCutoverPlan(source), plan);
  assert.deepEqual(
    JSON.parse(readFileSync("cms/editorial/migration-plan.json")),
    plan,
  );
  const r = plan.records.find(
    (r) => r.applicationId === "consumer.article.softcoded-systems",
  );
  assert.equal(r.pin.liveRevisionId, "01M5S1YZCPHZ5HPA8Q9XQNMEB1");
  assert.equal(
    r.previousReviewedPin.liveRevisionId,
    "01M5RYJ86S0M7277DW66A1D69T",
  );
  assert.equal(
    r.markdownSha256,
    "e1c387075c660c20532e4c35ce74c0b3a4c412ff2f196d62b648ca6d7e4986c8",
  );
  for (const r of plan.records) {
    assert.equal(r.data.integration.canonicalBodyField, "content");
    assert.equal(r.markdownSha256, digest(r.before.data.body));
    assert.ok(!Object.hasOwn(r.data, "body"));
    assert.ok(!Object.hasOwn(r.data, "title"));
    assert.ok(!Object.hasOwn(r.data, "summary"));
    assert.ok(r.textEquivalent);
  }
  assert.ok(
    plan.schemaOperations.every(
      (o) => !o.path.endsWith("/fields/body") || o.body.type === undefined,
    ),
  );
  assert.equal(plan.productionContentCreates, 0);
  assert.equal(plan.retries, 0);
});
test("missing qualification or changed checksum produces zero publication/schema/content side effects", async () => {
  const oldLocation = globalThis.location,
    oldFetch = globalThis.fetch;
  let writes = 0;
  globalThis.location = { origin: plan.origin };
  globalThis.fetch = async (_url, options) => {
    if (options.method !== "GET") writes++;
    throw Error("No request expected");
  };
  try {
    const text = JSON.stringify(plan);
    await assert.rejects(
      () => executeCutover(text, "0".repeat(64), null, () => {}),
      /checksum/,
    );
    await assert.rejects(
      () => executeCutover(text, digest(text), {}, () => {}),
      /qualification/,
    );
    await assert.rejects(
      () =>
        executeCutover(
          text,
          digest(text),
          {
            status: "PASS",
            planSha256: digest(text),
            sourceSetSha256: plan.sourceSetSha256,
          },
          () => {},
        ),
      /recovery\/freeze/,
    );
    assert.equal(writes, 0);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.location = oldLocation;
  }
});
test("whole-set schema preflight failure produces zero writes", async () => {
  const oldLocation = globalThis.location,
    oldFetch = globalThis.fetch;
  let writes = 0;
  globalThis.location = { origin: plan.origin };
  globalThis.fetch = async (url, options) => {
    if (options.method !== "GET") writes++;
    return Response.json({
      success: true,
      data: url.endsWith("auth/me")
        ? { role: 50 }
        : { items: [{ slug: "unexpected" }] },
    });
  };
  try {
    const text = JSON.stringify(plan),
      gate = {
        status: "PASS",
        planSha256: digest(text),
        sourceSetSha256: plan.sourceSetSha256,
        productionWritesAuthorized: true,
        backupVerified: true,
        workflowFreezeVerified: true,
        qualificationRun: 1,
      };
    await assert.rejects(
      () => executeCutover(text, digest(text), gate, () => {}),
      /schema changed/,
    );
    assert.equal(writes, 0);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.location = oldLocation;
  }
});
