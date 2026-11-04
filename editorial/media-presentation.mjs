export function validateMediaPresentation(blocks) {
  for (const block of blocks) {
    if (["image", "figure", "video"].includes(block._type) && block.presentation !== undefined &&
        !["bleed", "wide", "inline"].includes(block.presentation)) throw new TypeError("Invalid media presentation");
  }
}

export function preserveMediaPresentation(previous, next) {
  const saved = new Map(previous.filter(block => typeof block._key === "string" && block._key && ["image", "video"].includes(block._type) && block.presentation !== undefined).map(block => [block._key, block]));
  return next.map(block => ["image", "video"].includes(block._type) && block.presentation === undefined && saved.get(block._key)?._type === block._type
    ? { ...block, presentation: saved.get(block._key).presentation }
    : block);
}
