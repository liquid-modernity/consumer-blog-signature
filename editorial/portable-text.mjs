import katex from "katex";
import GithubSlugger from "github-slugger";
import { blockRegistry } from "./registry.mjs";
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
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
export const admittedTypes = new Set([
  ...baseTypes,
  ...blockRegistry.map((b) => b.type),
]);
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
export function validatePortableText(blocks) {
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
    const config = blockRegistry.find((x) => x.type === b._type);
    for (const f of config?.fields ?? [])
      if (b[f.action_id] !== undefined && typeof b[f.action_id] !== "string")
        fail("invalid structured field " + f.action_id);
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
export function resolveSections(blocks, { sections = {}, trail = [] } = {}) {
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
export function plainText(blocks, context = {}) {
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
export function analyzeEditorial(blocks, metadata = {}, context = {}) {
  validatePortableText(blocks);
  const warnings = [];
  try {
    blocks = resolveSections(blocks, context);
  } catch (error) {
    warnings.push(error.message);
    blocks = blocks.filter((b) => b._type !== "sectionRef");
  }
  const text = plainText(blocks),
    words = text.match(/\S+/gu)?.length ?? 0,
    outline = [],
    references = blocks.filter((b) => b._type === "reference"),
    ids = new Set(blocks.filter((b) => b.id).map((b) => b.id));
  let prior = 1,
    images = 0,
    externalLinks = 0;
  if (!metadata.title?.trim()) warnings.push("Missing title");
  if (!metadata.summary?.trim()) warnings.push("Missing summary");
  for (const b of blocks) {
    if (b._type === "block" && /^h[1-6]$/.test(b.style)) {
      const level = Number(b.style[1]);
      outline.push({
        key: b._key,
        level,
        title: b.children.map((s) => s.text).join(""),
      });
      if (level > prior + 1) warnings.push("Heading skips a level: " + b._key);
      prior = level;
    }
    for (const image of b._type === "gallery"
      ? b.images
      : ["image", "figure"].includes(b._type)
        ? [b]
        : []) {
      images++;
      if (!image.alt?.trim()) warnings.push("Missing alt text: " + b._key);
    }
    for (const d of b._type === "table"
      ? b.rows.flatMap((r) => r.cells.flatMap((c) => c.markDefs ?? []))
      : (b.markDefs ?? [])) {
      if (d.href.startsWith("https://")) externalLinks++;
      if (d.href.startsWith("#")) {
        const prefix = ["ref-", "fn-", "math-", "figure-"].find((p) =>
          d.href.startsWith("#" + p),
        );
        if (prefix && !ids.has(d.href.slice(prefix.length + 1)))
          warnings.push("Broken reference: " + d.href);
      }
      if (d.href === "#") warnings.push("Empty link");
    }
    if (
      b._type === "citation" &&
      !references.some((r) => r.id === b.referenceId)
    )
      warnings.push("Broken reference: #ref-" + b.referenceId);
    if (
      b._type === "crossReference" &&
      !blocks.some(
        (r) => ["figure", "image"].includes(r._type) && r.id === b.target,
      )
    )
      warnings.push("Broken reference: #figure-" + b.target);
    if (b._type === "reference" && !b.title?.trim())
      warnings.push("Reference has no title: " + b.id);
  }
  return {
    words,
    readingMinutes: Math.max(1, Math.ceil(words / 220)),
    outline,
    imageCount: images,
    externalLinkCount: externalLinks,
    references,
    warnings,
    readiness: warnings.length
      ? "Review recommended"
      : "Ready for editorial review",
  };
}
export function renderPortableText(
  blocks,
  { sections = {}, trail = [], mediaOrigin = "" } = {},
) {
  blocks = resolveSections(blocks, { sections, trail });
  const e = escapeHtml,
    targets = new Map(blocks.filter((b) => b.id).map((b) => [b.id, b]));
  const noteUses = new Map(),
    slugger = new GithubSlugger();
  function math(b, display) {
    try {
      return katex.renderToString(b.formula, {
        displayMode: display,
        output: "mathml",
        trust: false,
        strict: "error",
        throwOnError: true,
        maxExpand: 1000,
        maxSize: 20,
      });
    } catch {
      return `<code class="editorial-math-error">${e(b.formula)}</code>`;
    }
  }
  function inline(children, defs = []) {
    return children
      .map((s) => {
        let html = e(s.text).replace(/\n/g, "<br>");
        for (const mark of s.marks ?? []) {
          const tag = {
            strong: "strong",
            em: "em",
            underline: "u",
            code: "code",
            "strike-through": "s",
            sub: "sub",
            sup: "sup",
          }[mark];
          if (tag) html = `<${tag}>${html}</${tag}>`;
          else {
            const d = defs.find((d) => d._key === mark);
            if (!d) continue;
            const href = safeUrl(d.href);
            if (href?.startsWith("#math-")) {
              const b = targets.get(href.slice(6));
              if (b?._type === "math") {
                html = math(b, false);
                continue;
              }
            }
            if (href?.startsWith("#fn-")) {
              const id = href.slice(4),
                count = (noteUses.get(id) ?? 0) + 1;
              noteUses.set(id, count);
              html = `<sup id="fnref-${e(id)}-${count}"><a href="${e(href)}" role="doc-noteref" aria-label="Footnote ${e(id)}">${html}</a></sup>`;
            } else
              html = `<a href="${e(href)}"${href?.startsWith("https:") ? ' rel="noopener noreferrer"' : ""}>${html}</a>`;
          }
        }
        return html;
      })
      .join("");
  }
  function mediaUrl(url) {
    const safe = safeUrl(url, { media: true });
    if (safe?.startsWith("/_emdash/api/media/") && mediaOrigin) {
      const origin = new URL(mediaOrigin);
      if (
        origin.origin !== mediaOrigin ||
        origin.username ||
        origin.password ||
        !(
          origin.protocol === "https:" ||
          (origin.protocol === "http:" &&
            ["localhost", "127.0.0.1"].includes(origin.hostname))
        )
      )
        throw Error("Invalid explicit media origin");
      return origin.origin + safe;
    }
    return safe;
  }
  function image(i, key) {
    const sized =
      Number.isInteger(i.width) &&
      i.width > 0 &&
      Number.isInteger(i.height) &&
      i.height > 0;
    return `<figure${key ? ` id="figure-${e(key)}"` : ""}><img src="${e(mediaUrl(i.asset?.url ?? i.url))}" alt="${e(i.alt)}" loading="${sized ? "lazy" : "eager"}"${sized ? ` width="${i.width}" height="${i.height}"` : ""}>${i.caption ? `<figcaption>${e(i.caption)}</figcaption>` : ""}</figure>`;
  }
  let result = "",
    lists = [];
  const closeLists = (depth) => {
    while (lists.length > depth) {
      const l = lists.pop();
      result += `</li></${l}>`;
    }
  };
  for (const b of blocks) {
    if (b._type === "block" && b.listItem) {
      const depth = b.level ?? 1,
        tag = b.listItem === "number" ? "ol" : "ul";
      if (
        lists.length > depth ||
        (lists.length === depth && lists.at(-1) !== tag)
      )
        closeLists(depth - 1);
      if (lists.length === depth) result += "</li><li>";
      else {
        while (lists.length < depth) {
          result += `<${tag}${tag === "ol" && b.listStart ? ` start="${Number(b.listStart)}"` : ""}><li>`;
          lists.push(tag);
        }
      }
      result += inline(b.children, b.markDefs);
      continue;
    }
    closeLists(0);
    switch (b._type) {
      case "block": {
        const tag =
          b.style === "blockquote"
            ? "blockquote"
            : /^h[1-6]$/.test(b.style ?? "")
              ? b.style
              : "p";
        result += `<${tag} id="${/^h[1-6]$/.test(tag) ? e(slugger.slug(b.children.map((s) => s.text).join(""))) : "block-" + e(b._key)}">${inline(b.children, b.markDefs)}</${tag}>`;
        break;
      }
      case "break":
        result += "<hr>";
        break;
      case "image":
      case "figure":
        result += image(b, b.id);
        break;
      case "gallery":
        result += `<div class="editorial-gallery">${b.images.map((i) => image(i)).join("")}</div>`;
        break;
      case "video":
        result += `<figure><video controls preload="metadata" src="${e(mediaUrl(b.src ?? b.asset?.url ?? b.url))}" aria-label="${e(b.title ?? "Video")}"></video>${b.caption ? `<figcaption>${e(b.caption)}</figcaption>` : ""}</figure>`;
        break;
      case "code":
      case "listing":
        result += `<figure>${b.filename ? `<figcaption>${e(b.filename)}</figcaption>` : ""}<pre><code data-language="${e(b.language ?? "text")}">${e(b.code)}</code></pre></figure>`;
        break;
      case "table":
        result += `<div class="editorial-table"><table>${b.rows
          .map(
            (r) =>
              "<tr>" +
              r.cells
                .map((c) => {
                  const tag = c.isHeader ? "th" : "td";
                  return `<${tag}${c.isHeader ? ' scope="col"' : ""} colspan="${c.colspan ?? 1}" rowspan="${c.rowspan ?? 1}">${inline(c.content, c.markDefs)}</${tag}>`;
                })
                .join("") +
              "</tr>",
          )
          .join("")}</table></div>`;
        break;
      case "math":
        if (b.display !== "inline")
          result += `<div id="math-${e(b.id)}">${math(b, true)}</div>`;
        break;
      case "citation":
        result += `<p><a href="#ref-${e(b.referenceId)}">${e(b.label ?? b.referenceId)}</a></p>`;
        break;
      case "crossReference":
        result += `<p><a href="#figure-${e(b.target)}">${e(b.label ?? b.target)}</a></p>`;
        break;
      case "reference":
      case "footnote":
        break;
      default:
        result += `<aside class="editorial-${e(b._type)}"><strong>${e(b.title ?? b._type)}</strong><p>${e(b.text).replace(/\n/g, "<br>")}</p>${b.url ? `<a href="${e(safeUrl(b.url))}">${e(b.title ?? "Related reading")}</a>` : ""}</aside>`;
    }
  }
  closeLists(0);
  const notes = blocks.filter((b) => b._type === "footnote");
  if (notes.length)
    result +=
      '<section role="doc-endnotes" aria-label="Footnotes"><h2>Footnotes</h2><ol>' +
      notes
        .map(
          (b) =>
            `<li id="fn-${e(b.id)}">${e(b.text)} ${Array.from({ length: noteUses.get(b.id) ?? 0 }, (_, i) => `<a href="#fnref-${e(b.id)}-${i + 1}" role="doc-backlink" aria-label="Back to footnote ${e(b.id)} reference ${i + 1}">↩</a>`).join(" ")}</li>`,
        )
        .join("") +
      "</ol></section>";
  const refs = blocks.filter((b) => b._type === "reference");
  if (refs.length)
    result +=
      '<section role="doc-bibliography" aria-label="References"><h2>References</h2><ol>' +
      refs
        .map(
          (b) =>
            `<li id="ref-${e(b.id)}">${[b.authors, b.title, b.publication, b.date].filter(Boolean).map(e).join(". ")}${b.doi ? ` DOI: ${e(b.doi)}` : ""}${b.url ? ` <a href="${e(safeUrl(b.url))}" rel="noopener noreferrer">Source</a>` : ""}${b.accessed ? ` (accessed ${e(b.accessed)})` : ""}</li>`,
        )
        .join("") +
      "</ol></section>";
  return result;
}
// A migrated entry declares one editable body. Legacy Markdown remains an archive, never a fallback authority.
export function editorialBody(data) {
  const field = data.integration?.canonicalBodyField ?? "body";
  if (!["body", "content"].includes(field))
    throw Error("Unknown canonical body field");
  const value = data[field];
  if (field === "content") validatePortableText(value);
  return value;
}
