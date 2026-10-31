import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
// Admit only the semantic main correction qualified at this immutable source/run.
const approvedMain = Object.freeze({
  path: "src/components/gaga/PageFrame.astro",
  historicalInventorySha256: "0fc6f482051c2f35c08e943c0924fb60567316f3e094d10b917c937bca816d4b",
  historicalSha256: "a0fc326ac16811880529ab14bf909a50ea46b40ef0e24856448581e41a79ef0b",
  admittedSha256: "743156b9bf59f79dfae0648224bbe0ef50054fc18ac23f24ddbae21319dd12f8",
  sourceCommit: "fe2fa7a47de0dc38799fe63a3e646e7fd7e1cd9a",
  sourceTree: "fa53ad503ee0c4b742c03207d833c69373a1866e",
  qualification: "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/40752951927",
});
// Admit complete qualified profiles only; per-file alternatives would accept unreviewed hybrids.
const approvedUx = Object.freeze({
  "sourceCommit": "2cd17acdf6a262f184b10c68bf15e77007d2b42d",
  "sourceTree": "88e1d18bc37c40a49518e3136e3a74f086a8a536",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/40884201685",
  "acceptanceReceiptSha256": "3e4f8554706b81c54887e29fa1ba56b6875368c4752bc76a5a1fe8cdfe1d8661",
  "files": {
    "src/components/frame/ActionRuntime.astro": "1cfc80c547cff6f9b830c5fc58a0a375750954ccde13ecc1d849538beb67920d",
    "src/components/frame/AppFrameBase.astro": "7775fccfab96d0f1430401075565a01bb92d1f4fa59b6564e67bd1641ab0a82e",
    "src/components/frame/ArticleOutlinePeek.astro": "679ce8b5399a7aa8b532de9ce672e9c3639d77c0cba204ec79541169ecee82c3",
    "src/components/frame/LeftRail.astro": "2d9d068f4b58e3f33a08f0ee08adb44a89ce3bf7985b5aaf78dd4805bd3087fe",
    "src/components/frame/RightInfoRail.astro": "8b13376ca332d19632b409ad935420e5d36f333f210e04bb48134bb4e704c636",
    "src/components/gaga/ArticleShell.astro": "3aea239bb1d5b422f522ef0a2d1b8f955ba94cce79a07ac51a8a5b782320ac73",
    "src/components/gaga/MarkdownContent.astro": "a7880f6a08ead406d9100e4286a9035a7f0b930aa10df679dd4d7c0178389f73",
    "src/styles/partials/_action-island.scss": "be77c541bed174d2c6267892633318c57eb7540f59b46ad471af30d8cd6e8d0b",
    "src/styles/partials/_content.scss": "8c7bbeedd890852d9ffe67174e6d2537866e3353e3fda0c801d05b34c7b2f379",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "58091ab7af72ba4d7bce4fcbc581b2b0ed70226747a104e32a1d230a44e18b9f"
  }
});
// Additive exact V2 profile; historical inventory and earlier admissions remain immutable.
const approvedPolish = Object.freeze({
  "sourceCommit": "94fa4483d260d90f7687968c8d14e1b1e8dbb5bc",
  "sourceTree": "d4f6066c52a9966242d899e6bf1bab5598f30111",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/40937969581",
  "acceptanceReceiptSha256": "9fb0731973a21aad8084a753e9703cb5f8de7c54b709b51ed2f5f2c305c7d25e",
  "files": {
    "src/components/frame/ActionRuntime.astro": "cb048404b9593733842737a14a88b66bd986013da0b4316b93587c4ad76e70b7",
    "src/components/frame/AppFrameBase.astro": "7775fccfab96d0f1430401075565a01bb92d1f4fa59b6564e67bd1641ab0a82e",
    "src/components/frame/ArticleOutlinePeek.astro": "12d5b5e2fb815d39d26493b4b7cdbc9b6b15938fb74dbaf63bb18c9ae5053585",
    "src/components/frame/LeftRail.astro": "2d9d068f4b58e3f33a08f0ee08adb44a89ce3bf7985b5aaf78dd4805bd3087fe",
    "src/components/frame/RightInfoRail.astro": "8b13376ca332d19632b409ad935420e5d36f333f210e04bb48134bb4e704c636",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/MarkdownContent.astro": "a7880f6a08ead406d9100e4286a9035a7f0b930aa10df679dd4d7c0178389f73",
    "src/styles/partials/_action-island.scss": "be77c541bed174d2c6267892633318c57eb7540f59b46ad471af30d8cd6e8d0b",
    "src/styles/partials/_content.scss": "361e793ecb93cd1b4fe1fca9d601a31fe6a3fce8fc20f9413fa3633bfc280787",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "42878bdeb3a5ec8548b52977cb1ae683ab27c97de3e75ebe30ab01b98635bff2"
  }
});
// Additive whole documentation profile; no per-file alternatives or historical inventory refresh.
const approvedDocumentation = Object.freeze({
  "sourceCommit": "f0a52db9b941a237455f386941bb5689cd80f63b",
  "sourceTree": "13ff69494c719bd543025ae142182dad18a8e8e4",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41106193649",
  "acceptanceReceiptSha256": "3de929b3c6f5c4309b4934085d7309395411454e034ad69929c9559f02ec4e84",
  "files": {
    "src/components/frame/ActionRuntime.astro": "444a5cf111876a2e8f80699d5d9e197934268e5f0333c3d21eaf3aba703f9c71",
    "src/components/frame/AppFrameBase.astro": "989f98c4c72414400d428cd9b0c25f172fde4f88185219d702c174691d9d77c0",
    "src/components/frame/ArticleOutlinePeek.astro": "8164f472ab8994df418f5cb2ee873f7c2074b7b565192ad534c5ce9ebfa720ba",
    "src/components/frame/LeftRail.astro": "2d9d068f4b58e3f33a08f0ee08adb44a89ce3bf7985b5aaf78dd4805bd3087fe",
    "src/components/frame/RightInfoRail.astro": "8b13376ca332d19632b409ad935420e5d36f333f210e04bb48134bb4e704c636",
    "src/components/frame/StandaloneAppFrame.astro": "496c125172fc95085975dea545b5b51a85d059ccb6dc9fbea16fbb46261012b8",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/MarkdownContent.astro": "320518f05b3409a376cf80c3c080f0bf1bff067309deaa2727329e01c5e32a30",
    "src/components/gaga/PageFrame.astro": "607f813b1f7ddc1e9464bbd4004cd0e2bfa2f2d17b5d27ce1f58f2167cebfe2e",
    "src/config/nav.ts": "cae2b243b44e71cc94cd1a1ec67bad232f605ea9fad598597cfacae408e10930",
    "src/styles/partials/_action-island.scss": "be77c541bed174d2c6267892633318c57eb7540f59b46ad471af30d8cd6e8d0b",
    "src/styles/partials/_content.scss": "361e793ecb93cd1b4fe1fca9d601a31fe6a3fce8fc20f9413fa3633bfc280787",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "42878bdeb3a5ec8548b52977cb1ae683ab27c97de3e75ebe30ab01b98635bff2"
  }
});
// Additive exact whole Personal State profile; historical profiles and inventory remain immutable.
const approvedPersonal = Object.freeze({
  "sourceCommit": "8e643d4f49e8f02690d3258816fbf29ad46af8c2",
  "sourceTree": "e03f2b4863c85c0704fbf8af4dfc45b99d655eb8",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41146809645",
  "acceptanceReceiptSha256": "ce25ea1dcbd3aa4f76a59553d0fad0a22963541195aa0bcfac518f21b2483996",
  "files": {
    "src/components/frame/ActionRuntime.astro": "444a5cf111876a2e8f80699d5d9e197934268e5f0333c3d21eaf3aba703f9c71",
    "src/components/frame/AppFrameBase.astro": "989f98c4c72414400d428cd9b0c25f172fde4f88185219d702c174691d9d77c0",
    "src/components/frame/ArticleOutlinePeek.astro": "8164f472ab8994df418f5cb2ee873f7c2074b7b565192ad534c5ce9ebfa720ba",
    "src/components/frame/LeftRail.astro": "2d9d068f4b58e3f33a08f0ee08adb44a89ce3bf7985b5aaf78dd4805bd3087fe",
    "src/components/frame/RightInfoRail.astro": "8b13376ca332d19632b409ad935420e5d36f333f210e04bb48134bb4e704c636",
    "src/components/frame/StandaloneAppFrame.astro": "496c125172fc95085975dea545b5b51a85d059ccb6dc9fbea16fbb46261012b8",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/MarkdownContent.astro": "5244b38e779359bf55db1d9cdaac4d7661d3783275e0bb4f02c9afddf8df9b85",
    "src/components/gaga/PageFrame.astro": "ed7434c2f74770cc5be22853ee13c0db6f43be17424fd2417cbe30371a7acbde",
    "src/config/nav.ts": "cae2b243b44e71cc94cd1a1ec67bad232f605ea9fad598597cfacae408e10930",
    "src/styles/partials/_action-island.scss": "be77c541bed174d2c6267892633318c57eb7540f59b46ad471af30d8cd6e8d0b",
    "src/styles/partials/_content.scss": "361e793ecb93cd1b4fe1fca9d601a31fe6a3fce8fc20f9413fa3633bfc280787",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "42878bdeb3a5ec8548b52977cb1ae683ab27c97de3e75ebe30ab01b98635bff2",
    "src/styles/partials/_reader.scss": "e212c0e2bebd013beaa7904b9466eab9830ed878e62880c5f3cc980ea0edf955"
  }
});
// Additive whole motion profile, admitted only after exact hosted qualification.
const approvedMotion = Object.freeze({
  "sourceCommit": "e276f57b063bd2f8f8b5968f6388607eca1a495a",
  "sourceTree": "651681846e41731caf0470f8c5b7738c17369f5e",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41178960284",
  "acceptanceReceiptSha256": "f85e5bd06f2511c10c9a790f72bdc1075a2f007b71e144de1d4892873fb3bf88",
  "files": {
    "src/components/frame/ActionRuntime.astro": "7032c94c7e6e7d419a893c6df761b676ee4f38a3343f9ae710a164dc691555b7",
    "src/components/frame/AppFrameBase.astro": "989f98c4c72414400d428cd9b0c25f172fde4f88185219d702c174691d9d77c0",
    "src/components/frame/ArticleOutlinePeek.astro": "8164f472ab8994df418f5cb2ee873f7c2074b7b565192ad534c5ce9ebfa720ba",
    "src/components/frame/LeftRail.astro": "2d9d068f4b58e3f33a08f0ee08adb44a89ce3bf7985b5aaf78dd4805bd3087fe",
    "src/components/frame/RightInfoRail.astro": "8b13376ca332d19632b409ad935420e5d36f333f210e04bb48134bb4e704c636",
    "src/components/frame/StandaloneAppFrame.astro": "496c125172fc95085975dea545b5b51a85d059ccb6dc9fbea16fbb46261012b8",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/MarkdownContent.astro": "5244b38e779359bf55db1d9cdaac4d7661d3783275e0bb4f02c9afddf8df9b85",
    "src/components/gaga/PageFrame.astro": "ed7434c2f74770cc5be22853ee13c0db6f43be17424fd2417cbe30371a7acbde",
    "src/config/nav.ts": "cae2b243b44e71cc94cd1a1ec67bad232f605ea9fad598597cfacae408e10930",
    "src/styles/partials/_action-island.scss": "14bcbb8bc42b2eb708d209e9aac47b870d1a1cb5d551f0f72e103d21ff5f8c43",
    "src/styles/partials/_content.scss": "361e793ecb93cd1b4fe1fca9d601a31fe6a3fce8fc20f9413fa3633bfc280787",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "e684221f26dfc12f91a8d845c76217cdc7a4d7724f38645354e640ca4f6ea17f",
    "src/styles/partials/_reader.scss": "e212c0e2bebd013beaa7904b9466eab9830ed878e62880c5f3cc980ea0edf955"
  }
});
const historical = readFileSync("docs/UI-PRESERVATION.json");
assert.equal(
  createHash("sha256").update(historical).digest("hex"),
  approvedMain.historicalInventorySha256,
  "Historical UI inventory changed without admission",
);
const inventory = JSON.parse(historical);
assert.equal(inventory.files.filter(f => f.path === approvedMain.path).length, 1);
assert.equal(inventory.files.find(f => f.path === approvedMain.path).sha256AfterImportRename, approvedMain.historicalSha256);
const historicalHashes = new Map(inventory.files.map(f => [f.path,
  f.path === approvedMain.path ? approvedMain.admittedSha256 : f.sha256AfterImportRename]));
