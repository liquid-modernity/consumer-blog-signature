import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const inventoryBytes = readFileSync("docs/UI-PRESERVATION.json");
const inventory = JSON.parse(inventoryBytes);
const pageFrame = "src/components/gaga/PageFrame.astro";
const gate = resolve("tools/gaga/preservation.mjs");
const digest = value => createHash("sha256").update(value).digest("hex");

function check(change = () => {}) {
  const root = mkdtempSync(join(tmpdir(), "publication-preservation-"));
  try {
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "docs/UI-PRESERVATION.json"), inventoryBytes);
    for (const file of inventory.files) {
      mkdirSync(dirname(join(root, file.path)), { recursive: true });
      writeFileSync(join(root, file.path), execFileSync('git', ['show', 'c160e6712ec61369cac7e73ecde156aeaac27474:' + file.path]));
    }
    change(root);
    return spawnSync(process.execPath, [gate], { cwd: root, encoding: "utf8" });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("the exact qualified main correction and all 53 historical entries pass", () => {
  assert.equal(digest(inventoryBytes), "0fc6f482051c2f35c08e943c0924fb60567316f3e094d10b917c937bca816d4b");
  assert.equal(inventory.files.length, 54);
  const result = check();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /one exact qualified main-landmark correction/);
  assert.match(result.stdout, /fe2fa7a47de0dc38799fe63a3e646e7fd7e1cd9a/);
  assert.match(result.stdout, /40752951927/);
});

