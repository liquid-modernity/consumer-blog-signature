import { definePlugin, ContentSaveRejectedError } from "emdash";
import { fileURLToPath } from "node:url";
import { blockRegistry, pluginId } from "../../editorial/registry.mjs";
import { validatePortableText } from "../../editorial/portable-text.mjs";
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
        fieldTypes: ["json", "text"],
      },
    ],
  };
}
export function createPlugin() {
  return definePlugin({
    id: pluginId,
    version: "1.0.0",
    capabilities: ["content:write"],
    hooks: {
      "content:beforeSave": async (event) => {
        const data = { ...event.content };
        const owned =
          ["posts", "pages", "authors", "sections"].includes(
            event.collection,
          ) || data.integration?.editorialSchema === "pakrpp.editorial/v1";
        if (owned) {
          try {
            if (event.collection === "authors" && data.body === null)
              data.body = [];
            if (data.content !== undefined) validatePortableText(data.content);
            if (data.body !== undefined) {
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
        if (
          event.isNew &&
          ["posts", "pages", "authors"].includes(event.collection) &&
          !data.integration
        )
          data.integration = {
            applicationId: "editorial-" + crypto.randomUUID(),
            editorialSchema: "pakrpp.editorial/v1",
            canonicalBodyField: "body",
          };
        return data;
      },
    },
  });
}
