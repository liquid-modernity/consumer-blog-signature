import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { validatePortableText, plainText } from "./portable-text.mjs";
// Stable position keys make repeated imports byte-identical; no content execution or HTML fallback.
export function markdownToPortableText(markdown) {
  const tree = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .parse(markdown),
    blocks = [],
    unsupported = [],
    definitions = new Map();
  let serial = 0;
  const key = () => `m${String(++serial).padStart(5, "0")}`;
  function discover(n) {
    if (n.type === "definition") definitions.set(n.identifier, n);
    for (const c of n.children ?? []) discover(c);
  }
  discover(tree);
  function inline(nodes, marks = [], defs = []) {
    const children = [];
    for (const n of nodes ?? []) {
      if (["text", "inlineCode", "break"].includes(n.type))
        children.push({
          _type: "span",
          _key: key(),
          text: n.type === "break" ? "\n" : n.value,
          marks: n.type === "inlineCode" ? [...marks, "code"] : marks,
        });
      else if (["strong", "emphasis", "delete"].includes(n.type))
        children.push(
          ...inline(
            n.children,
            [
              ...marks,
              { strong: "strong", emphasis: "em", delete: "strike-through" }[
                n.type
              ],
            ],
            defs,
          ),
        );
      else if (n.type === "link" || n.type === "linkReference") {
        const target = n.type === "link" ? n : definitions.get(n.identifier);
        if (!target) {
          unsupported.push("Unresolved Markdown reference: " + n.identifier);
          continue;
        }
        const k = key();
        defs.push({ _type: "link", _key: k, href: target.url });
        children.push(...inline(n.children, [...marks, k], defs));
      } else if (n.type === "footnoteReference") {
        const k = key();
        defs.push({ _type: "link", _key: k, href: "#fn-" + n.identifier });
        children.push({
          _type: "span",
          _key: key(),
          text: n.identifier,
          marks: [...marks, k],
        });
      } else if (n.type === "inlineMath") {
        const id = key(),
          k = key();
        blocks.push({
          _type: "math",
          _key: key(),
          id,
          formula: n.value,
          display: "inline",
        });
        defs.push({ _type: "link", _key: k, href: "#math-" + id });
        children.push({
          _type: "span",
          _key: key(),
          text: n.value,
          marks: [...marks, k],
        });
      } else
        unsupported.push(
          `Unsupported inline ${n.type} at line ${n.position?.start.line ?? "?"}`,
        );
    }
    return children;
  }
  function visit(nodes, context = {}) {
    for (const n of nodes) {
      if (["paragraph", "heading"].includes(n.type)) {
        if (
          n.type === "paragraph" &&
          n.children.length === 1 &&
          n.children[0].type === "image"
        ) {
          const i = n.children[0];
          blocks.push({
            _type: "image",
            _key: key(),
            asset: { _ref: "", url: i.url },
            alt: i.alt ?? "",
            caption: i.title ?? "",
          });
          continue;
        }
        const markDefs = [],
          children = inline(n.children, [], markDefs);
        blocks.push({
          _type: "block",
          _key: key(),
          style: context.quote
            ? "blockquote"
            : n.type === "heading"
              ? "h" + n.depth
              : "normal",
          children,
          markDefs,
          ...(context.listItem
            ? {
                listItem: context.listItem,
                level: context.level,
                listStart: context.start ?? 1,
              }
            : {}),
        });
      } else if (n.type === "list")
        for (const item of n.children) {
          if (item.checked !== null && item.checked !== undefined)
            unsupported.push("Task list needs explicit review");
          if (item.children.filter((c) => c.type === "paragraph").length > 1)
            unsupported.push("Multi-paragraph list item needs explicit review");
          visit(item.children, {
            listItem: n.ordered ? "number" : "bullet",
            level: (context.level ?? 0) + 1,
            start: n.start ?? 1,
          });
        }
      else if (n.type === "blockquote") {
        if (n.children.some((c) => c.type !== "paragraph"))
          unsupported.push("Complex block quote needs explicit review");
        visit(n.children, { ...context, quote: true });
      } else if (n.type === "code")
        blocks.push({
          _type: "listing",
          _key: key(),
          language: n.lang ?? "text",
          filename: n.meta ?? "",
          code: n.value,
        });
      else if (n.type === "thematicBreak")
        blocks.push({ _type: "break", _key: key(), style: "lineBreak" });
      else if (n.type === "math")
        blocks.push({
          _type: "math",
          _key: key(),
          id: key(),
          formula: n.value,
          display: "block",
        });
      else if (n.type === "table")
        blocks.push({
          _type: "table",
          _key: key(),
          rows: n.children.map((r, i) => ({
            _type: "tableRow",
            _key: key(),
            cells: r.children.map((c) => {
              const markDefs = [],
                content = inline(c.children, [], markDefs);
              return {
                _type: "tableCell",
                _key: key(),
                content,
                markDefs,
                isHeader: i === 0,
              };
            }),
          })),
        });
      else if (n.type === "footnoteDefinition") {
        const simple = n.children.every(
          (c) =>
            c.type === "paragraph" &&
            c.children.every((s) => s.type === "text"),
        );
        if (!simple)
          unsupported.push(
            "Footnote " +
              n.identifier +
              " contains rich constructs requiring explicit review",
          );
        blocks.push({
          _type: "footnote",
          _key: key(),
          id: n.identifier,
          text: n.children
            .map((c) => (c.children ?? []).map((s) => s.value ?? "").join(""))
            .join("\n\n"),
        });
      } else if (n.type !== "definition")
        unsupported.push(
          `Unsupported ${n.type} at line ${n.position?.start.line ?? "?"}`,
        );
    }
  }
  visit(tree.children);
  if (unsupported.length) return { ok: false, unsupported, blocks: null };
  validatePortableText(blocks);
  return { ok: true, unsupported: [], blocks, text: plainText(blocks) };
}
