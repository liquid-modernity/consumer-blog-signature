import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  release as p,
  checkQualification,
  checkArchive,
  checkArtifact,
  checkManifest,
  checkSource,
  checkMain,
  checkVersions,
  checkRecord,
  publishOnce,
} from "./control.mjs";
const hash = (x) => createHash("sha256").update(x).digest("hex");
function fixture() {
  return {
    run: {
      repository: { full_name: p.repository },
      id: p.qualificationRun,
      path: p.workflow,
      head_sha: p.candidate,
      status: "completed",
      conclusion: "success",
    },
    artifact: {
      id: p.artifactId,
      name: p.artifactName,
      expired: false,
      digest: "sha256:" + p.artifactSha256,
      workflow_run: { id: p.qualificationRun, head_sha: p.candidate },
    },
    manifest: {
      sourceCommit: p.candidate,
      sourceTree: p.tree,
      sourceSha256: p.sourceSha256,
      qualificationRun: p.qualificationRun,
      production: true,
      productionExportSha256: p.exportSha256,
      qualification: {
        browserPassed: 4,
        browserFailed: 0,
        consumer: "PASS",
        auditVulnerabilities: 0,
      },
    },
    source: { commit: p.candidate, tree: p.tree, sha256: p.sourceSha256 },
    main: p.previousMain,
    ancestor: true,
    cms: p.cmsVersion,
    publication: p.publicationVersion,
  };
}
function guard(f) {
  checkQualification(f.run);
  checkArtifact(f.artifact);
  checkManifest(f.manifest);
  checkSource(f.source);
  checkMain(f.main, f.ancestor, "before");
  checkVersions(f.cms, f.publication);
}
test("only exact approved run/artifact/source/provider tuple passes", () =>
  guard(fixture()));
for (const [name, alter] of Object.entries({
  repository: (f) => (f.run.repository.full_name = "wrong/repo"),
  run: (f) => f.run.id++,
  workflow: (f) => (f.run.path = ".github/workflows/deploy.yml"),
  artifactName: (f) => (f.artifact.name = "production-publication-candidate"),
  artifactId: (f) => f.artifact.id++,
  artifactDigest: (f) => (f.artifact.digest = "sha256:" + "0".repeat(64)),
  candidate: (f) => (f.run.head_sha = "0".repeat(40)),
  tree: (f) => (f.manifest.sourceTree = "0".repeat(40)),
  sourceDigest: (f) => (f.source.sha256 = "0".repeat(64)),
  exportDigest: (f) => (f.manifest.productionExportSha256 = "0".repeat(64)),
  cmsVersion: (f) => (f.cms = "old"),
  publicationVersion: (f) => (f.publication = "new"),
  nonAncestorMain: (f) => (f.ancestor = false),
  unsuccessfulQualification: (f) => (f.run.conclusion = "failure"),
  expiredArtifact: (f) => (f.artifact.expired = true),
  artifactSource: (f) => (f.artifact.workflow_run.head_sha = "0".repeat(40)),
}))
  test(name + " fails before any upload", async () => {
    const f = fixture();
    alter(f);
    let uploads = 0;
    await assert.rejects(
      publishOnce({
        preflight: async () => guard(f),
        upload: async () => {
          uploads++;
        },
        verify: async () => {},
      }),
    );
    assert.equal(uploads, 0);
  });
test("changed editorial revision fails preflight with zero uploads", async () => {
  const admission = JSON.parse(readFileSync("cms/editorial/admission.json")),
    d = JSON.parse(readFileSync("content/emdash/published.json")).documents[0],
    expected = admission.records.find(
      (x) => x.applicationId === d.applicationId,
    );
  checkRecord(expected, d.item, d.item);
  const changed = structuredClone(d.item);
  changed.liveRevisionId = "newer-operator-revision";
  let uploads = 0;
  await assert.rejects(
    publishOnce({
      preflight: async () => checkRecord(expected, changed, changed),
      upload: async () => {
        uploads++;
      },
      verify: async () => {},
    }),
  );
  assert.equal(uploads, 0);
});
test("whole-set failure never uploads; upload failure never retries", async () => {
  let attempts = 0;
  await assert.rejects(
    publishOnce({
      preflight: async () => {
        throw Error("last record failed");
      },
      upload: async () => {
        attempts++;
      },
      verify: async () => {},
    }),
  );
  assert.equal(attempts, 0);
  await assert.rejects(
    publishOnce({
      preflight: async () => guard(fixture()),
      upload: async () => {
        attempts++;
        throw Error("provider failed");
      },
      verify: async () => {},
    }),
  );
  assert.equal(attempts, 1);
});
test("one exact admitted upload, then verification; no fallback upload", async () => {
  let uploads = 0,
    verifications = 0;
  await publishOnce({
    preflight: async () => guard(fixture()),
    upload: async () => {
      uploads++;
      return "version";
    },
    verify: async (v) => {
      assert.equal(v, "version");
      verifications++;
    },
  });
  assert.equal(uploads, 1);
  assert.equal(verifications, 1);
});
test("existing generic admission and workflow remain byte-identical", () => {
  assert.equal(
    hash(readFileSync("tools/gaga/admit-production.py")),
    "c732ab544ccb3c78ea4aa84682114825c57fc45d5ed52feb8aab70c86f1f5b5c",
  );
  assert.equal(
    hash(readFileSync(".github/workflows/deploy.yml")),
    "7714b39ae498a0a2a53476c6968c3d618feacb5e5b48aa0f44c0518521e46c27",
  );
});

test("altered downloaded artifact bytes fail before upload", async () => {
  let uploads = 0;
  await assert.rejects(
    publishOnce({
      preflight: async () => checkArchive(Buffer.from("altered bytes")),
      upload: async () => {
        uploads++;
      },
      verify: async () => {},
    }),
  );
  assert.equal(uploads, 0);
});
