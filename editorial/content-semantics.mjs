import { blockRegistry } from "./registry.mjs";
import { createPortableTextSemantics } from "./portable-content.mjs";
export { safeUrl } from "./portable-content.mjs";

export const { admittedTypes, validatePortableText, resolveSections, plainText } =
  createPortableTextSemantics(blockRegistry.map(block => ({
    type: block.type,
    stringFields: block.fields.map(field => field.action_id),
  })));
