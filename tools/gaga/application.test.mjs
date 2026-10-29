import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeApplication, stableStringify } from "@gaga/arsenal";
import {
  projectEmDashPublished,
  readEmDashPublished,
} from "@gaga/corps-emdash";
import { verifySnapshot, readSnapshot } from "./snapshot.mjs";
const d = readFileSync("gaga.app.json", "utf8");
test("real machine endpoints and namespaces validate deterministically", () => {
  const a = normalizeApplication(d);
  assert.equal(a.ok, true);
  assert.equal(
    stableStringify(a.value),
    stableStringify(normalizeApplication(stableStringify(a.value)).value),
  );
  assert.ok(a.value.routes.some((r) => r.path === "/machine.json"));
  assert.equal(a.value.routes.find((r) => r.path === "/").scope, "prefix");
});
test("published CMS snapshot retains the preserved application bodies and explicit provider/application identity mapping", async () => {
  const r = await verifySnapshot();
  assert.equal(r.artifacts.length, 8);
  assert.equal(r.snapshot.provenance.liveEmDashExportVerified, true);
  assert.ok(
    r.snapshot.documents.every(
      (x) => x.applicationId === x.item.data.metadata.contentId,
    ),
  );
});
test("stale, draft and denied CMS reads fail, without fallback or unauthorized reads", async () => {
  const { pin, item } = readSnapshot().documents[0];
  assert.equal(
    projectEmDashPublished({ ...item, draftRevisionId: "draft" }, pin).code,
    "draft-overlay",
  );
  assert.equal(
    projectEmDashPublished({ ...item, liveRevisionId: "other" }, pin).code,
    "stale-source",
  );
  let reads = 0;
  const denied = await readEmDashPublished(pin, {
    origin: pin.origin,
    authorizeRead: async () => ({ decision: "DENY" }),
    readRaw: async () => {
      reads++;
      return item;
    },
  });
  assert.equal(denied.code, "read-denied");
  assert.equal(reads, 0);
});
test("a changed snapshot body digest stops content admission", async () => {
  const s = structuredClone(readSnapshot());
  s.documents[0].bodySha256 = "0".repeat(64);
  await assert.rejects(verifySnapshot(s), /Export differs|CMS export body changed/);
});

test("maintained CI propagates failed commands through pipes and gates staging on qualified evidence", async () => {
  const { parse } = await import("yaml"),
    { spawnSync } = await import("node:child_process");
  const workflow = parse(
    readFileSync(".github/workflows/arsenal-dogfood.yml", "utf8"),
  );
  for (const name of ["verify", "staging"])
    assert.equal(workflow.jobs[name].defaults.run.shell, "bash");
  assert.equal(workflow.jobs.staging.needs, "verify");
  assert.equal(workflow.on.workflow_dispatch.inputs.deploy_preview.default, false);
  assert.match(workflow.jobs.staging.if, /github.event_name == 'workflow_dispatch' && inputs.deploy_preview/);
  assert.equal(
    spawnSync("/bin/bash", [
      "--noprofile",
      "--norc",
      "-e",
      "-o",
      "pipefail",
      "-c",
      "false | cat >/dev/null",
    ]).status,
    1,
  );
  const guard = readFileSync("tools/gaga/deployment-manifest.mjs", "utf8");
  assert.ok(guard.includes("assertBrowserReport"));
  assert.ok(guard.includes("audit.metadata.vulnerabilities.total"));
});
