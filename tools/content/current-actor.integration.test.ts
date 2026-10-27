// Copied into the pinned upstream test harness by the review-only workflow.
import { randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Role } from "@emdash-cms/auth";
import { SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NodeSqliteCompatDatabase as Sqlite } from "#node-sqlite";
import { EmDashRuntime } from "../../../src/emdash-runtime.js";
import { ContentRepository } from "../../../src/database/repositories/content.js";
import { UserRepository } from "../../../src/database/repositories/user.js";
import { definePlugin } from "../../../src/plugins/define-plugin.js";
import { PluginContextFactory } from "../../../src/plugins/context.js";
import { SchemaRegistry } from "../../../src/schema/registry.js";

const application = process.env.GAGA_AUTH_APPLICATION;
if (!application) throw Error("Explicit isolated application fixture required");
const { contentReleaseRoutes } = await import(pathToFileURL(application + "/cms/editorial/content-release.mjs").href);
const { nativePublishGate, signedContentMessage } = await import(pathToFileURL(application + "/cms/editorial/content-approval.mjs").href);
const { qualifyEditorial } = await import(pathToFileURL(application + "/editorial/content-release.mjs").href);
const { default: profile } = await import(pathToFileURL(application + "/content-release.json").href, { with: { type: "json" } });
const policy = "sha256:" + "a".repeat(64);
const secret = "isolated-native-proof-only-01234567890123456789";

