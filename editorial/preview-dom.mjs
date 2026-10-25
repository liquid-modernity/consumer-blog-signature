import { renderPortableText } from "./portable-text.mjs";
// The caller supplies structured blocks, never HTML. The same validated renderer serves the site.
export function replacePortablePreview(
  target,
  body,
  sections = {},
  mediaOrigin,
) {
  const parsed = new DOMParser().parseFromString(
    renderPortableText(body, { sections, mediaOrigin }),
    "text/html",
  );
  if (parsed.querySelector("script,iframe,object,embed,style,link,meta,form"))
    throw new Error("Unexpected preview element");
  for (const node of parsed.body.querySelectorAll("*"))
    for (const attribute of node.attributes)
      if (/^on/i.test(attribute.name))
        throw new Error("Unexpected preview event");
  target.replaceChildren(
    ...Array.from(parsed.body.childNodes).map((node) =>
      target.ownerDocument.importNode(node, true),
    ),
  );
}
