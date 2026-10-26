import {
  validatePortableText,
  analyzeEditorial,
  renderPortableText,
  editorialBody,
  escapeHtml,
} from "./portable-text.mjs";
const invariant = (x, message) => {
  if (!x) throw Error(message);
};
export function qualifyEditorial({ request, selected, profile, snapshot }) {
  const [collection] = request.resource.split("/");
  invariant(
    profile.collections.includes(collection),
    "This content model needs application review.",
  );
  const data = selected.revision.data,
    body = editorialBody(data);
  validatePortableText(body);
  invariant(
    typeof data.title === "string" &&
      data.title.trim() &&
      typeof data.summary === "string" &&
      data.summary.trim(),
    "Add a title and summary before publishing.",
  );
  const slug = data._slug ?? selected.published.slug;
  invariant(
    typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
    "Choose a safe publication slug.",
  );
  invariant(
    !profile.fixedSlugs || slug === selected.published.slug,
    "Address changes need application route review.",
  );
  invariant(
    !snapshot.documents.some(
      (d) =>
        d.item.type === collection &&
        d.item.id !== selected.published.id &&
        d.item.slug === slug,
    ),
    "This address belongs to another article.",
  );
  const sections = Object.fromEntries(
    snapshot.documents
      .filter((d) => d.item.type === "sections")
      .map((d) => [d.item.id, editorialBody(d.item.data)]),
  );
  const analysis = analyzeEditorial(body, data, { sections });
  invariant(
    !analysis.warnings.some((w) =>
      /Broken reference|Unknown|Circular|Empty link|Reference has no title/.test(
        w,
      ),
    ),
    "Resolve the content references before publishing.",
  );
  const visit = (b) => {
    if (!b || typeof b !== "object") return;
    if (b._type === "sectionRef")
      invariant(
        sections[b.sectionId ?? b.id],
        "Reusable section is unavailable.",
      );
    if (["image", "figure"].includes(b._type)) {
      invariant(b.alt?.trim(), "Add alternative text to the image.");
      if (b.mediaId)
        invariant(
          snapshot.documents.some(
            (d) => d.item.type === "media" && d.item.id === b.mediaId,
          ),
          "Media identity needs admission.",
        );
    }
    for (const v of Object.values(b)) if (Array.isArray(v)) v.forEach(visit);
  };
  body.forEach(visit);
  const published = selected.published,
    oldSlug = published.slug,
    articlePath = (s) =>
      collection === "authors" ? "/authors/" + s + "/" : "/" + s + "/",
    paths = new Set(profile.globalSurfaces);
  for (const s of [oldSlug, slug]) if (s) paths.add(articlePath(s));
  for (const d of [published.data, data]) {
    const meta = { ...(d.metadata ?? {}), ...(d.editorial ?? {}) };
    for (const key of ["topics", "tags"])
      for (const value of meta[key] ?? [])
        if (typeof value === "string" && /^[a-z0-9-]+$/.test(value))
          paths.add("/" + key + "/" + value + "/");
    const date = meta.publicationDate ?? meta.publishedAt;
    if (date && !isNaN(Date.parse(date))) {
      const t = new Date(date).toISOString();
      paths.add("/archive/" + t.slice(0, 4) + "/");
      paths.add("/archive/" + t.slice(0, 4) + "/" + t.slice(5, 7) + "/");
    }
  }
  const html = renderPortableText(body, {
    mediaOrigin: profile.cmsOrigin,
    sections,
  });
  return {
    html,
    title: data.title,
    slug,
    body,
    analysis,
    affected: {
      current: [...paths].sort(),
      proposed: [...paths].sort(),
      reason:
        "Static renderer dependency closure: selected article, listings, taxonomy, archives, Search and discovery.",
    },
  };
}
export function previewDocument(result, styles = []) {
  invariant(
    styles.every((s) => typeof s === "string" && /^https:\/\//.test(s)),
    "Unsafe preview stylesheet.",
  );
  return (
    "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex,nofollow\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src https: 'unsafe-inline'; img-src https:; font-src https:; script-src 'none'; base-uri 'none'; form-action 'none'\">" +
    styles
      .map((s) => '<link rel="stylesheet" href="' + escapeHtml(s) + '">')
      .join("") +
    '</head><body><main><article class="sl-markdown-content"><p>Private preview · not published</p><h1>' +
    escapeHtml(result.title) +
    "</h1>" +
    result.html +
    "</article></main></body></html>"
  );
}
