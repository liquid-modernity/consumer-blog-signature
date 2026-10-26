import profile from "../../content-release.json" with { type: "json" };
const canonical = (x) =>
  JSON.stringify(x, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  );
const bytes = (x) => new TextEncoder().encode(canonical(x));
async function key(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function signedContentMessage(payload, secret) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await key(secret),
    bytes(payload),
  );
  return {
    payload,
    signature: Array.from(new Uint8Array(signature), (x) =>
      x.toString(16).padStart(2, "0"),
    ).join(""),
  };
}
export async function verifiedContentMessage(
  message,
  secret,
  policyDigest,
  purpose,
) {
  if (
    !secret ||
    secret.length < 32 ||
    !policyDigest ||
    !message?.payload ||
    !/^[a-f0-9]{64}$/.test(message.signature ?? "")
  )
    throw Error("Denied");
  const signature = Uint8Array.from(message.signature.match(/../g), (x) =>
      parseInt(x, 16),
    ),
    p = message.payload;
  if (
    !(await crypto.subtle.verify(
      "HMAC",
      await key(secret),
      signature,
      bytes(p),
    )) ||
    p.schema !== "gaga.content-message/v1" ||
    p.purpose !== purpose ||
    p.policyDigest !== policyDigest ||
    typeof p.expiresAt !== "number" ||
    p.expiresAt < Date.now() ||
    p.expiresAt > Date.now() + 300000 ||
    !/^[A-Za-z0-9-]{8,128}$/.test(p.nonce ?? "")
  )
    throw Error("Denied");
  return p;
}
export async function nativePublishGate(event, ctx) {
  if (!["posts", "authors"].includes(event.collection)) return;
  const item = event.content,
    approval = await ctx.kv.get(
      "content-inflight:" + event.collection + "/" + item.id,
    );
  if (
    event.origin?.source !== "plugin" ||
    event.origin.pluginId !== "pakrpp-studio" ||
    !approval ||
    approval.expiresAt < Date.now() ||
    approval.request.expectedPublishedRevision !== item.liveRevisionId ||
    (approval.request.action === "publish" &&
      approval.request.selectedRevision !== item.draftRevisionId)
  )
    return {
      cancel: true,
      reason:
        "Use Preview and publish to release a saved revision. Your draft is preserved.",
    };
}
export function contentApprovalRoutes() {
  return {
    "content-baseline": {
      public: true,
      methods: ["POST"],
      request: { body: "json", maxBytes: 2048 },
      handler: async (ctx) => {
        try {
          await verifiedContentMessage(
            ctx.input,
            await ctx.settings.get("contentReleaseKey"),
            await ctx.settings.get("contentReleasePolicyDigest"),
            "read-release-baseline",
          );
          return { release: await ctx.kv.get("content-current-release") };
        } catch {
          return { status: "DENIED" };
        }
      },
    },
    "content-apply": {
      public: true,
      methods: ["POST"],
      request: { body: "json", maxBytes: 8192 },
      handler: async (ctx) => {
        let lock;
        try {
          const policy = await ctx.settings.get("contentReleasePolicyDigest"),
            secret = await ctx.settings.get("contentReleaseKey"),
            p = await verifiedContentMessage(
              ctx.input,
              secret,
              policy,
              "apply-qualified-content",
            );
          if (
            (p.request?.notBefore &&
              !(Date.parse(p.request.notBefore) <= Date.now())) ||
            !/^sha256:[a-f0-9]{64}$/.test(p.planDigest ?? "")
          )
            throw Error("Denied");
          const pending = await ctx.kv.getVersioned(
            "content-intent:" + p.nonce,
          );
          if (
            !pending ||
            canonical(pending.value.request) !== canonical(p.request) ||
            pending.value.expiresAt < Date.now() ||
            (pending.value.actorBinding ?? pending.value.actorId) !== p.actorId
          )
            throw Error("Denied");
          if (
            !["publish", "unpublish"].includes(p.request.action) ||
            !/^posts\/[A-Za-z0-9_-]+$|^authors\/[A-Za-z0-9_-]+$/.test(
              p.request.resource,
            )
          )
            throw Error("Denied");
          const [collection, id] = p.request.resource.split("/"),
            current = await ctx.content.getVersioned(collection, id);
          if (
            !current ||
            current.item.liveRevisionId !==
              p.request.expectedPublishedRevision ||
            (p.request.action === "publish" &&
              current.item.draftRevisionId !== p.request.selectedRevision)
          )
            throw Error("Conflict");
          const inflight = "content-inflight:" + p.request.resource;
          lock = await ctx.kv.compareAndSet(inflight, null, p);
          if (!lock.applied) throw Error("Busy");
          // Native EmDash still owns the actual revision transition and optimistic concurrency.
          const result = await ctx.content[p.request.action](collection, id, {
            _rev: current._rev,
          });
          await ctx.kv.compareAndSet(
            "content-intent:" + p.nonce,
            pending.revision,
            {
              ...pending.value,
              state: "CMS_PUBLISHED_SITE_PENDING",
              liveRevision: result.item.liveRevisionId,
            },
          );
          return {
            status: "CMS_PUBLISHED_SITE_PENDING",
            liveRevision: result.item.liveRevisionId,
          };
        } catch {
          return {
            status: "DENIED",
            message:
              "The saved revision could not be applied. Inspect the current state before retrying.",
          };
        } finally {
          if (lock?.applied)
            await ctx.kv.compareAndDelete(
              "content-inflight:" + ctx.input.payload.request.resource,
              lock.revision,
            );
        }
      },
    },
    "content-result": {
      public: true,
      methods: ["POST"],
      request: { body: "json", maxBytes: 8192 },
      handler: async (ctx) => {
        try {
          const p = await verifiedContentMessage(
              ctx.input,
              await ctx.settings.get("contentReleaseKey"),
              await ctx.settings.get("contentReleasePolicyDigest"),
              "record-release-result",
            ),
            pending = await ctx.kv.getVersioned("content-intent:" + p.nonce);
          const terminal = ["PUBLISHED", "UNPUBLISHED"].includes(p.status);
          if (
            !pending ||
            (pending.value.actorBinding ?? pending.value.actorId) !==
              p.actorId ||
            ![
              "PUBLISHED",
              "UNPUBLISHED",
              "PUBLISH PENDING",
              "PUBLISH FAILED",
            ].includes(p.status) ||
            (terminal &&
              (pending.value.state !== "CMS_PUBLISHED_SITE_PENDING" ||
                !/^sha256:[a-f0-9]{64}$/.test(p.releaseSealDigest ?? ""))) ||
            (p.status === "PUBLISH FAILED" &&
              pending.value.state === "CMS_PUBLISHED_SITE_PENDING")
          )
            throw Error("Denied");
          if (terminal && p.nextBaseline) {
            if (
              p.nextBaseline.schema !== "gaga.release/v1" ||
              p.nextBaseline.release?.class !== "content" ||
              p.nextBaseline.source?.commit !==
                (await ctx.settings.get("contentReleaseSource"))
            )
              throw Error("Denied");
            if (
              p.nextBaseline.target?.origin !== profile.publicationOrigin ||
              p.nextBaseline.content?.origin !== profile.cmsOrigin
            )
              throw Error("Denied");
            const previous = await ctx.kv.getVersioned(
              "content-current-release",
            );
            const expected = previous
              ? "sha256:" +
                Array.from(
                  new Uint8Array(
                    await crypto.subtle.digest(
                      "SHA-256",
                      bytes(previous.value.payload.nextBaseline),
                    ),
                  ),
                  (x) => x.toString(16).padStart(2, "0"),
                ).join("")
              : await ctx.settings.get("contentReleaseBootstrapDigest");
            if (p.previousBaselineDigest !== expected) throw Error("Conflict");
            const stored = await ctx.kv.compareAndSet(
              "content-current-release",
              previous?.revision ?? null,
              ctx.input,
            );
            if (!stored.applied) throw Error("Conflict");
          }
          await ctx.kv.compareAndSet(
            "content-intent:" + p.nonce,
            pending.revision,
            { ...pending.value, editorialStatus: p.status },
          );
          return { status: "RECORDED" };
        } catch {
          return { status: "DENIED" };
        }
      },
    },
  };
}
