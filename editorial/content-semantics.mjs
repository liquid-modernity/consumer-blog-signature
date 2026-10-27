// Application widget descriptors adapt to the public portable semantics contract.
import { blockRegistry } from "./registry.mjs";
import { createPortableTextSemantics } from "@gaga/arsenal";
export { safeUrl } from "./content-urls.mjs";

export const { validatePortableText, resolveSections, plainText } =
  createPortableTextSemantics(blockRegistry.map(block => ({
    type: block.type,
    stringFields: block.fields.map(field => field.action_id),
  })));

// Compatibility inventory for application callers; validation belongs to Arsenal.
export const admittedTypes = new Set([
  "block", "image", "gallery", "video", "code", "break", "table",
  ...blockRegistry.map(block => block.type),
]);
