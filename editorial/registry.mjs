// Application-owned block and field vocabulary; EmDash owns persistence and revisions.
const text = (action_id, label, multiline = false) => ({
  type: "text_input",
  action_id,
  label,
  multiline,
});
export const pluginId = "pakrpp-studio";
export const blockRegistry = [
  {
    type: "citation",
    label: "Citation",
    category: "Knowledge",
    fields: [
      text("referenceId", "Reference ID"),
      text("label", "Citation label"),
    ],
  },
  {
    type: "crossReference",
    label: "Cross reference",
    category: "Knowledge",
    fields: [text("target", "Figure ID"), text("label", "Link text")],
  },
  {
    type: "reference",
    label: "Reference",
    category: "Knowledge",
    fields: [
      text("id", "Reference ID"),
      text("title", "Title"),
      text("authors", "Authors"),
      text("publication", "Publication"),
      text("date", "Year / date"),
      text("url", "URL"),
      text("doi", "DOI"),
      text("accessed", "Access date"),
    ],
  },
  {
    type: "footnote",
    label: "Footnote",
    category: "Knowledge",
    fields: [text("id", "Stable footnote ID"), text("text", "Footnote", true)],
  },
  {
    type: "callout",
    label: "Callout",
    category: "Knowledge",
    fields: [text("title", "Title"), text("text", "Content", true)],
  },
  {
    type: "figure",
    label: "Figure",
    category: "Knowledge",
    fields: [
      text("id", "Figure ID"),
      text("url", "Image URL"),
      text("alt", "Alternative text"),
      text("caption", "Caption"),
    ],
  },
  {
    type: "math",
    label: "Math",
    category: "Technical",
    fields: [
      text("id", "Math ID"),
      text("formula", "TeX formula", true),
      {
        type: "select",
        action_id: "display",
        label: "Display",
        options: [
          { value: "block", label: "Display equation" },
          { value: "inline", label: "Inline equation target" },
        ],
      },
    ],
  },
  {
    type: "listing",
    label: "Code listing",
    category: "Technical",
    fields: [
      text("language", "Language"),
      text("filename", "Filename / title"),
      text("code", "Code", true),
    ],
  },
  ...[
    "disclosure",
    "authorNote",
    "relatedReading",
    "publicationNote",
    "cta",
  ].map((type) => ({
    type,
    label:
      {
        authorNote: "Author note",
        relatedReading: "Related reading",
        publicationNote: "Publication note",
        cta: "Call to action",
      }[type] ?? "Disclosure",
    category: "Reusable",
    fields: [
      text("title", "Title"),
      text("text", "Content", true),
      text("url", "Optional link"),
    ],
  })),
  {
    type: "sectionRef",
    label: "Reusable section",
    category: "Reusable",
    fields: [text("id", "Section ID")],
  },
].map((b) => ({
  ...b,
  pluginId,
  description: `Insert structured ${b.label.toLowerCase()}`,
}));
export const studioBodyWidget = pluginId + ":body";
const field = (slug, label, type, extra = {}) => ({
  slug,
  label,
  type,
  ...extra,
});
export const articleFields = [
  field("title", "Title", "string", { required: true, searchable: true }),
  field("summary", "Dek / Summary", "text"),
  field("body", "Main Content", "portableText", {
    required: true,
    widget: studioBodyWidget,
  }),
  field("authors", "Authors", "reference", {
    validation: { targetCollection: "authors" },
  }),
  field("editorial", "Editorial settings", "json", {
    widget: pluginId + ":metadata",
  }),
  field("integration", "Integration identity", "json", {
    widget: pluginId + ":integration",
    required: true,
  }),
];
export const authorFields = [
  field("title", "Name", "string", { required: true }),
  field("summary", "Biography", "text"),
  field("body", "Profile", "portableText", { widget: studioBodyWidget }),
  field("image", "Portrait", "image"),
  field("integration", "Integration identity", "json", {
    widget: pluginId + ":integration",
  }),
];
export const referenceFields = [
  "title",
  "authors",
  "publication",
  "date",
  "url",
  "doi",
  "accessed",
].map((k) =>
  field(
    k,
    { doi: "DOI", accessed: "Access Date" }[k] ??
      k[0].toUpperCase() + k.slice(1),
    "string",
  ),
);
export const studioCollections = [
  {
    slug: "posts",
    label: "Articles",
    routable: false,
    supports: ["drafts", "revisions", "seo"],
    fields: articleFields,
  },
  {
    slug: "pages",
    label: "Pages",
    routable: false,
    supports: ["drafts", "revisions", "seo"],
    fields: articleFields,
  },
  {
    slug: "authors",
    label: "Authors",
    routable: false,
    supports: ["drafts", "revisions"],
    fields: authorFields,
  },
  {
    slug: "references",
    label: "Reference library",
    routable: false,
    supports: ["drafts", "revisions"],
    fields: referenceFields,
  },
  {
    slug: "sections",
    label: "Reusable sections",
    routable: false,
    supports: ["drafts", "revisions"],
    fields: [
      field("title", "Title", "string", { required: true }),
      field("body", "Section content", "portableText", {
        widget: studioBodyWidget,
      }),
    ],
  },
];
