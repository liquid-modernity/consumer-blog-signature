import { definePlugin, ContentSaveRejectedError } from "emdash";
import { fileURLToPath } from "node:url";
import { blockRegistry, pluginId } from "../../editorial/registry.mjs";
import {
  validatePortableText,
  plainText,
} from "../../editorial/content-semantics.mjs";
import { nativePublishGate } from "./content-approval.mjs";
import { contentReleaseRoutes } from "./content-release.mjs";
export function studioPlugin() {
  return {
    id: pluginId,
    version: "1.0.0",
    format: "native",
    entrypoint: fileURLToPath(new URL("./plugin.mjs", import.meta.url)),
    adminEntry: fileURLToPath(new URL("./admin.tsx", import.meta.url)),
    portableTextBlocks: blockRegistry,
    fieldWidgets: [
      {
        name: "body",
        label: "PAKRPP writing studio",
        fieldTypes: ["portableText"],
      },
      { name: "metadata", label: "Editorial settings", fieldTypes: ["json"] },
      {
        name: "integration",
        label: "Integration identity",
        fieldTypes: ["json", "text", "string"],
      },
    ],
  };
}
export function createPlugin() {
  return definePlugin({
    id: pluginId,
    version: "1.0.0",
    capabilities: [
      "content:write",
      "content:read",
      "content:revisions:read",
      "content:publish",
      "hooks.content-policy:register",
      "network:request",
      "schema:read",
    ],
    allowedHosts: ["api.github.com"],
    admin: {
      settingsSchema: {
        contentReleaseEnabled: {
          type: "boolean",
          label: "Enable verified content publishing",
        },
        contentReleaseKey: { type: "secret", label: "Content service key" },
        contentReleasePolicyDigest: {
          type: "string",
          label: "Accepted content policy",
        },
        contentReleaseDispatchToken: {
          type: "secret",
          label: "Content dispatch credential",
        },
        contentReleaseWorkflowId: {
          type: "string",
          label: "Content service locator",
        },
        contentReleaseBootstrapDigest: {
          type: "string",
          label: "Initial verified application state",
        },
        contentReleaseSource: {
          type: "string",
          label: "Qualified application source",
        },
      },
    },
    routes: contentReleaseRoutes(),
    hooks: {
      "content:beforePublish": nativePublishGate,
      "content:beforeSchedule": async (event) =>
        ["posts", "authors"].includes(event.collection)
          ? {
              cancel: true,
              reason:
                "Scheduled publishing is not enabled yet. Your draft is preserved.",
            }
          : undefined,
      "content:beforeUnpublish": nativePublishGate,
      "content:beforeSave": async (event, ctx) => {
        const data = { ...event.content };
        const owned =
          ["posts", "pages", "authors", "sections"].includes(
            event.collection,
          ) || data.integration?.editorialSchema === "pakrpp.editorial/v1";
        if (
          event.isNew &&
          ["posts", "pages", "authors"].includes(event.collection) &&
          !data.integration
        )
          data.integration = {
            applicationId:
              data.application_id || "editorial-" + crypto.randomUUID(),
            editorialSchema: "pakrpp.editorial/v1",
            canonicalBodyField: Object.hasOwn(data, "content")
              ? "content"
              : "body",
          };
        const canonicalField = data.integration?.canonicalBodyField ?? "body";
        // Existing TEXT/NOT NULL constraints stay intact; new rich records receive a managed creation snapshot.
        if (event.isNew && canonicalField === "content" && ctx?.schema) {
          const model = await ctx.schema.getCollection(event.collection),
            names = new Set(model?.fields.map((f) => f.slug));
          if (names.has("application_id"))
            data.application_id ||= data.integration.applicationId;
          if (names.has("metadata"))
            data.metadata ??= { contentId: data.integration.applicationId };
          if (names.has("body") && data.body == null) {
            data.body =
              plainText(data.content ?? []) || String(data.title ?? "");
            const markdownSha256 = Array.from(
              new Uint8Array(
                await crypto.subtle.digest(
                  "SHA-256",
                  new TextEncoder().encode(data.body),
                ),
              ),
              (x) => x.toString(16).padStart(2, "0"),
            ).join("");
            data.integration.migratedFrom = {
              sourceKind: "rich-creation-compatibility-snapshot",
              markdownSha256,
            };
          }
        }

        if (owned) {
          try {
            if (
              event.collection === "authors" &&
              canonicalField === "body" &&
              data.body === null
            )
              data.body = [];
            if (event.collection === "authors" && data.content === null)
              data.content = [];
            if (data.content !== undefined) validatePortableText(data.content);
            if (
              data.body !== undefined &&
              !(canonicalField === "content" && data.body === null)
            ) {
              if (
                typeof data.body === "string" &&
                Array.isArray(data.content)
              ) {
                const digest = Array.from(
                  new Uint8Array(
                    await crypto.subtle.digest(
                      "SHA-256",
                      new TextEncoder().encode(data.body),
                    ),
                  ),
                  (x) => x.toString(16).padStart(2, "0"),
                ).join("");
                if (
                  data.integration?.canonicalBodyField !== "content" ||
                  data.integration?.migratedFrom?.markdownSha256 !== digest
                )
                  throw Error("Markdown archive changed");
              } else validatePortableText(data.body);
            }
          } catch {
            throw new ContentSaveRejectedError(
              "Unsupported or unsafe rich content, or changed Markdown archive. Use admitted structured blocks and preserve the migration archive.",
            );
          }
        }
        const editorial = data.editorial;
        if (editorial !== undefined && editorial !== null) {
          if (
            !editorial ||
            typeof editorial !== "object" ||
            Array.isArray(editorial)
          )
            throw new ContentSaveRejectedError("Invalid editorial metadata");
          for (const name of ["topics", "tags"])
            if (
              editorial[name] !== undefined &&
              (!Array.isArray(editorial[name]) ||
                editorial[name].some(
                  (x) => typeof x !== "string" || x.length > 200,
                ))
            )
              throw new ContentSaveRejectedError("Invalid editorial labels");
        }
        return data;
      },
    },
  });
}