for (const [path, digest] of Object.entries(approvedUx.files)) {
  assert.ok(historicalHashes.has(path) && path !== approvedMain.path && /^[a-f0-9]{64}$/.test(digest));
  assert.notEqual(digest, historicalHashes.get(path));
}
for (const [path, digest] of Object.entries(approvedPolish.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path, digest] of Object.entries(approvedDocumentation.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path, digest] of Object.entries(approvedPersonal.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path, digest] of Object.entries(approvedMotion.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
const actual = new Map(inventory.files.map(f => [f.path, createHash("sha256").update(
  readFileSync(f.path, "utf8").replaceAll("@gaga/engine-web", "@gaga/engine-runtime")
    .replaceAll("@gaga/engine/", "@gaga/engine-capabilities/"),
).digest("hex")]));
const motionProfile = Object.entries(approvedMotion.files).every(([path, digest]) => actual.get(path) === digest);
const personalProfile = Object.entries(approvedPersonal.files).every(([path, digest]) => actual.get(path) === digest);
const documentationProfile = Object.entries(approvedDocumentation.files).every(([path, digest]) => actual.get(path) === digest);
const polishProfile = Object.entries(approvedPolish.files).every(([path, digest]) => actual.get(path) === digest);
const historicalProfile = Object.keys(approvedUx.files).every(path => actual.get(path) === historicalHashes.get(path));
for (const f of inventory.files) {
  const expected = motionProfile ? approvedMotion.files[f.path] ?? historicalHashes.get(f.path) : personalProfile ? approvedPersonal.files[f.path] ?? historicalHashes.get(f.path) : documentationProfile ? approvedDocumentation.files[f.path] ?? historicalHashes.get(f.path) : polishProfile ? approvedPolish.files[f.path] ?? historicalHashes.get(f.path) : historicalProfile ? historicalHashes.get(f.path) : approvedUx.files[f.path] ?? historicalHashes.get(f.path);
  assert.equal(actual.get(f.path), expected, "Unintended application UI/style/routing change: " + f.path);
}
console.log(
  "Preserved application UI/style/routing:",
  inventory.files.length,
  "entries; one exact qualified main-landmark correction from",
  approvedMain.sourceCommit,
  approvedMain.qualification,
  motionProfile ? "whole qualified motion profile " + approvedMotion.sourceCommit + " " + approvedMotion.qualification : personalProfile ? "whole qualified personal profile " + approvedPersonal.sourceCommit + " " + approvedPersonal.qualification : documentationProfile ? "whole qualified documentation profile " + approvedDocumentation.sourceCommit + " " + approvedDocumentation.qualification : polishProfile ? "whole qualified polish profile " + approvedPolish.sourceCommit + " " + approvedPolish.qualification : historicalProfile ? "historical profile" : "whole accepted UX profile " + approvedUx.sourceCommit + " " + approvedUx.qualification,
);
