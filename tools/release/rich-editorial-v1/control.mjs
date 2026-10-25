// One approved release only. Controller identity and immutable application identity stay separate.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { sourceIdentity } from "../../gaga/source-identity.mjs";
export const release = Object.freeze({
  repository: "liquid-modernity/consumer-blog-signature",
  candidate: "2f6fd0f6ec6af4302c34628da2c43a0c99266474",
  tree: "c642ffb12b2b24cd866f12253355fc320658a336",
  sourceSha256:
    "0e095fec33206d9cec15ca538d2faf4206a2d46a3e952781bb27b25be4c201c5",
  qualificationRun: 40214610434,
  workflow: ".github/workflows/editorial-studio.yml",
  artifactId: 12607210992,
  artifactName: "qualified-rich-publication-artifact",
  artifactSha256:
    "2d13f5867eb3d7a4a18171e8226dd7adca3ad366d9eeacb7b8c08f73d3fb13e9",
  exportSha256:
    "9caa6924b6ebbbc4d545cbee4f4fa8996ec30036c998aed114f951088dd0e37d",
  previousMain: "6827195c5d2e04efe26656ae4372d449481d2979",
  cmsVersion: "e69a0e28-0788-4b8b-80af-77ae17296896",
  publicationVersion: "af6c1291-c509-4095-b7c1-a77c9007a390",
  origin: "https://consumer-blog-signature.ratriatra.workers.dev",
  cmsOrigin: "https://consumer-blog-signature-cms.ratriatra.workers.dev",
  d1: "b26b0e8a-e193-4a7d-8e1d-c553de22fd27",
  r2: "consumer-blog-signature-cms-media",
  kv: "a0ad6f282a314e17bbdfec6c4e0c9fa2",
  controllerBranch: "verification/rich-editorial-final-release",
});
export const canonical = (x) =>
  JSON.stringify(x, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
const hash = (x) => createHash("sha256").update(x).digest("hex"),
  load = (p) => JSON.parse(readFileSync(p));
export function checkQualification(run) {
  assert.equal(run.repository.full_name, release.repository);
  assert.equal(run.id, release.qualificationRun);
  assert.equal(run.path, release.workflow);
  assert.equal(run.head_sha, release.candidate);
  assert.equal(run.status, "completed");
  assert.equal(run.conclusion, "success");
}
export function checkArchive(bytes) {
  assert.equal(
    hash(bytes),
    release.artifactSha256,
    "Approved ZIP bytes changed",
  );
}
export function checkArtifact(a) {
  assert.equal(a.id, release.artifactId);
  assert.equal(a.name, release.artifactName);
  assert.equal(a.expired, false);
  assert.equal(a.digest, "sha256:" + release.artifactSha256);
  assert.equal(a.workflow_run.id, release.qualificationRun);
  assert.equal(a.workflow_run.head_sha, release.candidate);
}
export function checkManifest(m) {
  assert.equal(m.sourceCommit, release.candidate);
  assert.equal(m.sourceTree, release.tree);
  assert.equal(m.sourceSha256, release.sourceSha256);
  assert.equal(String(m.qualificationRun), String(release.qualificationRun));
  assert.equal(m.production, true);
  assert.equal(m.productionExportSha256, release.exportSha256);
  assert.deepEqual(m.qualification, {
    browserPassed: 4,
    browserFailed: 0,
    consumer: "PASS",
    auditVulnerabilities: 0,
  });
}
export function checkSource(s) {
  assert.equal(s.commit, release.candidate);
  assert.equal(s.tree, release.tree);
  assert.equal(s.sha256, release.sourceSha256);
}
export function checkMain(main, ancestor, stage) {
  assert.equal(ancestor, true, "Non-ancestor main");
  assert.equal(
    main,
    stage === "before" ? release.previousMain : release.candidate,
    "Unexpected canonical main",
  );
}
export function checkVersions(cms, publication) {
  assert.equal(cms, release.cmsVersion, "CMS version drift");
  assert.equal(
    publication,
    release.publicationVersion,
    "Publication version drift",
  );
}
export function checkRecord(expected, a, b) {
  assert.equal(canonical(a), canonical(b), "Unstable CMS reads");
  assert.equal(a.id, expected.pin.id);
  assert.equal(a.type, expected.pin.collection);
  assert.equal(
    a.liveRevisionId,
    expected.pin.liveRevisionId,
    "Editorial revision drift",
  );
  assert.equal(a.updatedAt, expected.pin.updatedAt);
  assert.equal(a.status, "published");
  assert.equal(a.draftRevisionId, null);
  assert.equal(a.slug, expected.slug);
  assert.equal(a.publishedAt, expected.publishedAt);
  assert.equal(hash(canonical(a.data)), expected.dataSha256);
  assert.equal(hash(JSON.stringify(a.data.content)), expected.bodySha256);
  assert.equal(a.data.integration.canonicalBodyField, "content");
}
export async function publishOnce({ preflight, upload, verify }) {
  await preflight();
  const version = await upload();
  return verify(version);
}

async function main() {
  const mode = process.argv[2],
    root = resolve(process.env.GAGA_APPLICATION_DIRECTORY),
    out = resolve(process.env.GAGA_EVIDENCE_DIRECTORY),
    controller = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  assert.ok(
    ["admit", "preflight", "deploy", "readback", "rollback"].includes(mode),
  );
  assert.ok(!out.startsWith(root + "/"));
  mkdirSync(out, { recursive: true });
  assert.equal(process.env.GITHUB_REPOSITORY, release.repository);
  assert.equal(
    process.env.GITHUB_REF,
    "refs/heads/" + release.controllerBranch,
  );
  assert.equal(
    execFileSync("git", ["-C", controller, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    process.env.GITHUB_SHA,
    "Controller checkout mismatch",
  );
  const secrets = [
      process.env.CLOUDFLARE_API_TOKEN,
      process.env.CLOUDFLARE_ACCOUNT_ID,
      process.env.CMS_READ_TOKEN,
      process.env.GH_TOKEN,
    ].filter(Boolean),
    redact = (s) =>
      secrets.reduce((s, key) => s.replaceAll(key, "[REDACTED]"), String(s));
  let receipt = {
    status: "RUNNING",
    mode,
    controllerCommit: process.env.GITHUB_SHA,
    controllerTree: execFileSync(
      "git",
      ["-C", controller, "rev-parse", "HEAD^{tree}"],
      { encoding: "utf8" },
    ).trim(),
    controllerRun: process.env.GITHUB_RUN_ID,
    applicationCommit: release.candidate,
    artifactSha256: release.artifactSha256,
    uploads: 0,
    resourceCreates: 0,
    cmsUploads: 0,
    contentWrites: 0,
    schemaWrites: 0,
  };
  const path = (name) => resolve(out, name),
    save = () =>
      writeFileSync(
        path(mode + ".json"),
        JSON.stringify(receipt, null, 2) + "\n",
        { mode: 0o600 },
      );
  async function jsonGet(url, headers) {
    receipt.pendingRead = {
      origin: new URL(url).origin,
      path: redact(new URL(url).pathname),
    };
    save();
    const r = await fetch(url, {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(
      r.status,
      200,
      `GET ${new URL(url).origin + new URL(url).pathname} HTTP${r.status}`,
    );
    const b = await r.json();
    delete receipt.pendingRead;
    save();
    return b;
  }
  const gh = (route) => {
    assert.ok(process.env.GH_TOKEN);
    return jsonGet(
      "https://api.github.com/repos/" + release.repository + route,
      {
        Authorization: "Bearer " + process.env.GH_TOKEN,
        Accept: "application/vnd.github+json",
      },
    );
  };
  const cf = async (route, body) => {
    assert.ok(
      process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID,
    );
    assert.ok(
      !body || (mode === "rollback" && route === worker + "/deployments"),
      "Unapproved provider mutation",
    );
    receipt.pendingProviderRequest = {
      method: body ? "POST" : "GET",
      path: redact(route),
    };
    save();
    const r = await fetch("https://api.cloudflare.com/client/v4" + route, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    const b = await r.json();
    assert.ok(
      r.ok && b.success,
      `Provider ${body ? "rollback" : "GET"} ${route.replaceAll(process.env.CLOUDFLARE_ACCOUNT_ID, "[ACCOUNT]")} HTTP${r.status}; codes ${(b.errors ?? []).map((x) => x.code)}`,
    );
    if (route.endsWith("/deployments"))
      assert.equal(b.result_info?.page ?? 1, 1);
    else
      assert.ok(
        (b.result_info?.total_pages ?? 1) <= 1,
        "Partial provider inventory",
      );
    delete receipt.pendingProviderRequest;
    save();
    return b.result;
  };
  const base = "/accounts/" + process.env.CLOUDFLARE_ACCOUNT_ID,
    worker = base + "/workers/scripts/consumer-blog-signature",
    cms = base + "/workers/scripts/consumer-blog-signature-cms";
  function active(result) {
    const d = result.deployments?.[0];
    assert.ok(d);
    assert.equal(d.versions.length, 1);
    assert.equal(d.versions[0].percentage, 100);
    return { id: d.id, version: d.versions[0].version_id };
  }
  function payload() {
    checkSource(sourceIdentity(root));
    const m = load(resolve(root, ".gaga/deployment-manifest.json"));
    checkManifest(m);
    assert.equal(
      hash(readFileSync(resolve(root, "content/emdash/published.json"))),
      release.exportSha256,
    );
    assert.equal(
      hash(readFileSync(path("approved-publication.zip"))),
      release.artifactSha256,
    );
    for (const f of m.files)
      assert.equal(
        hash(readFileSync(resolve(root, f.path))),
        f.sha256,
        "Changed admitted payload " + f.path,
      );
    return m;
  }
  async function canonicalMain(stage) {
    const main = (await gh("/git/ref/heads/main")).object.sha;
    const ancestor =
      spawnSync(
        "git",
        ["merge-base", "--is-ancestor", main, release.candidate],
        { cwd: root },
      ).status === 0;
    checkMain(main, ancestor, stage);
    return main;
  }
  async function content() {
    assert.ok(/^ec_pat_[A-Za-z0-9_-]+$/.test(process.env.CMS_READ_TOKEN ?? ""));
    const admission = load(resolve(root, "cms/editorial/admission.json"));
    assert.equal(admission.status, "PASS");
    assert.equal(admission.records.length, 8);
    const get = async (route) => {
      const b = await jsonGet(
        release.cmsOrigin + "/_emdash/api/content/" + route,
        { Authorization: "Bearer " + process.env.CMS_READ_TOKEN },
      );
      assert.equal(b.success, true);
      return b.data;
    };
    for (const collection of ["authors", "posts"]) {
      const expected = admission.records.filter(
          (x) => x.pin.collection === collection,
        ),
        list = (await get(collection + "?limit=100")).items;
      assert.equal(list.length, expected.length);
      assert.deepEqual(
        list.map((x) => x.id).sort(),
        expected.map((x) => x.pin.id).sort(),
      );
    }
    const records = [];
    for (const r of admission.records) {
      const route = r.pin.collection + "/" + r.pin.id,
        a = (await get(route)).item,
        b = (await get(route)).item;
      checkRecord(r, a, b);
      records.push({
        applicationId: r.applicationId,
        pin: r.pin,
        bodySha256: r.bodySha256,
        stableRepeatedRead: true,
      });
    }
    return records;
  }
  async function provider(expectedPublication = release.publicationVersion) {
    assert.equal((await cf("/user/tokens/verify")).status, "active");
    assert.equal(
      (await cf(base + "/workers/subdomain")).subdomain,
      "ratriatra",
    );
    const workers = await cf(base + "/workers/scripts");
    assert.ok(workers.some((x) => x.id === "consumer-blog-signature"));
    assert.ok(workers.some((x) => x.id === "consumer-blog-signature-cms"));
    const c = active(await cf(cms + "/deployments")),
      p = active(await cf(worker + "/deployments"));
    if (expectedPublication === release.publicationVersion)
      checkVersions(c.version, p.version);
    else {
      assert.equal(c.version, release.cmsVersion);
      assert.equal(p.version, expectedPublication);
    }
    const bindings = (await cf(cms + "/settings")).bindings;
    for (const [name, type, key, value] of [
      ["DB", "d1", "id", release.d1],
      ["MEDIA", "r2_bucket", "bucket_name", release.r2],
      ["SESSION", "kv_namespace", "namespace_id", release.kv],
    ]) {
      const row = bindings.filter((x) => x.name === name);
      assert.equal(row.length, 1);
      assert.equal(row[0].type, type);
      assert.equal(row[0][key], value);
    }
    assert.ok(
      bindings.every((x) =>
        ["DB", "MEDIA", "SESSION", "ASSETS"].includes(x.name),
      ),
    );
    assert.equal(
      (await cf(base + "/d1/database/" + release.d1)).name,
      "consumer-blog-signature-cms",
    );
    assert.equal(
      (await cf(base + "/r2/buckets/" + release.r2)).name,
      release.r2,
    );
    assert.ok(
      (await cf(base + "/storage/kv/namespaces")).some(
        (x) =>
          x.id === release.kv &&
          x.title === "consumer-blog-signature-cms-session",
      ),
    );
    const publicBindings = (await cf(worker + "/settings")).bindings;
    assert.equal(publicBindings.length, 1);
    assert.equal(publicBindings[0].name, "ASSETS");
    assert.equal(publicBindings[0].type, "assets");
    return {
      cms: c,
      publication: p,
      bindings: bindings.filter((x) => x.name !== "ASSETS"),
      otherWorkers: workers
        .filter((x) => x.id !== "consumer-blog-signature")
        .map(({ id, etag, modified_on }) => ({
          id,
          etag: etag ?? null,
          modified_on: modified_on ?? null,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    };
  }
  async function controllerQualification() {
    const id = process.env.CONTROLLER_QUALIFICATION_RUN;
    assert.ok(/^\d+$/.test(id ?? ""));
    const r = await gh("/actions/runs/" + id);
    assert.equal(r.path, ".github/workflows/rich-editorial-final-release.yml");
    assert.equal(r.head_sha, process.env.GITHUB_SHA);
    assert.equal(r.status, "completed");
    assert.equal(r.conclusion, "success");
    return id;
  }
  function wrangler(dry) {
    const config = load(resolve(root, "wrangler.jsonc"));
    assert.equal(config.name, "consumer-blog-signature");
    assert.equal(config.main, "worker/bundle.mjs");
    assert.equal(config.no_bundle, true);
    assert.ok(
      Object.keys(config).every((x) =>
        [
          "$schema",
          "name",
          "main",
          "no_bundle",
          "compatibility_date",
          "compatibility_flags",
          "assets",
        ].includes(x),
      ),
    );
    const args = [
      resolve(root, "node_modules/wrangler/bin/wrangler.js"),
      "deploy",
      "--config",
      resolve(root, "wrangler.jsonc"),
      "--experimental-provision=false",
      "--experimental-auto-create=false",
      ...(dry ? ["--dry-run", "--outdir", path("dry-run")] : []),
    ];
    if (!dry) {
      assert.equal(
        Number(process.env.GITHUB_RUN_ATTEMPT),
        1,
        "Workflow upload rerun forbidden",
      );
      receipt.uploads++;
      receipt.pendingOperation = "ONE_PUBLICATION_UPLOAD_NO_RETRY";
      save();
    }
    const env = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      CI: "true",
      WRANGLER_SEND_METRICS: "false",
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    };
    const r = spawnSync(process.execPath, args, {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 240000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const log = redact(
      (r.stdout ?? "") + (r.stderr ?? "") + (r.error?.message ?? ""),
    );
    writeFileSync(path(dry ? "dry-run.log" : "upload.log"), log, {
      mode: 0o600,
    });
    assert.equal(
      r.status,
      0,
      dry ? "Dry run failed" : "One upload failed or ambiguous; do not retry",
    );
    if (!dry) {
      const v = log.match(/Current Version ID:\s*([a-f0-9-]{36})/);
      assert.ok(v, "Upload ownership ambiguous");
      receipt.newVersion = v[1];
      save();
      return v[1];
    }
  }
  async function waitVersion(expected, previous) {
    for (let i = 0; i < 6; i++) {
      const s = active(await cf(worker + "/deployments"));
      if (s.version === expected) return s;
      assert.equal(s.version, previous, "Concurrent deployment");
      if (i < 5) await new Promise((r) => setTimeout(r, 2000));
    }
    throw Error("Provider readback timeout");
  }
  try {
    if (mode === "admit") {
      checkSource(sourceIdentity(root));
      const run = await gh("/actions/runs/" + release.qualificationRun);
      checkQualification(run);
      const a = await gh("/actions/artifacts/" + release.artifactId);
      checkArtifact(a);
      await canonicalMain(process.env.RELEASE_STAGE);
      const response = await fetch(
        "https://api.github.com/repos/" +
          release.repository +
          "/actions/artifacts/" +
          release.artifactId +
          "/zip",
        {
          headers: { Authorization: "Bearer " + process.env.GH_TOKEN },
          redirect: "manual",
          signal: AbortSignal.timeout(60000),
        },
      );
      assert.equal(response.status, 302);
      const url = new URL(response.headers.get("location"));
      assert.equal(url.protocol, "https:");
      assert.ok(!url.username && !url.password);
      const downloaded = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(60000),
      });
      assert.equal(downloaded.status, 200);
      const bytes = Buffer.from(await downloaded.arrayBuffer());
      checkArchive(bytes);
      writeFileSync(path("approved-publication.zip"), bytes);
      execFileSync("python3", [
        resolve(controller, "tools/release/rich-editorial-v1/extract.py"),
        path("approved-publication.zip"),
        root,
      ]);
      payload();
      receipt.status = "PASS";
      receipt.qualificationRun = release.qualificationRun;
      receipt.artifactId = release.artifactId;
    } else if (mode === "preflight") {
      payload();
      receipt.main = await canonicalMain(process.env.RELEASE_STAGE);
      receipt.provider = await provider();
      receipt.records = await content();
      wrangler(true);
      payload();
      receipt.status = "PASS";
    } else if (mode === "deploy") {
      const prior = load(path("preflight.json"));
      assert.equal(prior.status, "PASS");
      assert.equal(prior.controllerCommit, process.env.GITHUB_SHA);
      receipt.controllerQualificationRun = await controllerQualification();
      await publishOnce({
        preflight: async () => {
          payload();
          await canonicalMain("after");
          const fresh = await provider();
          assert.deepEqual(fresh, prior.provider);
          receipt.records = await content();
          checkVersions(
            active(await cf(cms + "/deployments")).version,
            active(await cf(worker + "/deployments")).version,
          );
          await canonicalMain("after");
          payload();
          receipt.previous = fresh.publication;
          save();
        },
        upload: () => wrangler(false),
        verify: async (version) => {
          receipt.active = await waitVersion(
            version,
            release.publicationVersion,
          );
          const after = await provider(version);
          assert.deepEqual(after.otherWorkers, prior.provider.otherWorkers);
          payload();
          receipt.status = "DEPLOYED_AWAITING_PUBLIC_VERIFICATION";
          delete receipt.pendingOperation;
        },
      });
    } else if (mode === "readback") {
      const m = payload(),
        deployed = load(path("deploy.json"));
      assert.equal(deployed.status, "DEPLOYED_AWAITING_PUBLIC_VERIFICATION");
      receipt.newVersion = deployed.newVersion;
      receipt.checks = [];
      const routes = m.files
        .filter((x) => x.path.endsWith(".html") && x.path !== "dist/404.html")
        .map((f) => ({
          route: "/" + f.path.slice(5).replace(/index\.html$/, ""),
          file: f,
        }));
      for (const name of [
        "search-index.json",
        "machine.json",
        "agent.json",
        "sitemap.xml",
        "sitemap-index.xml",
        "rss.xml",
        "robots.txt",
        "llms.txt",
      ]) {
        const file = m.files.find((x) => x.path === "dist/" + name);
        assert.ok(file);
        routes.push({ route: "/" + name, file });
      }
      async function publicGet(route, method = "GET") {
        let u = new URL(route, release.origin);
        for (let i = 0; i < 4; i++) {
          assert.equal(u.origin, release.origin);
          const r = await fetch(u, {
            method,
            redirect: "manual",
            signal: AbortSignal.timeout(30000),
          });
          if ([301, 302, 303, 307, 308].includes(r.status)) {
            u = new URL(r.headers.get("location"), u);
            continue;
          }
          return r;
        }
        throw Error("Excessive redirect");
      }
      let index = 0;
      await Promise.all(
        Array.from({ length: 4 }, async () => {
          while (index < routes.length) {
            const { route, file } = routes[index++];
            let ok = false;
            for (let i = 0; i < 6; i++) {
              const r = await publicGet(route),
                bytes = Buffer.from(await r.arrayBuffer()),
                digest = hash(bytes);
              receipt.checks.push({
                route,
                status: r.status,
                sha256: digest,
                attempt: i,
              });
              if (r.status === 200 && digest === file.sha256) {
                ok = true;
                break;
              }
              assert.ok(
                [200, 404, 503].includes(r.status),
                "Unexpected public response",
              );
              if (i < 5) await new Promise((r) => setTimeout(r, 2000));
            }
            assert.ok(ok, "Public payload mismatch " + route);
          }
        }),
      );
      const docs = load(
          resolve(root, "content/emdash/published.json"),
        ).documents,
        edited = docs.find(
          (x) => x.applicationId === "consumer.article.softcoded-systems",
        );
      receipt.search = [];
      for (const [query, title] of [
        ["Akal Imitasi", "Dignity"],
        ["Softcoded", edited.item.data.title],
      ]) {
        const r = await publicGet("/api/search?q=" + encodeURIComponent(query));
        assert.equal(r.status, 200);
        const b = await r.json();
        assert.equal(b.status, "succeeded");
        assert.ok(b.output.results.some((x) => x.title.includes(title)));
        receipt.search.push({
          query,
          status: r.status,
          matchedArtifactIds: b.output.matchedArtifactIds,
          expectedTitle: title,
        });
      }
      assert.equal((await publicGet("/api/search?q=")).status, 400);
      assert.equal((await publicGet("/api/search?q=Akal", "POST")).status, 405);
      receipt.malformedQueryStatus = 400;
      receipt.unsupportedMethodStatus = 405;
      receipt.records = await content();
      receipt.provider = await provider(deployed.newVersion);
      await canonicalMain("after");
      receipt.status = "PASS";
    } else {
      const prior = load(path("preflight.json"));
      assert.equal(prior.status, "PASS");
      assert.equal(prior.controllerCommit, process.env.GITHUB_SHA);
      assert.equal(prior.applicationCommit, release.candidate);
      assert.equal(prior.artifactSha256, release.artifactSha256);
      assert.equal(
        prior.provider.publication.version,
        release.publicationVersion,
      );
      const d = existsSync(path("deploy.json"))
        ? load(path("deploy.json"))
        : null;
      const current = active(await cf(worker + "/deployments"));
      if (!d?.uploads || current.version === release.publicationVersion) {
        assert.equal(current.version, release.publicationVersion);
        receipt.status = "NOT_REQUIRED";
      } else {
        assert.equal(d.uploads, 1);
        assert.ok(d.newVersion, "Ambiguous upload; inspect provider");
        assert.equal(
          current.version,
          d.newVersion,
          "Do not rollback another deployment",
        );
        receipt.pendingOperation = "ONE_PUBLICATION_ROLLBACK";
        save();
        await cf(worker + "/deployments", {
          strategy: "percentage",
          versions: [
            { version_id: release.publicationVersion, percentage: 100 },
          ],
          annotations: {
            "workers/message":
              "Restore pinned publication after Rich Editorial verification failure",
          },
        });
        receipt.active = await waitVersion(
          release.publicationVersion,
          current.version,
        );
        delete receipt.pendingOperation;
        receipt.status = "PASS";
      }
    }
    save();
    console.log(
      JSON.stringify({
        status: receipt.status,
        mode,
        controller: receipt.controllerCommit,
        application: release.candidate,
        uploads: receipt.uploads,
        newVersion: receipt.newVersion,
        records: receipt.records?.length,
        checks: receipt.checks?.length,
      }),
    );
  } catch (error) {
    receipt.status = "FAIL";
    receipt.failure = redact(error.message);
    save();
    throw Error(receipt.failure);
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
