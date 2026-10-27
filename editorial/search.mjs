import { defineSearchableArtifact } from "@gaga/engine-capabilities/search";
import { plainText } from "./content-semantics.mjs";
export function withEditorialText(projection, body, context = {}) {
  if (projection.status !== "projected")
    throw new Error("Rich text cannot bypass Corps admission");
  return defineSearchableArtifact({
    ...projection.artifact,
    searchableFields: [
      ...projection.artifact.searchableFields,
      { field: "body", value: plainText(body, context) },
    ],
  });
}
