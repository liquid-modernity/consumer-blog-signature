// Same supported REST path in local rehearsal and the operator-controlled production tab. No cookies/tokens are read.
export async function executeCutover(
  planText,
  expectedSha256,
  qualification,
  progress,
) {
  const check = (v, m) => {
      if (!v) throw Error(m);
    },
    canon = (x) =>
      JSON.stringify(x, (_k, v) =>
        v && typeof v === "object" && !Array.isArray(v)
          ? Object.fromEntries(
              Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
            )
          : v,
      );
  const hash = async (text) =>
    [
      ...new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
      ),
    ]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  const publicItem = (item) =>
    Object.fromEntries(
      [
        "id",
        "type",
        "slug",
        "status",
        "updatedAt",
        "publishedAt",
        "liveRevisionId",
        "draftRevisionId",
        "data",
      ].map((k) => [k, item[k]]),
    );
  const receipt = {
    status: "RUNNING",
    mode: "native-EmDash-additive-cutover",
    schemaWrites: 0,
    contentWrites: 0,
    records: [],
    events: [],
    credentialAccess: false,
  };
  const save = () => progress(JSON.parse(JSON.stringify(receipt)));
  try {
    check((await hash(planText)) === expectedSha256, "Plan checksum mismatch");
    const p = JSON.parse(planText),
      local = p.mode === "LOCAL_REHEARSAL";
    check(
      p.schema === "consumer.rich-production-cutover/v1" &&
        p.records.length === 8,
      "Invalid cutover contract",
    );
    check(
      location.origin === p.origin &&
        (local
          ? p.origin === "http://localhost:4322"
          : p.origin ===
            "https://consumer-blog-signature-cms.ratriatra.workers.dev"),
      "Wrong origin",
    );
    check(
      qualification?.status === "PASS" &&
        qualification.planSha256 === expectedSha256 &&
        qualification.sourceSetSha256 === p.sourceSetSha256,
      "Missing or mismatched qualification",
    );
    if (!local)
      check(
        qualification.productionWritesAuthorized === true &&
          qualification.backupVerified === true &&
          qualification.workflowFreezeVerified === true &&
          qualification.qualificationRun,
        "Production qualification/recovery/freeze required",
      );
    check(
      p.records.filter(
        (r) => r.collection === (p.collections?.posts ?? "posts"),
      ).length === 7 &&
        p.records.filter(
          (r) => r.collection === (p.collections?.authors ?? "authors"),
        ).length === 1,
      "Wrong admitted counts",
    );
    check(
      new Set(p.records.map((r) => r.contentId)).size === 8,
      "Duplicate content identities",
    );
    receipt.planSha256 = expectedSha256;
    receipt.sourceSetSha256 = p.sourceSetSha256;
    receipt.origin = p.origin;
    receipt.qualification = qualification;
    save();
    const contentPaths = new Set(
      p.records.flatMap((r) => [
        `content/${r.collection}/${r.contentId}`,
        `content/${r.collection}/${r.contentId}/publish`,
        `revisions/${r.pin.liveRevisionId}`,
      ]),
    );
    const collections = [...new Set(p.records.map((r) => r.collection))],
      readPaths = new Set([
        "auth/me",
        "schema/collections",
        ...collections.flatMap((c) => [
          `content/${c}?limit=100`,
          `schema/collections/${c}/fields`,
        ]),
        ...contentPaths,
      ]);
    for (const op of p.schemaOperations) {
      readPaths.add(op.path.replace(/\/fields\/[^/]+$/, "/fields"));
      if (op.path === "schema/collections")
        readPaths.add("content/" + op.body.slug + "?limit=100");
    }
    async function request(path, method = "GET", body) {
      check(location.origin === p.origin, "CMS origin changed");
      if (method === "GET")
        check(
          readPaths.has(path) ||
            /^content\/[a-z0-9_]+\/[A-Za-z0-9_-]+\/references\/[a-z0-9_-]+\/children\?limit=100$/.test(
              path,
            ),
          "Unapproved GET " + path,
        );
      else {
        check(
          receipt.schemaWrites + receipt.contentWrites <= p.writeBudget,
          "Write budget exceeded",
        );
        receipt.pendingOperation = { path, method };
        save();
      }
      const response = await fetch("/_emdash/api/" + path, {
        method,
        credentials: "same-origin",
        redirect: "error",
        headers: body
          ? { "Content-Type": "application/json", "X-EmDash-Request": "1" }
          : {},
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(30000),
      });
      const text = await response.text();
      check(text.length < 2_000_000, "Oversized REST response");
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw Error(
          `Non-JSON REST response ${method} ${path} HTTP${response.status}`,
        );
      }
      receipt.events.push({
        path,
        method,
        status: response.status,
        errorCode: json.error?.code ?? null,
      });
      save();
      check(
        response.ok && json.success !== false,
        `REST ${method} ${path}: HTTP${response.status} ${json.error?.code ?? "UNKNOWN"}`,
      );
      if (method !== "GET") {
        delete receipt.pendingOperation;
        save();
      }
      return json.data;
    }
    check(
      (await request("auth/me")).role >= 50,
      "Operator administrator required",
    );
    const schema = (await request("schema/collections")).items;
    if (!local)
      check(
        canon(schema.map((c) => c.slug).sort()) === canon(["authors", "posts"]),
        "Production schema changed since admission",
      );
    for (const c of collections) {
      const fields = (await request(`schema/collections/${c}/fields`)).items;
      check(
        canon(fields.map((f) => [f.slug, f.type]).sort()) ===
          canon([
            ["application_id", "string"],
            ["body", "text"],
            ["metadata", "json"],
            ["summary", "text"],
            ["title", "string"],
          ]),
        "Unexpected before-schema " + c,
      );
      const items = (await request(`content/${c}?limit=100`)).items,
        expected = p.records.filter((r) => r.collection === c);
      check(
        items.length === expected.length &&
          items.every((x) => expected.some((r) => r.contentId === x.id)),
        "Unexpected records " + c,
      );
    }
    for (const r of p.records) {
      const item = (await request(`content/${r.collection}/${r.contentId}`))
        .item;
      check(
        item.status === "published" && item.draftRevisionId === null,
        "Draft/unpublished admission",
      );
      check(
        item.liveRevisionId === r.pin.liveRevisionId &&
          item.updatedAt === r.pin.updatedAt &&
          canon(item.data) === canon(r.before.data) &&
          item.slug === r.before.slug &&
          item.publishedAt === r.before.publishedAt,
        "Source drift " + r.applicationId,
      );
      check(
        (await hash(item.data.body)) === r.markdownSha256,
        "Current Markdown changed " + r.applicationId,
      );
    }
    receipt.wholeSetPreflight = "PASS";
    save();
    for (const op of p.schemaOperations) {
      check(
        ["POST", "PUT"].includes(op.method) &&
          op.path.startsWith("schema/collections"),
        "Unapproved schema operation",
      );
      receipt.schemaWrites++;
      await request(op.path, op.method, op.body);
    }
    for (const c of collections) {
      const fields = (await request(`schema/collections/${c}/fields`)).items;
      check(
        fields.find((f) => f.slug === "body")?.type === "text" &&
          fields.find((f) => f.slug === "body")?.widget ===
            "pakrpp-studio:integration",
        "Archive schema changed",
      );
      check(
        fields.find((f) => f.slug === "content")?.type === "portableText",
        "Canonical rich field missing",
      );
    }
    for (const op of p.schemaOperations.filter(
      (op) => op.path === "schema/collections",
    ))
      check(
        (await request("content/" + op.body.slug + "?limit=100")).items
          .length === 0,
        "Unexpected library/Page content",
      );
    for (const r of p.records) {
      const path = `content/${r.collection}/${r.contentId}`,
        current = await request(path);
      check(
        current.item.liveRevisionId === r.pin.liveRevisionId &&
          current.item.draftRevisionId === null &&
          (await hash(current.item.data.body)) === r.markdownSha256,
        "Concurrent edit before record " + r.applicationId,
      );
      receipt.contentWrites++;
      await request(path, "PUT", {
        _rev: current._rev,
        data: r.data,
        ...(r.references ? { references: r.references } : {}),
      });
      const draft = await request(path);
      check(
        draft.item.id === r.contentId &&
          draft.item.liveRevisionId === r.pin.liveRevisionId &&
          draft.item.draftRevisionId,
        "Migration draft not staged",
      );
      receipt.contentWrites++;
      await request(path + "/publish", "POST", {
        _rev: draft._rev,
        publishedAt: r.before.publishedAt,
      });
      const item = (await request(path)).item;
      check(
        item.id === r.contentId &&
          item.liveRevisionId !== r.pin.liveRevisionId &&
          item.status === "published" &&
          item.draftRevisionId === null,
        "Publication state mismatch",
      );
      check(
        item.slug === r.before.slug &&
          item.publishedAt === r.before.publishedAt,
        "Slug/date changed",
      );
      for (const key of Object.keys(r.before.data))
        check(
          canon(item.data[key]) === canon(r.before.data[key]),
          "Archived editorial field changed " + key,
        );
      for (const key of Object.keys(r.data))
        check(
          canon(item.data[key]) === canon(r.data[key]),
          "Rich field differs " + key,
        );
      check(
        (await hash(JSON.stringify(item.data.content))) ===
          r.portableTextSha256,
        "Portable Text digest mismatch",
      );
      check(
        canon((await request(path)).item) === canon(item),
        "Unstable repeated read",
      );
      const history = await request("revisions/" + r.pin.liveRevisionId);
      check(
        history.item.data.body === r.before.data.body,
        "Historical Markdown changed",
      );
      if (r.references?.authors?.length) {
        const field = (
          await request(`schema/collections/${r.collection}/fields`)
        ).items.find((f) => f.slug === "authors");
        check(field?.validation?.relation, "Native author relation missing");
        const children = (
          await request(
            path +
              "/references/" +
              field.validation.relation +
              "/children?limit=100",
          )
        ).children;
        check(
          canon(children.map((x) => x.id).sort()) ===
            canon([...r.references.authors].sort()),
          "Native author edges mismatch",
        );
      }
      receipt.records.push({
        applicationId: r.applicationId,
        pin: {
          origin: p.origin,
          collection: r.collection,
          id: item.id,
          liveRevisionId: item.liveRevisionId,
          updatedAt: item.updatedAt,
          titleField: "title",
          summaryField: "summary",
        },
        previousPin: r.pin,
        previousReviewedPin: r.previousReviewedPin,
        markdownSha256: r.markdownSha256,
        portableTextSha256: r.portableTextSha256,
        migratedAt: item.updatedAt,
        canonicalBodyField: "content",
        dataSha256: await hash(canon(item.data)),
        authorReferences: r.references?.authors ?? [],
        item: publicItem(item),
      });
      save();
    }
    for (const c of collections) {
      const rows = (await request(`content/${c}?limit=100`)).items,
        expected = p.records.filter((r) => r.collection === c);
      check(
        rows.length === expected.length &&
          rows.every((x) => expected.some((r) => r.contentId === x.id)),
        "Final record count mismatch",
      );
    }
    for (const r of receipt.records) {
      const path = `content/${r.pin.collection}/${r.pin.id}`,
        a = (await request(path)).item,
        b = (await request(path)).item;
      check(
        canon(a) === canon(b) && canon(publicItem(a)) === canon(r.item),
        "Final state drift " + r.applicationId,
      );
    }
    check(
      receipt.schemaWrites === p.schemaOperations.length &&
        receipt.contentWrites === 16,
      "Unexpected operation count",
    );
    receipt.status = "PASS";
    receipt.newContentRecords = 0;
    save();
    return receipt;
  } catch (error) {
    receipt.status = "FAIL";
    receipt.failure = error.message;
    save();
    throw error;
  }
}
