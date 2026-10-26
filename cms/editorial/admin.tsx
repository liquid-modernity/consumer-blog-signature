import React, { useEffect, useRef, useState } from "react";
import {
  PortableTextEditor,
  apiFetch,
  MediaPickerModal,
  fetchContentList,
  type PortableTextEditorProps,
  type ContentEditorPanelContext,
} from "@emdash-cms/admin";
import { blockRegistry } from "../../editorial/registry.mjs";
import {
  validatePortableText,
  analyzeEditorial,
  editorialBody,
} from "../../editorial/portable-text.mjs";
import "./studio.css";
type Body = NonNullable<PortableTextEditorProps["value"]>;
type Editor = NonNullable<
  Parameters<NonNullable<PortableTextEditorProps["onEditorReady"]>>[0]
>;
type Props = {
  value?: Body;
  onChange: (value: Body) => void;
  label: string;
  id: string;
};
function StudioBody({ value = [], onChange, label, id }: Props) {
  value ??= [];
  const [editor, setEditor] = useState<Editor | null>(null),
    [panel, setPanel] = useState("outline"),
    [reference, setReference] = useState(""),
    [linkKind, setLinkKind] = useState("citation"),
    [sections, setSections] = useState<Record<string, Body>>({}),
    [library, setLibrary] = useState<
      Array<{ id: string; data: Record<string, unknown> }>
    >([]),
    [error, setError] = useState("");
  const previewWindow = useRef<Window | null>(null);
  const frame = useRef<HTMLIFrameElement>(null),
    draft = useRef(value);
  draft.current = value;
  let analysis: ReturnType<typeof analyzeEditorial> | null = null;
  try {
    analysis = analyzeEditorial(value, {}, { sections });
  } catch {}
  const sendPreview = () => {
    if (
      !frame.current?.contentWindow ||
      previewWindow.current !== frame.current.contentWindow
    )
      return;
    frame.current.contentWindow.postMessage(
      { type: "pakrpp.editorial-preview/v1", body: draft.current, sections },
      "http://localhost:3000",
    );
  };
  useEffect(() => {
    const ready = (event: MessageEvent) => {
      if (
        event.origin === "http://localhost:3000" &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "pakrpp.preview-ready"
      ) {
        previewWindow.current = frame.current?.contentWindow ?? null;
        sendPreview();
      }
    };
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, [sections]);
  useEffect(() => {
    sendPreview();
  }, [value, sections, panel]);
  useEffect(() => {
    let live = true;
    Promise.all([
      fetchContentList("sections", { status: "published", limit: 100 }),
      fetchContentList("references", { status: "published", limit: 100 }),
    ])
      .then(([s, r]) => {
        if (live) {
          setSections(
            Object.fromEntries(s.items.map((x) => [x.id, x.data.body as Body])),
          );
          setLibrary(r.items.map((x) => ({ id: x.id, data: x.data })));
        }
      })
      .catch(() => {
        if (live)
          setError(
            "Reference/section library unavailable. Embedded references and writing remain available.",
          );
      });
    return () => {
      live = false;
    };
  }, []);
  function changed(body: Body) {
    try {
      validatePortableText(body);
      setError("");
    } catch {
      setError(
        "This block cannot be saved: use admitted structured blocks, not HTML or arbitrary embeds.",
      );
    }
    onChange(body);
  }
  function insertMarker() {
    if (!editor || !reference) return;
    const prefix =
      linkKind === "citation"
        ? "ref-"
        : linkKind === "footnote"
          ? "fn-"
          : linkKind === "math"
            ? "math-"
            : "figure-";
    editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        text: linkKind === "math" ? "equation" : "[" + reference + "]",
        marks: [{ type: "link", attrs: { href: "#" + prefix + reference } }],
      })
      .run();
  }
  function jump(title: string, level: number) {
    if (!editor) return;
    let found = false;
    editor.state.doc.descendants((node, pos) => {
      if (
        !found &&
        node.type.name === "heading" &&
        node.attrs.level === level &&
        node.textContent === title
      ) {
        editor
          .chain()
          .focus()
          .setTextSelection(pos + 1)
          .scrollIntoView()
          .run();
        found = true;
      }
      return !found;
    });
  }
  return (
    <section className="pakrpp-studio" aria-label="PAKRPP Editorial Studio">
      <header>
        <div>
          <span className="studio-kicker">PAKRPP · EDITORIAL STUDIO</span>
          <h2 id={id + "-label"}>{label}</h2>
        </div>
        <output aria-live="polite">
          {analysis?.words ?? 0} words · {analysis?.readingMinutes ?? 1} min
        </output>
      </header>
      <div
        className="studio-tools"
        role="group"
        aria-label="Structured inline insertion"
      >
        <label>
          Insert{" "}
          <select
            value={linkKind}
            onChange={(e) => setLinkKind(e.target.value)}
          >
            <option value="citation">Citation</option>
            <option value="footnote">Footnote</option>
            <option value="math">Inline math</option>
            <option value="figure">Cross reference</option>
          </select>
        </label>
        <label>
          Target ID{" "}
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Stable reference ID"
          />
        </label>
        <button
          type="button"
          onClick={insertMarker}
          disabled={!editor || !reference}
        >
          Insert inline marker
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="studio-workspace">
        <div className="studio-canvas">
          <PortableTextEditor
            value={value}
            onChange={changed}
            aria-labelledby={id + "-label"}
            variant="document"
            onEditorReady={setEditor}
            pluginBlocks={
              blockRegistry as NonNullable<
                PortableTextEditorProps["pluginBlocks"]
              >
            }
            placeholder="Write. Type / to insert a structured block."
          />
        </div>
        <aside aria-label="Editorial tools">
          <nav aria-label="Editorial panels">
            {["outline", "references", "readiness", "preview"].map((name) => (
              <button
                type="button"
                key={name}
                aria-pressed={panel === name}
                onClick={() => setPanel(name)}
              >
                {name}
              </button>
            ))}
          </nav>
          {panel === "outline" && (
            <>
              <h3>Outline</h3>
              <ol>
                {analysis?.outline.map((h) => (
                  <li
                    key={h.key}
                    style={{ marginInlineStart: (h.level - 1) * 8 }}
                  >
                    <button
                      type="button"
                      onClick={() => jump(h.title, h.level)}
                    >
                      {h.title}
                    </button>
                  </li>
                ))}
              </ol>
              <p>
                ⌘/Ctrl + Alt + 1–6: heading. ⌘/Ctrl + K: link. Undo/redo and
                block handles remain native EmDash.
              </p>
            </>
          )}
          {panel === "references" && (
            <>
              <h3>References</h3>
              <p>
                Add /reference or /footnote, then insert its stable inline
                marker at the cursor.
              </p>
              {analysis?.references.map((r: { id: string; title?: string }) => (
                <p key={r.id}>
                  <strong>{r.id}</strong> — {r.title}
                </p>
              ))}
              <h4>Published reference library</h4>
              {library.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => {
                    if (!editor) return;
                    if (value.some((b) => "id" in b && b.id === r.id)) {
                      setReference(r.id);
                      return;
                    }
                    editor
                      .chain()
                      .focus()
                      .insertContent({
                        type: "pluginBlock",
                        attrs: {
                          blockType: "reference",
                          id: r.id,
                          data: r.data,
                        },
                      })
                      .run();
                    setReference(r.id);
                  }}
                >
                  {String(r.data.title ?? r.id)}
                </button>
              ))}
            </>
          )}
          {panel === "readiness" && (
            <>
              <h3>Body readiness</h3>
              <p>
                {analysis?.imageCount ?? 0} images ·{" "}
                {analysis?.externalLinkCount ?? 0} external links
              </p>
              <ul>
                {analysis?.warnings
                  .filter(
                    (w) =>
                      !w.startsWith("Missing title") &&
                      !w.startsWith("Missing summary"),
                  )
                  .map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
              </ul>
              <p>
                Advisory. Title, summary and publishing status are checked in
                the saved-revision panels. EmDash owns authorization and
                publication.
              </p>
            </>
          )}
          {panel === "preview" && (
            <>
              <h3>Actual PAKRPP preview</h3>
              <p>
                Start the application on localhost:3000. Draft data is sent only
                to that loopback origin.
              </p>
              <iframe
                ref={frame}
                title="PAKRPP article preview"
                src="http://localhost:3000/editorial-preview"
                onLoad={sendPreview}
              />
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

type EditorialMetadata = {
  topics?: string[];
  tags?: string[];
  publicationDate?: string;
  updatedDate?: string;
  language?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  featuredImage?: { id: string; url: string; alt?: string };
  socialImage?: { id: string; url: string; alt?: string };
};
function Metadata({
  value: inputValue,
  onChange,
}: {
  value?: EditorialMetadata | null;
  onChange: (value: EditorialMetadata) => void;
}) {
  const value = inputValue ?? {};
  const [picker, setPicker] = useState<"featuredImage" | "socialImage" | null>(
    null,
  );
  const change = (key: keyof EditorialMetadata, next: unknown) =>
    onChange({ ...value, [key]: next });
  return (
    <section className="studio-metadata" aria-label="Editorial settings">
      <details>
        <summary>Metadata · dates, topics, tags and language</summary>
        {(["topics", "tags"] as const).map((key) => (
          <label key={key}>
            {key}
            <input
              defaultValue={(value[key] ?? []).join(", ")}
              onBlur={(e) =>
                change(key, [
                  ...new Set(
                    e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  ),
                ])
              }
            />
          </label>
        ))}
        <label>
          Publication Date
          <input
            type="datetime-local"
            value={value.publicationDate?.slice(0, 16) ?? ""}
            onChange={(e) =>
              change(
                "publicationDate",
                e.target.value
                  ? new Date(e.target.value + "Z").toISOString()
                  : "",
              )
            }
          />
        </label>
        <label>
          Updated Date
          <input
            type="datetime-local"
            value={value.updatedDate?.slice(0, 16) ?? ""}
            onChange={(e) =>
              change(
                "updatedDate",
                e.target.value
                  ? new Date(e.target.value + "Z").toISOString()
                  : "",
              )
            }
          />
        </label>
        <p>Dates are shown and stored in UTC.</p>
        <label>
          Language
          <select
            value={value.language ?? "id"}
            onChange={(e) => change("language", e.target.value)}
          >
            <option value="id">Indonesian</option>
            <option value="en">English</option>
          </select>
        </label>
      </details>
      <details>
        <summary>SEO · search and social metadata</summary>
        {(["seoTitle", "seoDescription", "canonicalUrl"] as const).map(
          (key) => (
            <label key={key}>
              {
                {
                  seoTitle: "SEO Title",
                  seoDescription: "SEO Description",
                  canonicalUrl: "Canonical URL",
                }[key]
              }
              <input
                value={value[key] ?? ""}
                onChange={(e) => change(key, e.target.value)}
              />
            </label>
          ),
        )}
      </details>
      <details>
        <summary>Media · featured and social image</summary>
        {(["featuredImage", "socialImage"] as const).map((key) => (
          <div key={key}>
            <button type="button" onClick={() => setPicker(key)}>
              Choose{" "}
              {key === "featuredImage" ? "Featured Image" : "Social Image"}
            </button>
            {value[key] && (
              <label>
                Alternative text
                <input
                  value={value[key]?.alt ?? ""}
                  onChange={(e) =>
                    change(key, { ...value[key], alt: e.target.value })
                  }
                />
              </label>
            )}
          </div>
        ))}
      </details>
      <MediaPickerModal
        open={picker !== null}
        onOpenChange={(open) => {
          if (!open) setPicker(null);
        }}
        mediaKind="image"
        localOnly
        title="Select editorial image"
        onSelect={(item) => {
          if (picker)
            change(picker, {
              id: item.id,
              url: item.url,
              alt: "alt" in item ? String(item.alt ?? "") : "",
            });
          setPicker(null);
        }}
      />
    </section>
  );
}

function Integration() {
  return (
    <details className="studio-integration">
      <summary>Integration identity · managed</summary>
      <p>
        Application identity and migration references remain on the EmDash
        record. They are managed by the application and are not editorial
        fields.
      </p>
    </details>
  );
}
function SavedReadiness({ entry }: ContentEditorPanelContext) {
  let analysis;
  try {
    analysis = analyzeEditorial(
      (editorialBody(entry.data) ?? []) as Body,
      entry.data,
    );
  } catch {
    return <p role="alert">Saved body needs schema review.</p>;
  }
  return (
    <div className="pakrpp-studio-saved">
      <p>
        Saved revision: {entry.status}. {analysis.readiness}
      </p>
      <ul>
        {analysis.warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
      <details>
        <summary>Metadata</summary>
        <p>
          {String(
            (entry.data.editorial as EditorialMetadata)?.language ??
              entry.locale ??
              "",
          )}{" "}
          ·{" "}
          {String(
            (entry.data.editorial as EditorialMetadata)?.publicationDate ??
              entry.publishedAt ??
              "Not published",
          )}
        </p>
        <p>
          Topics:{" "}
          {((entry.data.editorial as EditorialMetadata)?.topics ?? []).join(
            ", ",
          )}{" "}
          · Tags:{" "}
          {((entry.data.editorial as EditorialMetadata)?.tags ?? []).join(", ")}
        </p>
      </details>
      <details>
        <summary>SEO</summary>
        <p>
          {String(
            (entry.data.editorial as EditorialMetadata)?.seoTitle ??
              entry.data.title ??
              "",
          )}
        </p>
        <p>
          {String(
            (entry.data.editorial as EditorialMetadata)?.seoDescription ??
              entry.data.summary ??
              "",
          )}
        </p>
        <p>
          {String(
            (entry.data.editorial as EditorialMetadata)?.canonicalUrl ??
              "No canonical override",
          )}
        </p>
      </details>
      <details>
        <summary>Media</summary>
        <p>
          {analysis.imageCount} body images. Featured media:{" "}
          {(entry.data.editorial as EditorialMetadata)?.featuredImage
            ? "set"
            : "not set"}
          .
        </p>
      </details>
    </div>
  );
}
function ContentPublishing({ collection, entry }: ContentEditorPanelContext) {
  const [message, setMessage] = useState("Save your draft before previewing."),
    [html, setHtml] = useState(""),
    [busy, setBusy] = useState(false);
  const act = async (kind: "content-preview" | "content-publish") => {
    setBusy(true);
    try {
      const response = await apiFetch(
        "/_emdash/api/plugins/pakrpp-studio/" + kind,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schema: "gaga.content-request/v1",
            action: "publish",
            resource: collection + "/" + entry.id,
            selectedRevision: entry.draftRevisionId,
            expectedPublishedRevision: entry.liveRevisionId,
          }),
        },
      );
      if (!response.ok) throw Error("Request denied");
      const envelope = await response.json(),
        result = envelope.data ?? envelope;
      setMessage(result.message ?? "Your article needs review.");
      if (kind === "content-preview" && result.status === "PREVIEW READY")
        setHtml(result.html);
    } catch {
      setMessage(
        "Unable to continue. Your draft is preserved. Contact your site administrator.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-label="Publication">
      <p role="status">{message}</p>
      <button
        type="button"
        disabled={busy || !entry.draftRevisionId}
        onClick={() => act("content-preview")}
      >
        Preview saved draft
      </button>
      <button
        type="button"
        disabled={busy || !entry.draftRevisionId}
        onClick={() => act("content-publish")}
      >
        Publish saved draft
      </button>
      {html && (
        <iframe
          title="Private article preview"
          sandbox=""
          srcDoc={html}
          style={{ width: "100%", minHeight: "24rem" }}
        />
      )}
    </section>
  );
}
export const fields = {
  body: StudioBody,
  metadata: Metadata,
  integration: Integration,
};
export const contentEditorPanels = [
  {
    id: "content-publication",
    title: "Preview and publish",
    collections: ["posts", "authors"],
    component: ContentPublishing,
    order: 5,
  },
  {
    id: "editorial-readiness",
    title: "Publishing · saved revision",
    collections: ["posts", "pages", "authors"],
    component: SavedReadiness,
    order: 10,
  },
];