test("reverting to the historical div wrapper is not current admission", () => {
  const result = check(root => {
    const path = join(root, pageFrame);
    const source = readFileSync(path, "utf8");
    assert.equal(source.split("  contentClass={contentClass}\n").length, 2);
    const previous = source.replace("  contentClass={contentClass}\n", "  contentClass={contentClass}\n  mainElement=\"div\"\n");
    assert.equal(digest(previous), inventory.files.find(f => f.path === pageFrame).sha256AfterImportRename);
    writeFileSync(path, previous);
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unintended application UI\/style\/routing change: src\/components\/gaga\/PageFrame.astro/);
});

test("any additional PageFrame bytes remain rejected", () => {
  const result = check(root => {
    const path = join(root, pageFrame);
    writeFileSync(path, readFileSync(path, "utf8") + "\n<!-- unapproved -->\n");
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unintended application UI\/style\/routing change/);
});

test("an unrelated route/config change remains rejected", () => {
  const result = check(root => {
    const path = join(root, "src/config/routes.ts");
    writeFileSync(path, readFileSync(path, "utf8") + "\n// unapproved\n");
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unintended application UI\/style\/routing change: src\/config\/routes.ts/);
});

test("broadly refreshing historical hashes cannot admit a change", () => {
  const result = check(root => {
    const replacement = structuredClone(inventory);
    for (const file of replacement.files) {
      const path = join(root, file.path);
      writeFileSync(path, readFileSync(path, "utf8") + "\n<!-- unapproved refresh -->\n");
      file.sha256AfterImportRename = digest(readFileSync(path));
    }
    writeFileSync(join(root, "docs/UI-PRESERVATION.json"), JSON.stringify(replacement));
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Historical UI inventory changed without admission/);
});

test("the existing historical package-import normalization is preserved", () => {
  const file = inventory.files.find(f => f.path !== pageFrame && /@gaga\/engine-(?:runtime|capabilities)/.test(readFileSync(f.path, "utf8")));
  assert.ok(file);
  const result = check(root => {
    const path = join(root, file.path);
    const current = readFileSync(path, "utf8");
    const legacy = current.replaceAll("@gaga/engine-runtime", "@gaga/engine-web").replaceAll("@gaga/engine-capabilities/", "@gaga/engine/");
    assert.notEqual(legacy, current);
    writeFileSync(path, legacy);
  });
  assert.equal(result.status, 0, result.stderr);
});

function accepted(root) {
  for (const file of inventory.files) writeFileSync(join(root, file.path), execFileSync('git', ['show', '2cd17acdf6a262f184b10c68bf15e77007d2b42d:' + file.path]));
}
test("the entire exact accepted UX profile passes with immutable provenance", () => {
  const r = check(accepted);assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /whole accepted UX profile 2cd17acdf6a262f184b10c68bf15e77007d2b42d/);
  assert.match(r.stdout, /40884201685/);
});
test("a hybrid of accepted and historical UI bytes is rejected", () => {
  const r = check(root => {accepted(root);writeFileSync(join(root, inventory.files[0].path), execFileSync('git',['show','c160e6712ec61369cac7e73ecde156aeaac27474:'+inventory.files[0].path]));});
  assert.notEqual(r.status, 0);assert.match(r.stderr, /Unintended application UI\/style\/routing change/);
});
test("additional unaccepted bytes in the accepted UX profile are rejected", () => {
  const r = check(root => {accepted(root);const path=join(root,inventory.files[0].path);writeFileSync(path,readFileSync(path,'utf8')+'\n<!-- unaccepted -->\n');});
  assert.notEqual(r.status, 0);assert.match(r.stderr, /Unintended application UI\/style\/routing change/);
});
test("unrelated configuration changes remain rejected in the accepted profile", () => {
  const r = check(root => {accepted(root);const path=join(root,'src/config/routes.ts');writeFileSync(path,readFileSync(path,'utf8')+'\n// unapproved\n');});
  assert.notEqual(r.status, 0);assert.match(r.stderr, /Unintended application UI\/style\/routing change: src\/config\/routes.ts/);
});

function polished(root) {
  for (const file of inventory.files) writeFileSync(join(root, file.path), execFileSync('git', ['show', '94fa4483d260d90f7687968c8d14e1b1e8dbb5bc:' + file.path]));
}
test("the whole exact V2 polish profile passes with immutable hosted provenance", () => {
  const result = check(polished);assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/whole qualified polish profile 94fa4483d260d90f7687968c8d14e1b1e8dbb5bc/);assert.match(result.stdout,/40937969581/);
});
test("an unreviewed mixture of V2 and accepted V1 remains rejected", () => {
 const result=check(root=>{accepted(root);const path='src/components/frame/ActionRuntime.astro';writeFileSync(join(root,path),execFileSync('git',['show','94fa4483d260d90f7687968c8d14e1b1e8dbb5bc:'+path]));});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Unintended application UI\/style\/routing change/);
});
test("additional bytes in the qualified V2 profile still fail closed", () => {
 const result=check(root=>{polished(root);const path=join(root,'src/components/frame/ActionRuntime.astro');writeFileSync(path,readFileSync(path,'utf8')+'\n<!-- unqualified -->\n');});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Unintended application UI\/style\/routing change/);
});
test("V2 cannot admit unrelated route configuration changes", () => {
 const result=check(root=>{polished(root);const path=join(root,'src/config/routes.ts');writeFileSync(path,readFileSync(path,'utf8')+'\n// unqualified\n');});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Unintended application UI\/style\/routing change/);
});

function documented(root) {
 for (const file of inventory.files) writeFileSync(join(root,file.path),execFileSync('git',['show','f0a52db9b941a237455f386941bb5689cd80f63b:'+file.path]));
}
test("the whole qualified documentation profile passes with exact hosted provenance",()=>{
 const r=check(documented);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/whole qualified documentation profile f0a52db9b941a237455f386941bb5689cd80f63b/);assert.match(r.stdout,/41106193649/);
});
test("documentation and earlier profiles cannot form an unqualified hybrid",()=>{
 const r=check(root=>{documented(root);const f='src/components/frame/ActionRuntime.astro';writeFileSync(join(root,f),execFileSync('git',['show','c462ab8074f2d17187f1fde5791457bde2ec15f3:'+f]));});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});
test("extra document PageFrame bytes fail closed",()=>{
 const r=check(root=>{documented(root);const p=join(root,pageFrame);writeFileSync(p,readFileSync(p,'utf8')+'\n<!-- unqualified -->\n');});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});
test("documentation admission cannot permit unrelated route configuration changes",()=>{
 const r=check(root=>{documented(root);const p=join(root,'src/config/routes.ts');writeFileSync(p,readFileSync(p,'utf8')+'\n// unqualified\n');});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});

