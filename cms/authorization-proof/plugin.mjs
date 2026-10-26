import { definePlugin } from "emdash";
import { canActOnOwn } from "@emdash-cms/auth";
import { fileURLToPath } from "node:url";

export function fixturePlugin() {
  return {
    id: "authorization-contract-proof",
    version: "1.0.0",
    format: "native",
    entrypoint: fileURLToPath(import.meta.url),
  };
}

export function createPlugin() {
  return definePlugin({
    id: "authorization-contract-proof",
    version: "1.0.0",
    capabilities: ["users:read", "hooks.content-policy:register"],
    routes: {
      // The fixture exposes only synthetic local accounts on its loopback server.
      directory: {
        public: true,
        methods: ["GET"],
        handler: async (ctx) => ({
          callerBound: Boolean(ctx.user),
          account: await ctx.users.get(new URL(ctx.request.url).searchParams.get("id")),
        }),
      },
      own: {
        permission: "content:publish_own",
        methods: ["GET"],
        handler: async (ctx) => ({
          allowed: canActOnOwn(
            ctx.user,
            new URL(ctx.request.url).searchParams.get("owner") ?? ctx.user.id,
            "content:publish_own",
            "content:publish_any",
          ),
          actorId: ctx.user.id,
          role: ctx.user.role,
        }),
      },
      accounts: {
        permission: "users:manage",
        methods: ["GET"],
        handler: async () => ({ allowed: true }),
      },
    },
    hooks: {
      "content:beforePublish": {
        handler: async () => ({ cancel: true, reason: "NATIVE_PROOF_PUBLISH_DENIED" }),
      },
      "content:beforeUnpublish": {
        handler: async () => ({ cancel: true, reason: "NATIVE_PROOF_UNPUBLISH_DENIED" }),
      },
    },
  });
}
