const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const baseTypes = [
  "block",
  "image",
  "gallery",
  "video",
  "code",
  "break",
  "table",
];
export function safeUrl(value, { media = false } = {}) {
  if (typeof value !== "string" || !value || /[\u0000-\u0020\\]/.test(value))
    return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (!media && value.startsWith("#") && idPattern.test(value.slice(1)))
    return value;
  try {
    const u = new URL(value);
    if (u.username || u.password) return null;
    if (u.protocol === "https:" || (!media && u.protocol === "mailto:"))
      return u.href;
  } catch {}
  return null;
}
const fail = (message) => {
  throw new Error("Editorial content: " + message);
};
/** @typedef {{ type: string, stringFields: readonly string[] }} PortableTextBlockDefinition */
/**
 * Local rehearsal contract: Portable Text plus explicit string-field extensions, never provider widgets.
 * @param {readonly PortableTextBlockDefinition[]} blockDefinitions
 */
export function createPortableTextSemantics(blockDefinitions) {
  if (!Array.isArray(blockDefinitions)) throw new TypeError("Invalid Portable Text block definitions");
  const fields = new Map();
  for (const definition of blockDefinitions) {
    if (!definition || typeof definition !== "object" ||
        Object.keys(definition).some(key => !["type", "stringFields"].includes(key)) ||
        typeof definition.type !== "string" || !idPattern.test(definition.type) ||
        baseTypes.includes(definition.type) || fields.has(definition.type) ||
        !Array.isArray(definition.stringFields) ||
        definition.stringFields.some(field => typeof field !== "string" || !idPattern.test(field)) ||
        new Set(definition.stringFields).size !== definition.stringFields.length)
      throw new TypeError("Invalid Portable Text block definitions");
    fields.set(definition.type, [...definition.stringFields]);
  }
  const admittedTypes = new Set([...baseTypes, ...fields.keys()]);

  function validatePortableText(blocks) {
    if (
      !Array.isArray(blocks) ||
      blocks.length > 5000 ||
      JSON.stringify(blocks).length > 2_000_000
    )
      fail("expected bounded Portable Text array");
    const keys = new Set(),
      ids = new Set();
    function key(b) {
      if (
        !b ||
        typeof b !== "object" ||
        !idPattern.test(b._key ?? "") ||
        keys.has(b._key)
      )
        fail("missing or duplicate stable key");
      keys.add(b._key);
    }
    function spans(children, defs = []) {
      if (
        !Array.isArray(children) ||
        children.length > 10000 ||
        !Array.isArray(defs)
      )
        fail("invalid spans");
      const names = new Set();
      for (const d of defs) {
        key(d);
        if (d._type !== "link" || !safeUrl(d.href))
          fail("unsafe or unsupported link");
        names.add(d._key);
      }
      for (const s of children) {
        key(s);
        if (
          s._type !== "span" ||
          typeof s.text !== "string" ||
          !Array.isArray(s.marks ?? [])
        )
          fail("invalid text span");
        for (const mark of s.marks ?? [])
          if (
            ![
              "strong",
              "em",
              "underline",
              "code",
              "strike-through",
              "sub",
              "sup",
            ].includes(mark) &&
            !names.has(mark)
          )
            fail("unknown text annotation");
      }
    }
    for (const b of blocks) {
      key(b);
      if (!admittedTypes.has(b._type)) fail("unsupported block " + b._type);
      if (b.id) {
        if (!idPattern.test(b.id) || ids.has(b.id))
          fail("invalid or duplicate reference ID");
        ids.add(b.id);
      }
      if (b._type === "block") {
        if (
          !["normal", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(
            b.style ?? "normal",
          )
        )
          fail("unsupported text style");
        if (b.listItem && !["bullet", "number"].includes(b.listItem))
          fail("invalid list type");
        if (
          b.level !== undefined &&
          (!Number.isInteger(b.level) || b.level < 1 || b.level > 8)
        )
          fail("invalid list depth");
        spans(b.children, b.markDefs);
      }
      if (["image", "figure"].includes(b._type))
        for (const dim of ["width", "height"])
          if (
            b[dim] !== undefined &&
            (!Number.isInteger(b[dim]) || b[dim] < 1 || b[dim] > 50000)
          )
            fail("invalid image dimension");
      if (
        ["image", "figure"].includes(b._type) &&
        !safeUrl(b.asset?.url ?? b.url, { media: true })
      )
        fail("unsafe image URL");
      if (b._type === "gallery") {
        if (!Array.isArray(b.images) || b.images.length > 50)
          fail("invalid gallery");
        for (const image of b.images)
          if (!safeUrl(image.asset?.url ?? image.url, { media: true }))
            fail("unsafe gallery image");
      }
      if (
        b._type === "video" &&
        !safeUrl(b.src ?? b.asset?.url ?? b.url, { media: true })
      )
        fail("unsafe video URL");
      if (["code", "listing"].includes(b._type) && typeof b.code !== "string")
        fail("invalid code");
      if (
        b._type === "math" &&
        (typeof b.formula !== "string" || b.formula.length > 10000)
      )
        fail("invalid math");
      if (b._type === "table") {
        if (!Array.isArray(b.rows) || b.rows.length > 100) fail("invalid table");
        for (const row of b.rows) {
          key(row);
          if (!Array.isArray(row.cells) || row.cells.length > 100)
            fail("invalid table row");
          for (const cell of row.cells) {
            key(cell);
            spans(cell.content, cell.markDefs);
            for (const s of ["colspan", "rowspan"])
              if (
                cell[s] !== undefined &&
                (!Number.isInteger(cell[s]) || cell[s] < 1 || cell[s] > 100)
              )
                fail("invalid table span");
          }
        }
      }
      if (b._type === "citation" && !idPattern.test(b.referenceId ?? ""))
        fail("citation requires a reference ID");
      if (b._type === "crossReference" && !idPattern.test(b.target ?? ""))
        fail("cross reference requires a target ID");
      for (const field of fields.get(b._type) ?? [])
        if (b[field] !== undefined && typeof b[field] !== "string")
          fail("invalid structured field " + field);
      for (const k of ["url", "href"])
        if (b[k] && !safeUrl(b[k])) fail("unsafe block link");
      if (
        ["reference", "footnote", "sectionRef", "math"].includes(b._type) &&
        !idPattern.test(b.id ?? "")
      )
        fail("stable ID required for " + b._type);
    }
    return blocks;
  }
  function resolveSections(blocks, { sections = {}, trail = [] } = {}) {
    validatePortableText(blocks);
    const resolved = blocks.flatMap((b) => {
      if (b._type !== "sectionRef") return [b];
      if (trail.includes(b.id) || trail.length >= 8)
        throw Error("Cyclic reusable section");
      if (!Object.hasOwn(sections, b.id))
        throw Error("Missing reusable section " + b.id);
      return resolveSections(sections[b.id], {
        sections,
        trail: [...trail, b.id],
      });
    });
    return validatePortableText(resolved);
  }
  function plainText(blocks, context = {}) {
    blocks = resolveSections(blocks, context);
    return blocks
      .map((b) =>
        b._type === "block"
          ? b.children.map((s) => s.text).join("")
          : b._type === "table"
            ? b.rows
                .map((r) =>
                  r.cells
                    .map((c) => c.content.map((s) => s.text).join(""))
                    .join(" "),
                )
                .join("\n")
            : ["code", "listing"].includes(b._type)
              ? b.code
              : b._type === "gallery"
                ? b.images
                    .map((i) => [i.alt, i.caption].filter(Boolean).join(" "))
                    .join(" ")
                : [b.title, b.text, b.caption, b.alt, b.formula]
                    .filter((v) => typeof v === "string")
                    .join(" "),
      )
      .filter(Boolean)
      .join("\n\n");
  }

  return { admittedTypes, validatePortableText, resolveSections, plainText };
}
