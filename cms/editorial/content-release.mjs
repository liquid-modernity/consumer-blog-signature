import {
  contentApprovalRoutes,
  signedContentMessage,
} from "./content-approval.mjs";
import profile from "../../content-release.json" with { type: "json" };
import {
  qualifyEditorial,
  previewDocument,
} from "../../editorial/content-release.mjs";
const canonicalRequest = (x) =>
  JSON.stringify(x, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  );
const check = (x, message) => {
  if (!x) throw Error(message);
};
async function configuredDispatcher(ctx) {
  const enabled = await ctx.settings?.get("contentReleaseEnabled");
  if (enabled !== true) return null;
  const key = await ctx.settings?.get("contentReleaseKey"),
    policyDigest = await ctx.settings?.get("contentReleasePolicyDigest"),
    token = await ctx.settings?.get("contentReleaseDispatchToken"),
    workflow = await ctx.settings?.get("contentReleaseWorkflowId"),
    ref = await ctx.settings?.get("contentReleaseSource"),
    bootstrap = await ctx.settings?.get("contentReleaseBootstrapDigest");
  if (
    !key ||
    key.length < 32 ||
    !/^sha256:[a-f0-9]{64}$/.test(policyDigest ?? "") ||
    !/^sha256:[a-f0-9]{64}$/.test(bootstrap ?? "") ||
    !token ||
    !/^\d+$/.test(workflow ?? "") ||
    !/^[a-f0-9]{40}$/.test(ref ?? "") ||
    !ctx.http
  )
    return null;
  return async (intent) => {
    const signed = await signedContentMessage(
      {
        schema: "gaga.content-message/v1",
        purpose: "editorial-intent",
        requestDigest:
          "sha256:" +
          Array.from(
            new Uint8Array(
              await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(canonicalRequest(intent.request)),
              ),
            ),
            (x) => x.toString(16).padStart(2, "0"),
          ).join(""),
        ...intent,
        actorId: intent.actor.id,
        policyDigest,
        applicationCommit: ref,
        expiresAt: Date.now() + 300000,
      },
      key,
    );
    const response = await ctx.http.fetch(
      "https://api.github.com/repos/" +
        profile.repository +
        "/actions/workflows/" +
        workflow +
        "/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
          "User-Agent": "GAGA-Content-Host/1",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: { operation: "publish", intent: JSON.stringify(signed) },
        }),
      },
    );
    check(
      response.status === 204,
      "Publishing service did not accept this action.",
    );
  };
}
export function contentReleaseRoutes({ dispatch = null } = {}) {
  async function selected(ctx) {
    check(ctx.user?.id, "Sign in before previewing or publishing.");
    const x = ctx.input;
    check(
      x &&
        Object.keys(x).every((k) =>
          [
            "schema",
            "action",
            "resource",
            "selectedRevision",
            "expectedPublishedRevision",
            "notBefore",
          ].includes(k),
        ) &&
        x.schema === "gaga.content-request/v1" &&
        ["publish", "unpublish"].includes(x.action),
      "Choose a saved article.",
    );
    check(
      typeof x.resource === "string" &&
        /^[a-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(x.resource),
      "Choose a saved article.",
    );
    const [collection, id] = x.resource.split("/");
    check(
      profile.collections.includes(collection),
      "This content needs application review.",
    );
    const current = await ctx.content.getVersioned(collection, id);
    check(
      current?.item &&
        current.item.liveRevisionId === x.expectedPublishedRevision,
      "The published article changed. Review the newer version.",
    );
    check(
      x.action !== "publish" ||
        current.item.draftRevisionId === x.selectedRevision,
      "The draft changed. Save and select it again.",
    );
    const revision = await ctx.content.getRevision(
      collection,
      id,
      x.action === "publish" ? x.selectedRevision : x.expectedPublishedRevision,
    );
    check(
      revision &&
        revision.id === (x.action === "publish" ? x.selectedRevision : x.expectedPublishedRevision) &&
        revision.collection === collection && revision.entryId === id,
      "That saved revision is unavailable.",
    );
    const documents = [];
    for (const c of profile.collections) {
      const list = await ctx.content.list(c, {
        where: { status: "published" },
        limit: 100,
      });
      check(!list.hasMore, "The content catalog needs application review.");
      for (const item of list.items) documents.push({ item });
    }
    const result = qualifyEditorial({
      request: x,
      selected: { published: current.item, revision },
      profile,
      snapshot: { documents },
    });
    return { request: x, current, revision, result };
  }
  return {
    ...contentApprovalRoutes(),
    "content-status": {
      public: false,
      permission: "content:publish_any",
      methods: ["POST"],
      request: { body: "json", maxBytes: 1024 },
      handler: async (ctx) => {
        const value =
          ctx.user?.id &&
          (await ctx.kv.get("content-intent:" + ctx.input?.nonce));
        if (!value || value.actorId !== ctx.user.id)
          return { status: "DENIED" };
        const status = value.editorialStatus ?? "PUBLISH PENDING";
        return {
          status,
          message:
            status === "PUBLISHED"
              ? "Your article is live."
              : status === "UNPUBLISHED"
                ? "Your article is no longer public. Its history is preserved."
                : status === "PUBLISH FAILED"
                  ? "The article changed or could not be released. Your revision history is preserved. Review the saved version before trying again."
                  : value.state === "CMS_PUBLISHED_SITE_PENDING"
                    ? "Your article was published but is not live yet. Do not publish again. Ask your site administrator to check."
                    : "Your article is being checked. Your draft is preserved.",
        };
      },
    },
    "content-preview": {
      public: false,
      permission: "content:publish_any",
      methods: ["POST"],
      request: { body: "json", maxBytes: 4096 },
      handler: async (ctx) => {
        try {
          const s = await selected(ctx);
          return {
            status: "PREVIEW READY",
            message: "Your selected saved draft is private.",
            html: previewDocument(s.result),
            selectedRevision: s.revision.id,
          };
        } catch {
          return {
            status: "PREVIEW UNAVAILABLE",
            message:
              "Save your draft and review the article or references before previewing.",
          };
        }
      },
    },
    "content-publish": {
      public: false,
      permission: "content:publish_any",
      methods: ["POST"],
      request: { body: "json", maxBytes: 4096 },
      handler: async (ctx) => {
        try {
          const s = await selected(ctx);
          const send = dispatch ?? (await configuredDispatcher(ctx));
          if (!send)
            return {
              status: "PUBLISHING UNAVAILABLE",
              message:
                "Publishing is not enabled yet. Your draft is preserved.",
            };
          const nonce = crypto.randomUUID(),
            actorBinding = crypto.randomUUID(),
            expiresAt = Date.now() + 300000,
            record = {
              request: s.request,
              actorId: ctx.user.id,
              actorBinding,
              expiresAt,
              state: "PUBLISH PENDING",
            };
          check(ctx.kv?.compareAndSet, "Publication service is unavailable.");
          const stored = await ctx.kv.compareAndSet(
            "content-intent:" + nonce,
            null,
            record,
          );
          check(stored.applied, "Publication is already pending.");
          await send({
            request: s.request,
            actor: { id: actorBinding },
            revision: s.revision.id,
            nonce,
          });
          return {
            status: "PUBLISH PENDING",
            nonce,
            message:
              "Your article is being checked. It is not live until confirmation.",
          };
        } catch {
          return {
            status: "PUBLISH FAILED",
            message:
              "The article changed or needs review. Your draft is preserved. Review the saved version and try again.",
          };
        }
      },
    },
  };
}
