// Prove the pinned public contract on an isolated native CMS, never production.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { request } from "@playwright/test";

assert.equal(process.version, "v22.23.4", "Hosted Node 22.23.4 is required");
const root = resolve(import.meta.dirname, "../.."),
  out = resolve(process.env.GAGA_EVIDENCE_DIRECTORY ?? ""),
  state = mkdtempSync(resolve(tmpdir(), "gaga-native-account-proof-"));
assert.ok(process.env.GAGA_EVIDENCE_DIRECTORY && relative(root, out).startsWith(".."));
mkdirSync(out, { recursive: true });
const env = { ...process.env, ASTRO_TELEMETRY_DISABLED: "1", GAGA_AUTH_PROOF_DB: resolve(state, "cms.db") };
for (const k of Object.keys(env))
  if (/^(CMS_|CLOUDFLARE_|GH_TOKEN$|GITHUB_TOKEN$|GAGA_CONTENT_)/.test(k)) delete env[k];
const child = spawn(process.execPath, ["node_modules/astro/bin/astro.mjs", "dev", "--config", "authorization-proof/astro.config.mjs"], {
  cwd: resolve(root, "cms"), env, stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
for (const stream of [child.stdout, child.stderr]) stream.on("data", b => { if (log.length < 2e6) log += b; });
const client = await request.newContext({ baseURL: "http://127.0.0.1:4327" });
const receipt = { status: "RUNNING", node: process.version, package: "emdash@1.3.1", productionMutations: 0, productionCredentials: false, implementedGrantSystem: false, cases: [] };
let db;
const call = async (path, headers = { "X-EmDash-Request": "1" }) => {
  const r = await client.get("/_emdash/api/" + path, { headers });
  return { status: r.status(), data: (await r.json()).data };
};
const post = async (path, data) => {
  const r = await client.post("/_emdash/api/" + path, { headers: { "X-EmDash-Request": "1" }, data });
  return { status: r.status(), ...await r.json() };
};
try {
  for (let i = 0; i < 120; i++) {
    assert.equal(child.exitCode, null, "Native fixture exited; inspect contract.log");
    try { const r = await client.get("/_emdash/api/setup/status", { timeout: 1000 }); if (r.status() === 200) break; }
    catch {}
    if (i === 119) throw Error("Native fixture did not start");
    await new Promise(r => setTimeout(r, 500));
  }
  assert.equal((await call("setup/dev-bypass?content=0")).status, 200);
  const me = (await call("auth/me")).data;
  assert.ok(me.id);
  db = new DatabaseSync(env.GAGA_AUTH_PROOF_DB);
  const role = n => db.prepare("UPDATE users SET role = ? WHERE id = ?").run(n, me.id);
  const path = "plugins/authorization-contract-proof/";
  const schema = await post("schema/collections", { slug: "authorization_entries", label: "Local authorization proof", routable: false, supports: ["drafts", "revisions"] });
  assert.equal(schema.success, true);
  assert.equal((await post("schema/collections/authorization_entries/fields", { slug: "title", label: "Title", type: "string", required: true })).success, true);
  const created = await post("content/authorization_entries", { slug: "native-proof", data: { title: "Local proof" } });
  assert.equal(created.success, true);
  const entry = created.data.item;
  for (const action of ["publish", "unpublish"]) {
    const current = (await call("content/authorization_entries/" + entry.id)).data;
    const denied = await post("content/authorization_entries/" + entry.id + "/" + action, { _rev: current._rev });
    assert.equal(denied.success, false);
    assert.match(denied.error.message, new RegExp("NATIVE_PROOF_" + action.toUpperCase() + "_DENIED"));
    assert.equal((await call("content/authorization_entries/" + entry.id)).data.item.liveRevisionId, null);
    receipt.cases.push("native before-" + action + " policy hook blocks publication");
  }
  assert.equal((await call(path + "own", {})).status, 403);
  receipt.cases.push("native private-route CSRF rejection");
  for (const [level, own, other, manage] of [[10, false, false, false], [20, false, false, false], [30, true, false, false], [40, true, true, false], [50, true, true, true]]) {
    role(level);
    const a = await call(path + "own"), b = await call(path + "own?owner=other-account"), c = await call(path + "accounts");
    assert.equal(a.status, own ? 200 : 403);
    if (own) { assert.equal(a.data.allowed, true); assert.equal(b.data.allowed, other); assert.equal(a.data.actorId, me.id); }
    assert.equal(c.status, manage ? 200 : 403);
    receipt.cases.push({ role: level, own, other, managesAccounts: manage });
  }
  role(30);
  const before = await call(path + "directory?id=" + me.id);
  assert.equal(before.status, 200); assert.equal(before.data.callerBound, false);
  assert.equal(Object.hasOwn(before.data.account, "disabled"), false);
  db.prepare("UPDATE users SET disabled = 1 WHERE id = ?").run(me.id);
  assert.ok([401, 403].includes((await call(path + "own")).status));
  const disabled = await call(path + "directory?id=" + me.id);
  assert.deepEqual(disabled.data, before.data, "Public plugin directory must reproduce the status-omission blocker");
  const missing = await call(path + "directory?id=missing-account");
  assert.equal(missing.data.account, null);
  receipt.cases.push("native authenticated route rejects disabled account", "directory cannot distinguish enabled/disabled account", "public route has no authenticated caller", "missing account returns null");
  receipt.status = "PASS";
  receipt.editorialAuthorization = "BLOCKED";
  receipt.blocker = "EmDash 1.3.1 public plugin UserInfo/UserAccess omits disabled status; public delayed apply has no authenticated caller. No grant or host signature establishes current account eligibility.";
  console.log(JSON.stringify(receipt));
} catch (e) { receipt.status = "FAIL"; receipt.failure = e.message; throw e; }
finally {
  db?.close(); await client.dispose(); child.kill("SIGTERM");
  await Promise.race([new Promise(r => child.once("close", r)), new Promise(r => setTimeout(r, 3000))]);
  if (child.exitCode === null) child.kill("SIGKILL");
  writeFileSync(resolve(out, "native-authorization-contract.json"), JSON.stringify(receipt, null, 2) + "\n");
  writeFileSync(resolve(out, "contract.log"), log);
}
