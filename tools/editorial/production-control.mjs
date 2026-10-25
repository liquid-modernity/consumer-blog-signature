// Existing application CMS only. Inspect/recovery are read-only; deploy accepts one checksum-pinned qualified artifact.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const root = process.cwd(),
  mode = process.argv[2],
  out = process.env.GAGA_EVIDENCE_DIRECTORY,
  token = process.env.CLOUDFLARE_API_TOKEN,
  account = process.env.CLOUDFLARE_ACCOUNT_ID;
assert.ok(["inspect", "backup", "deploy-cms"].includes(mode));
assert.ok(out && token && account);
assert.ok(!resolve(out).startsWith(root + "/"));
mkdirSync(out, { recursive: true });
const load = (p) => JSON.parse(readFileSync(p)),
  hash = (b) => createHash("sha256").update(b).digest("hex"),
  redact = (x) =>
    String(x).replaceAll(token, "[REDACTED]").replaceAll(account, "[ACCOUNT]");
const plan = load("cms/editorial/migration-plan.json"),
  spec = load("cms/production.json"),
  cfg = load("cms/wrangler.jsonc"),
  base = `/accounts/${account}`,
  cms = base + "/workers/scripts/" + spec.serviceName,
  publication = base + "/workers/scripts/consumer-blog-signature";
assert.equal(spec.serviceName, "consumer-blog-signature-cms");
assert.equal(plan.origin, spec.origin);
assert.equal(cfg.d1_databases[0].database_id, plan.rollback.d1);
assert.equal(cfg.r2_buckets[0].bucket_name, plan.rollback.r2);
assert.equal(cfg.kv_namespaces[0].id, plan.rollback.kv);
const receipt = {
  status: "RUNNING",
  mode,
  source: process.env.GITHUB_SHA,
  planSha256: hash(readFileSync("cms/editorial/migration-plan.json")),
  sourceSetSha256: plan.sourceSetSha256,
  uploads: 0,
  resourceCreates: 0,
  contentWrites: 0,
  schemaWrites: 0,
};
const save = () =>
  writeFileSync(
    resolve(out, "production-" + mode + ".json"),
    JSON.stringify(receipt, null, 2) + "\n",
    { mode: 0o600 },
  );
