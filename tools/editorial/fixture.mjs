export function richFixture() {
  let i = 0;
  const key = () => `proof-${++i}`,
    span = (text, marks = []) => ({ _type: "span", _key: key(), text, marks }),
    paragraph = (text, extra = {}) => ({
      _type: "block",
      _key: key(),
      style: "normal",
      children: [span(text)],
      markDefs: [],
      ...extra,
    });
  const body = [
    paragraph("Research studio", { style: "h2" }),
    {
      _type: "block",
      _key: key(),
      style: "normal",
      children: [
        span("Strong", ["strong"]),
        span(" Italic", ["em"]),
        span(" Underline", ["underline"]),
        span(" inline()", ["code"]),
        span(" [Research]", ["cite"]),
        span(" [Note]", ["note"]),
        span(" equation", ["equation"]),
      ],
      markDefs: [
        { _type: "link", _key: "cite", href: "#ref-study" },
        { _type: "link", _key: "note", href: "#fn-method" },
        { _type: "link", _key: "equation", href: "#math-energy" },
      ],
    },
    paragraph("First ordered item", { listItem: "number", level: 1 }),
    paragraph("Nested bullet", { listItem: "bullet", level: 2 }),
    paragraph("Quotation", { style: "blockquote" }),
    { _type: "break", _key: key(), style: "lineBreak" },
    {
      _type: "image",
      _key: key(),
      asset: { _ref: "local-proof", url: "/editorial-proof.png" },
      alt: "Local proof image",
      caption: "Figure caption",
    },
    {
      _type: "gallery",
      _key: key(),
      images: [
        {
          _key: key(),
          asset: { _ref: "local-proof", url: "/editorial-proof.png" },
          alt: "Gallery image",
          caption: "Gallery caption",
        },
      ],
    },
    {
      _type: "video",
      _key: key(),
      src: "/editorial-proof.mp4",
      title: "Local video",
      caption: "Video caption",
    },
    { _type: "code", _key: key(), language: "js", code: "const x = 1;" },
    {
      _type: "listing",
      _key: key(),
      language: "ts",
      filename: "study.ts",
      code: 'const evidence: string = "verified";',
    },
    {
      _type: "table",
      _key: key(),
      rows: [
        {
          _type: "tableRow",
          _key: key(),
          cells: [
            {
              _type: "tableCell",
              _key: key(),
              content: [span("Measure")],
              isHeader: true,
            },
            {
              _type: "tableCell",
              _key: key(),
              content: [span("Value")],
              isHeader: true,
            },
          ],
        },
        {
          _type: "tableRow",
          _key: key(),
          cells: [
            {
              _type: "tableCell",
              _key: key(),
              content: [span("calibrated-astronomy")],
            },
            { _type: "tableCell", _key: key(), content: [span("42")] },
          ],
        },
      ],
    },
    {
      _type: "reference",
      _key: key(),
      id: "study",
      title: "Evidence and methods",
      authors: "Research Team",
      publication: "Methods Journal",
      date: "2026",
      url: "https://example.org/study",
      doi: "10.1000/example",
      accessed: "2026-10-25",
    },
    {
      _type: "footnote",
      _key: key(),
      id: "method",
      text: "The method is explicitly recorded.",
    },
    {
      _type: "figure",
      _key: key(),
      id: "diagram",
      url: "/editorial-proof.png",
      alt: "Architecture diagram",
      caption: "A figure with a stable reference.",
    },
    {
      _type: "math",
      _key: key(),
      id: "energy",
      formula: "E=mc^2",
      display: "inline",
    },
    {
      _type: "math",
      _key: key(),
      id: "sum",
      formula: "\\sum_{i=1}^{n} i",
      display: "block",
    },
    {
      _type: "citation",
      _key: key(),
      referenceId: "study",
      label: "Research Team (2026)",
    },
    {
      _type: "crossReference",
      _key: key(),
      target: "diagram",
      label: "See figure",
    },
  ];
  for (const type of [
    "callout",
    "disclosure",
    "authorNote",
    "relatedReading",
    "publicationNote",
    "cta",
  ])
    body.push({
      _type: type,
      _key: key(),
      title: type,
      text: "Structured " + type,
      ...(type === "relatedReading" || type === "cta"
        ? { url: "https://example.org/read" }
        : {}),
    });
  body.push({ _type: "sectionRef", _key: key(), id: "reusable" });
  return { body, sections: { reusable: [paragraph("A reusable section")] } };
}
