import profile from "../../content-release.json" with { type: "json" };
import {
  qualifyEditorial,
  previewDocument,
} from "../../editorial/content-release.mjs";
const check = (x, message) => {
  if (!x) throw Error(message);
};
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
      revision && revision.collection === collection && revision.entryId === id,
      "That saved revision is unavailable.",
    );
    const documents = [];
    for (const c of profile.collections) {
      const list = await ctx.content.list(c, {
        status: "published",
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
          if (!dispatch)
            return {
              status: "PUBLISHING UNAVAILABLE",
              message:
                "Publishing is not enabled yet. Your draft is preserved.",
            };
          await dispatch({
            request: s.request,
            actor: { id: ctx.user.id },
            revision: s.revision.id,
          });
          return {
            status: "PUBLISH PENDING",
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