async function get(path) {
  const r = await fetch("https://api.cloudflare.com/client/v4" + path, {
    headers: { Authorization: "Bearer " + token },
    redirect: "error",
    signal: AbortSignal.timeout(25000),
  });
  const b = await r.json();
  assert.ok(
    r.ok && b.success,
    `Provider GET HTTP${r.status}; codes ${(b.errors ?? []).map((x) => x.code)}`,
  );
  return b.result;
}
async function query(sql) {
  assert.ok(/^SELECT [^;]+$/i.test(sql));
  const r = await fetch(
    "https://api.cloudflare.com/client/v4" +
      base +
      "/d1/database/" +
      plan.rollback.d1 +
      "/query",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
      redirect: "error",
      signal: AbortSignal.timeout(25000),
    },
  );
  const b = await r.json();
  assert.ok(r.ok && b.success, "Read-only D1 query failed HTTP" + r.status);
  assert.equal(b.result.length, 1);
  assert.equal(b.result[0].success, true);
  assert.equal(b.result[0].meta.changes ?? 0, 0);
  return b.result[0].results;
}
function active(result) {
  const d = result.deployments?.[0];
  assert.ok(
    d && d.versions.length === 1 && d.versions[0].percentage === 100,
    "Require one active 100% version",
  );
  return { id: d.id, version: d.versions[0].version_id };
}
function bindings(actual) {
  for (const [name, type, key, value] of [
    ["DB", "d1", "id", plan.rollback.d1],
    ["MEDIA", "r2_bucket", "bucket_name", plan.rollback.r2],
    ["SESSION", "kv_namespace", "namespace_id", plan.rollback.kv],
  ]) {
    const rows = actual.filter((x) => x.name === name);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].type, type);
    assert.equal(rows[0][key], value);
  }
  assert.ok(
    actual.every((x) => ["DB", "MEDIA", "SESSION", "ASSETS"].includes(x.name)),
    "Unexpected binding",
  );
  return actual.filter((x) => x.name !== "ASSETS");
}
const inventory = () => {
  const list = [];
  function walk(dir) {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, f.name);
      if (f.isDirectory()) walk(path);
      else {
        assert.ok(f.isFile());
        list.push({
          path: relative(root, path),
          sha256: hash(readFileSync(path)),
        });
      }
    }
  }
  walk("cms/dist-cloudflare");
  return list.sort((a, b) => a.path.localeCompare(b.path));
};
try {
  assert.equal((await get("/user/tokens/verify")).status, "active");
  assert.equal((await get(base + "/workers/subdomain")).subdomain, "ratriatra");
  assert.equal(
    (await get(base + "/d1/database/" + plan.rollback.d1)).name,
    spec.databaseName,
  );
  assert.equal(
    (await get(base + "/r2/buckets/" + plan.rollback.r2)).name,
    spec.mediaBucket,
  );
  assert.ok(
    (await get(base + "/storage/kv/namespaces")).some(
      (x) => x.id === plan.rollback.kv && x.title === spec.sessionNamespace,
    ),
  );
  receipt.cms = active(await get(cms + "/deployments"));
  receipt.publication = active(await get(publication + "/deployments"));
  assert.equal(
    receipt.cms.version,
    plan.rollback.cmsWorker,
    "CMS changed since plan",
  );
  assert.equal(
    receipt.publication.version,
    plan.rollback.publicationWorker,
    "Publication changed since plan",
  );
  receipt.bindings = bindings((await get(cms + "/settings")).bindings);
  receipt.schema = await query(
    "SELECT name,type,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  receipt.collections = await query(
    "SELECT slug,label,supports,routable FROM _emdash_collections ORDER BY slug",
  );
  receipt.fields = await query(
    "SELECT c.slug AS collection,f.slug,f.type,f.widget,f.required FROM _emdash_fields AS f JOIN _emdash_collections AS c ON c.id=f.collection_id ORDER BY c.slug,f.slug",
  );
  receipt.migrations = (
    await query("SELECT name FROM _emdash_migrations ORDER BY name")
  ).map((x) => x.name);
  const expected = [
    ...readFileSync(
      "cms/node_modules/emdash/src/database/migrations/runner.ts",
      "utf8",
    ).matchAll(/"(\d{3}_[^"]+)": m\d+/g),
  ]
    .map((x) => x[1])
    .sort();
  assert.equal(expected.length, 90);
  assert.deepEqual(
    receipt.migrations,
    expected,
    "Pending/unknown core migrations",
  );
  receipt.counts = {};
  for (const table of [
    "ec_posts",
    "ec_authors",
    "revisions",
    "users",
    "media",
    "credentials",
    "_emdash_api_tokens",
  ])
    receipt.counts[table] = (
      await query("SELECT COUNT(*) AS count FROM " + table)
    )[0].count;
  assert.equal(receipt.counts.ec_posts, 7);
  assert.equal(receipt.counts.ec_authors, 1);
  assert.equal(receipt.counts.users, 1);
  if (mode === "backup") {
    assert.equal(
      process.env.GAGA_EDITORIAL_FREEZE_CONFIRMED,
      "true",
      "Operator and workflow freeze must be confirmed",
    );
    assert.deepEqual(
      receipt.collections.map((x) => x.slug),
      ["authors", "posts"],
    );
    const bookmark = await get(
      base + "/d1/database/" + plan.rollback.d1 + "/time_travel/bookmark",
    );
    assert.ok(
      typeof bookmark.bookmark === "string" && bookmark.bookmark.length > 10,
      "No recoverable D1 bookmark",
    );
    receipt.recovery = {
      kind: "D1_TIME_TRAVEL_RECOVERABLE_SNAPSHOT",
      databaseId: plan.rollback.d1,
      bookmark: bookmark.bookmark,
      capturedAt: new Date().toISOString(),
      retention:
        "Provider plan-dependent (7 or 30 days); same-day recovery required",
      restoreApi: `/accounts/[ACCOUNT]/d1/database/${plan.rollback.d1}/time_travel/restore`,
      restoreBody: { bookmark: bookmark.bookmark },
      restoreRequiresNoNewOperatorEditsAndCoordinatedWorkerSourceExportState: true,
      documentation:
        "https://developers.cloudflare.com/d1/reference/time-travel/",
    };
  }
  if (mode === "deploy-cms") {
    const admission = load(process.env.GAGA_CMS_ARTIFACT_ADMISSION);
    assert.equal(admission.status, "PASS");
    assert.equal(admission.planSha256, receipt.planSha256);
    assert.equal(
      hash(readFileSync(admission.archive)),
      admission.artifactSha256,
    );
    assert.deepEqual(inventory(), admission.files);
    assert.deepEqual(
      receipt.collections.map((x) => x.slug),
      ["authors", "pages", "posts", "references", "sections"],
    );
    for (const c of ["pages", "references", "sections"])
      assert.equal(
        (await query(`SELECT COUNT(*) AS count FROM ec_${c}`))[0].count,
        0,
        "Unexpected library/Page content",
      );
    const generated = load("cms/dist-cloudflare/server/wrangler.json");
    if (generated.d1_databases?.[0]?.migrations_dir !== undefined)
      assert.equal(
        generated.d1_databases[0].migrations_dir,
        "../../migrations",
      );
    assert.equal(generated.name, spec.serviceName);
    assert.deepEqual(
      generated.d1_databases.map(({ migrations_dir, ...x }) => x),
      cfg.d1_databases,
    );
    assert.deepEqual(generated.r2_buckets, cfg.r2_buckets);
    assert.deepEqual(generated.kv_namespaces, cfg.kv_namespaces);
    for (const [key, empty] of Object.entries({
      routes: [],
      route: undefined,
      services: [],
      queues: { producers: [], consumers: [] },
      durable_objects: { bindings: [] },
      worker_loaders: [],
      unsafe: {},
    }))
      if (generated[key] !== undefined)
        assert.deepEqual(
          generated[key],
          empty,
          "Unapproved runtime scope " + key,
        );
    receipt.artifactSha256 = admission.artifactSha256;
    receipt.qualificationRun = admission.qualificationRun;
    receipt.rollback = { cms: receipt.cms, publication: receipt.publication };
    receipt.beforeFiles = admission.files;
    save();
    const args = [
      resolve("cms/node_modules/wrangler/bin/wrangler.js"),
      "deploy",
      "--config",
      resolve("cms/dist-cloudflare/server/wrangler.json"),
      "--experimental-provision=false",
      "--experimental-auto-create=false",
    ];
    for (const dry of [true, false]) {
      assert.deepEqual(inventory(), admission.files);
      if (!dry) {
        assert.equal(
          active(await get(cms + "/deployments")).version,
          plan.rollback.cmsWorker,
        );
        assert.equal(
          active(await get(publication + "/deployments")).version,
          plan.rollback.publicationWorker,
        );
        receipt.uploads++;
        receipt.pendingOperation =
          "ONE_CMS_UPLOAD_INSPECT_RESULT_BEFORE_ANY_FURTHER_MUTATION";
        save();
      }
      const r = spawnSync(
        process.execPath,
        [
          ...args,
          ...(dry
            ? ["--dry-run", "--outdir", resolve(out, "cms-dry-run")]
            : []),
        ],
        {
          cwd: resolve("cms"),
          env: { ...process.env, CI: "true", WRANGLER_SEND_METRICS: "false" },
          encoding: "utf8",
          timeout: 240000,
          maxBuffer: 8 * 1024 * 1024,
        },
      );
      const log = redact(
        (r.stdout ?? "") + (r.stderr ?? "") + (r.error?.message ?? ""),
      );
      writeFileSync(
        resolve(out, dry ? "cms-dry-run.log" : "cms-upload.log"),
        log,
        { mode: 0o600 },
      );
      assert.equal(
        r.status,
        0,
        dry
          ? "CMS dry run failed"
          : "CMS upload failed or ambiguous; do not retry",
      );
      if (!dry) {
        const found = log.match(/Current Version ID:\s*([a-f0-9-]{36})/);
        assert.ok(found, "Unambiguous deployed version missing");
        receipt.newVersion = found[1];
        save();
      }
    }
    for (let i = 0; i < 6; i++) {
      receipt.active = active(await get(cms + "/deployments"));
      if (receipt.active.version === receipt.newVersion) break;
      assert.equal(
        receipt.active.version,
        plan.rollback.cmsWorker,
        "Competing CMS deployment",
      );
      if (i < 5) await new Promise((r) => setTimeout(r, 2000));
    }
    assert.equal(receipt.active.version, receipt.newVersion);
    assert.deepEqual(inventory(), admission.files);
    bindings((await get(cms + "/settings")).bindings);
    assert.equal(
      active(await get(publication + "/deployments")).version,
      plan.rollback.publicationWorker,
      "Publication Worker changed",
    );
    const origin = plan.origin,
      health = await fetch(origin + "/_emdash/api/setup/status", {
        redirect: "error",
        signal: AbortSignal.timeout(25000),
      });
    assert.equal(health.status, 200);
    const b = await health.json();
    assert.equal(b.success, true);
    assert.equal(b.data.needsSetup, false, "Existing admin/setup must survive");
    const admin = await fetch(origin + "/_emdash/admin", {
      redirect: "manual",
      signal: AbortSignal.timeout(25000),
    });
    assert.ok([200, 302, 303, 307].includes(admin.status));
    if (admin.status !== 200) {
      const target = new URL(admin.headers.get("location"), origin);
      assert.equal(target.origin, origin);
      assert.ok(!target.pathname.endsWith("/setup"));
      assert.equal(
        (
          await fetch(target, {
            redirect: "error",
            signal: AbortSignal.timeout(25000),
          })
        ).status,
        200,
      );
      receipt.adminRedirect = target.pathname;
    }
    receipt.adminHttpStatus = admin.status;
    receipt.setupHttpStatus = health.status;
    delete receipt.pendingOperation;
  }
  receipt.status = "PASS";
  save();
  console.log(
    JSON.stringify({
      status: "PASS",
      mode,
      uploads: receipt.uploads,
      resourceCreates: 0,
      contentWrites: 0,
      schemaWrites: 0,
      cms: receipt.newVersion ?? receipt.cms.version,
      publication: receipt.publication.version,
      recoverableSnapshot: !!receipt.recovery,
    }),
  );
} catch (error) {
  receipt.status = "FAIL";
  receipt.failure = redact(error.message);
  save();
  throw Error(receipt.failure);
}