describe("GAGA original actor revalidation through native EmDash routing and lifecycle", () => {
	let runtime: EmDashRuntime;
	let repo: ContentRepository;
	let actorId: string;
	let otherId: string;
	let itemId: string;
	let dispatches: Array<Record<string, any>>;
	let revokeAtNativeHook = false;
	let plugin: ReturnType<typeof definePlugin>;
	let fixtureContext: ReturnType<PluginContextFactory["createContext"]>;
	const request = async (action = "publish") => {
		const item = await repo.findById("posts", itemId);
		return { schema: "gaga.content-request/v1", action, resource: "posts/" + itemId,
			selectedRevision: action === "publish" ? item?.draftRevisionId : null, expectedPublishedRevision: item?.liveRevisionId ?? null };
	};
	const route = async (name: string, data: unknown, user: { id: string; role: typeof Role.AUTHOR } | null = null) => {
		const caller = user ? await new UserRepository(runtime.db).findById(user.id) : null;
		return runtime.handlePluginApiRoute("pakrpp-studio", "POST", "/" + name,
			new Request("https://isolated.example/_emdash/api/plugins/pakrpp-studio/" + name, {
				method: "POST", headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" }, body: JSON.stringify(data),
			}), caller);
	};

	const intent = async (action = "publish") => {
		const value = await route("content-publish", await request(action), { id: actorId, role: Role.AUTHOR });
		expect(value).toMatchObject({ success: true, data: { status: "PUBLISH PENDING" } });
		const last = dispatches.at(-1)!;
		expect(last.actor.id).not.toBe(actorId);
		return last;
	};
	const apply = async (selected: Record<string, any>) => route("content-apply", await signedContentMessage({
		schema: "gaga.content-message/v1", purpose: "apply-qualified-content", request: selected.request,
		nonce: selected.nonce, actorId: selected.actor.id, policyDigest: policy,
		planDigest: "sha256:" + "b".repeat(64), expiresAt: Date.now() + 60000,
	}, secret));
	const evidence = (name: string, audit: unknown, result: string) => {
		if (process.env.GAGA_AUTH_EVIDENCE) appendFileSync(process.env.GAGA_AUTH_EVIDENCE, JSON.stringify({ name, originalActor: actorId, audit, result, environment: "isolated-native-runtime", productionWrites: 0 }) + "\n");
	};
	beforeEach(async () => {
		dispatches = [];
		revokeAtNativeHook = false;
		plugin = definePlugin({
			id: "pakrpp-studio", version: "1.0.0", capabilities: ["content:read", "content:write", "content:publish", "content:revisions:read", "hooks.content-policy:register", "authorization:check"],
			routes: contentReleaseRoutes({ dispatch: async (selected: Record<string, any>) => { dispatches.push(selected); } }),
			hooks: { "content:beforePublish": async (event, ctx) => {
				if (revokeAtNativeHook) await new UserRepository(runtime.db).update(actorId, { role: "contributor" });
				return nativePublishGate(event, ctx);
			}, "content:beforeUnpublish": nativePublishGate },
		});
		const sqlite = new Sqlite(":memory:");
		runtime = await EmDashRuntime.create({ config: { database: { entrypoint: "isolated-auth-" + randomUUID(), config: {}, type: "sqlite" } },
			plugins: [plugin], createDialect: () => new SqliteDialect({ database: sqlite }), createStorage: null, sandboxEnabled: false, sandboxedPluginEntries: [], createSandboxRunner: null });
		const schema = new SchemaRegistry(runtime.db);
		for (const collection of ["posts", "authors"]) {
			await schema.createCollection({ slug: collection, label: collection });
			for (const [slug, type] of [["title", "string"], ["summary", "string"], ["content", "portableText"], ["integration", "json"]] as const) await schema.createField(collection, { slug, label: slug, type });
		}
		const users = new UserRepository(runtime.db);
		actorId = (await users.create({ email: "original@example.test", role: "author" })).id;
		otherId = (await users.create({ email: "other@example.test", role: "author" })).id;
		repo = new ContentRepository(runtime.db);
		const item = await repo.create({ type: "posts", slug: "isolated-authorization", authorId: actorId, data: {
			title: "Isolated authorization", summary: "Exact saved native revision",
			integration: { canonicalBodyField: "content" },
			content: [{ _type: "block", _key: "p", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "Current native authorization", marks: [] }] }],
		} });
		itemId = item.id;
		// Test-host configuration only; no provider credentials or production switches are available.
		fixtureContext = new PluginContextFactory(runtime["pipelineFactoryOptions"]).createContext(plugin);
		await fixtureContext.settings.set("contentReleaseEnabled", true);
		await fixtureContext.settings.set("contentReleaseKey", secret);
		await fixtureContext.settings.set("contentReleasePolicyDigest", policy);
	});
	afterEach(async () => { await runtime?.stopCron(); await runtime?.db.destroy(); });

	it("native intent prerequisites expose the exact qualified saved revision", async () => {
		const selected = await request();
		expect(await fixtureContext.authorization?.check({ actor: { type: "user", id: actorId }, permission: "content:publish_own", resource: { type: "content", collection: "posts", id: itemId } })).toEqual({ allowed: true });
		const current = await fixtureContext.content!.getVersioned!("posts", itemId);
		expect(current?.item).toMatchObject({ id: itemId, draftRevisionId: selected.selectedRevision, liveRevisionId: null });
		const revision = await fixtureContext.content!.getRevision!("posts", itemId, selected.selectedRevision!);
		expect(revision).toMatchObject({ id: selected.selectedRevision, collection: "posts", entryId: itemId });
		const documents = [];
		for (const collection of profile.collections) {
			const result = await fixtureContext.content!.list(collection, { where: { status: "published" }, limit: 100 });
			expect(result.hasMore).toBe(false);
			for (const item of result.items) documents.push({ item });
		}
		expect(qualifyEditorial({ request: selected, selected: { published: current!.item, revision }, profile, snapshot: { documents } }).title).toBe("Isolated authorization");
		expect(await fixtureContext.kv.compareAndSet("isolated-prerequisite", null, { allowed: true })).toMatchObject({ applied: true });
	});
	it("A: keeps original actor correlation and allows exact native publication when still authorized", async () => {
		const selected = await intent();
		const result = await apply(selected);
		expect(result).toMatchObject({ success: true, data: { status: "CMS_PUBLISHED_SITE_PENDING" } });
		expect((await repo.findById("posts", itemId))?.liveRevisionId).toBe(selected.request.selectedRevision);
		const audit = await fixtureContext.kv.get("content-authorization:" + selected.nonce + ":apply");
		expect(audit).toMatchObject({ actorId, intent: selected.nonce, allowed: true, result: "AUTHORIZED" });
		expect(await fixtureContext.kv.get("content-authorization:" + selected.nonce + ":native-hook")).toMatchObject({ actorId, allowed: true });
		evidence("A unchanged actor", audit, "APPLIED_NATIVE_REVISION");
		expect(await apply(selected)).toMatchObject({ data: { status: "DENIED" } });
	});
	for (const change of ["demoted", "disabled", "ownership", "removed"] as const) it("T1 accepted → " + change + " → T2 denied without native transition", async () => {
		const selected = await intent();
		if (change === "demoted") await new UserRepository(runtime.db).update(actorId, { role: "contributor" });
		if (change === "disabled") await runtime.db.updateTable("users").set({ disabled: 1 }).where("id", "=", actorId).execute();
		if (change === "ownership") await runtime.db.updateTable("ec_posts").set({ author_id: otherId }).where("id", "=", itemId).execute();
		if (change === "removed") await runtime.db.deleteFrom("users").where("id", "=", actorId).execute();
		const before = await repo.findById("posts", itemId);
		expect(await apply(selected)).toMatchObject({ data: { status: "DENIED" } });
		expect(await repo.findById("posts", itemId)).toEqual(before);
		expect(dispatches).toHaveLength(1);
		const audit = await fixtureContext.kv.get("content-authorization:" + selected.nonce + ":apply");
		expect(audit).toMatchObject({ actorId, intent: selected.nonce, allowed: false, result: "DENIED" });
		expect(Object.keys(audit as object).sort()).toEqual(["action", "actorId", "allowed", "checkedAt", "intent", "phase", "resource", "result"].sort());
		evidence(change, audit, "DENIED_ZERO_NATIVE_MUTATION");
	});
	it("Contributor and foreign owner cannot create a dispatch intent", async () => {
		const selected = await request();
		expect(await route("content-publish", selected, { id: otherId, role: Role.AUTHOR })).toMatchObject({ data: { status: "PUBLISH FAILED" } });
		await new UserRepository(runtime.db).update(actorId, { role: "contributor" });
		const result = await route("content-publish", selected, { id: actorId, role: Role.CONTRIBUTOR } as never);
		expect(result.success === false || (result as any).data?.status === "PUBLISH FAILED").toBe(true);
		expect(dispatches).toHaveLength(0);
		expect((await repo.findById("posts", itemId))?.liveRevisionId).toBeNull();
	});
	it("unpublish revalidates the original actor and preserves published state on revocation", async () => {
		await apply(await intent());
		const selected = await intent("unpublish");
		await runtime.db.updateTable("users").set({ disabled: 1 }).where("id", "=", actorId).execute();
		const before = await repo.findById("posts", itemId);
		expect(await apply(selected)).toMatchObject({ data: { status: "DENIED" } });
		expect(await repo.findById("posts", itemId)).toEqual(before);
	});
	it("unpublish uses the same native lifecycle when authority remains valid", async () => {
		await apply(await intent());
		expect(await apply(await intent("unpublish"))).toMatchObject({ data: { status: "CMS_PUBLISHED_SITE_PENDING" } });
		expect((await repo.findById("posts", itemId))?.liveRevisionId).toBeNull();
	});
	it("rechecks a role revoked after the apply decision at the native lifecycle boundary", async () => {
		const selected = await intent();
		revokeAtNativeHook = true;
		expect(await apply(selected)).toMatchObject({ data: { status: "DENIED" } });
		expect((await repo.findById("posts", itemId))?.liveRevisionId).toBeNull();
		expect(await fixtureContext.kv.get("content-authorization:" + selected.nonce + ":apply")).toMatchObject({ allowed: true });
		expect(await fixtureContext.kv.get("content-authorization:" + selected.nonce + ":native-hook")).toMatchObject({ actorId, allowed: false });
	});
	it("current disable switch and a native lifecycle recheck deny late authority changes", async () => {
		const selected = await intent();
		await fixtureContext.settings.set("contentReleaseEnabled", false);
		expect(await apply(selected)).toMatchObject({ data: { status: "DENIED" } });
		expect((await repo.findById("posts", itemId))?.liveRevisionId).toBeNull();
	});
});