function personalized(root) {
 for (const file of inventory.files) writeFileSync(join(root,file.path),execFileSync('git',['show','8e643d4f49e8f02690d3258816fbf29ad46af8c2:'+file.path]));
}
test("the whole exact Personal State profile passes with qualified hosted provenance",()=>{
 const r=check(personalized);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/whole qualified personal profile 8e643d4f49e8f02690d3258816fbf29ad46af8c2/);assert.match(r.stdout,/41146809645/);
});
test("Personal State and documentation profiles cannot form an unqualified hybrid",()=>{
 const r=check(root=>{personalized(root);const p='src/styles/partials/_reader.scss';writeFileSync(join(root,p),execFileSync('git',['show','0aa28ec8cbcef46a5c117b26cc2cfbb7dbb3bf88:'+p]));});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});
test("extra Personal State frame bytes remain rejected",()=>{
 const r=check(root=>{personalized(root);const p=join(root,pageFrame);writeFileSync(p,readFileSync(p,'utf8')+'\n<!-- not qualified -->\n');});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});
test("Personal State profile cannot admit unrelated routing changes",()=>{
 const r=check(root=>{personalized(root);const p=join(root,'src/config/routes.ts');writeFileSync(p,readFileSync(p,'utf8')+'\n// not qualified\n');});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});

function motionProfile(root) {
 for (const file of inventory.files) writeFileSync(join(root,file.path),execFileSync('git',['show','e276f57b063bd2f8f8b5968f6388607eca1a495a:'+file.path]));
}
test("the whole exact motion profile passes with qualified hosted provenance",()=>{
 const r=check(motionProfile);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/whole qualified motion profile e276f57b063bd2f8f8b5968f6388607eca1a495a/);assert.match(r.stdout,/41178960284/);
});
test("motion and earlier profiles cannot form an unqualified hybrid",()=>{
 const r=check(root=>{motionProfile(root);const p='src/styles/partials/_action-island.scss';writeFileSync(join(root,p),execFileSync('git',['show','307118dd9776630bc0dd2ccc605285d8d52ef452:'+p]));});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});
test("extra motion component bytes remain rejected",()=>{
 const r=check(root=>{motionProfile(root);const p=join(root,'src/components/frame/ActionRuntime.astro');writeFileSync(p,readFileSync(p,'utf8')+'\n<!-- not qualified -->\n');});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});
test("motion admission cannot permit unrelated routing changes",()=>{
 const r=check(root=>{motionProfile(root);const p=join(root,'src/config/routes.ts');writeFileSync(p,readFileSync(p,'utf8')+'\n// not qualified\n');});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});

function motionTouchProfile(root) {
 for (const file of inventory.files) writeFileSync(join(root,file.path),execFileSync('git',['show','dbf5502751c1b74bba392e9792260f4ae0cfb1ec:'+file.path]));
}
test("whole native touch-pan correction passes with exact hosted provenance",()=>{
 const r=check(motionTouchProfile);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/whole qualified motion-touch profile dbf5502751c1b74bba392e9792260f4ae0cfb1ec/);assert.match(r.stdout,/41180574062/);
});
test("touch correction cannot mix with pre-motion styles",()=>{
 const r=check(root=>{motionTouchProfile(root);const p='src/styles/partials/_action-island.scss';writeFileSync(join(root,p),execFileSync('git',['show','307118dd9776630bc0dd2ccc605285d8d52ef452:'+p]));});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});
test("touch admission rejects extra component bytes",()=>{
 const r=check(root=>{motionTouchProfile(root);const p=join(root,'src/components/frame/ActionRuntime.astro');writeFileSync(p,readFileSync(p,'utf8')+'\n<!-- not qualified -->\n');});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});
test("touch admission cannot permit unrelated routes",()=>{
 const r=check(root=>{motionTouchProfile(root);const p=join(root,'src/config/routes.ts');writeFileSync(p,readFileSync(p,'utf8')+'\n// not qualified\n');});assert.notEqual(r.status,0);assert.match(r.stderr,/Unintended application UI/);
});
