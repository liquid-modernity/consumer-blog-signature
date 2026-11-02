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
// Exact touch-pan correction; prior whole profiles remain valid historical evidence.
const approvedMotionTouch = Object.freeze({
  "sourceCommit": "dbf5502751c1b74bba392e9792260f4ae0cfb1ec",
  "sourceTree": "8bc6e2ecb5479c82402420f5300b4a333409165d",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41180574062",
  "acceptanceReceiptSha256": "2fcbe64ae33e94367135ad954440f615c132d0f54a1eb6c5af0289e33e68b8e5",
  "files": {
    "src/components/frame/ActionRuntime.astro": "cf0c34d7cc43aa5b273dcb1b48732906b555782d162ce7cec3800a99420bd85d",
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
// Exact whole contextual family profile; all historical inventories/profiles remain immutable.
const approvedFamily = Object.freeze({
  "sourceCommit": "e842974a49fb79105bc897fd8850fa8c22470682",
  "sourceTree": "263499a2020ebaad271595901ee00bbf877386b6",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41190571334",
  "acceptanceReceiptSha256": "984aa520b03a32277d1f62f46266f07132f9d73cf9b4112314855c24e56a63b2",
  "files": {
    "src/components/frame/ActionRuntime.astro": "0fe11229e31f508addcdf156e83a49ef509b89187bf543943cf78de57eea9822",
    "src/components/frame/AppFrameBase.astro": "d6e53074fd67201ea8f7c8de368d12cc067c62dabbc72e42c24642548cfa40d8",
    "src/components/frame/ArticleOutlinePeek.astro": "34f8a71de373afb91004c5fa7f9031a101c4c604aea8fd6eee8b2f34b90aad9e",
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
    "src/styles/partials/_outline-peek.scss": "6a546c732c1d4caf349cee26a3bd0084936ea7f54e522b804cbda35a9fb7274d",
    "src/styles/partials/_reader.scss": "346ddfd9d1e62eb4c515b6aeab49f29d420600518b52c6deb5a02d6f54cd3a63",
    "src/styles/signature.scss": "4dc0b36890c3b293cc93bd19e5164201ff14af308437455984c7c9acd8aaf866"
  }
});
// Exact hosted-qualified Super Share composition; all earlier profiles and inventory stay immutable.
const approvedSuperShare = Object.freeze({
  "sourceCommit": "78ba5e84ff2e56c81449b5d431bc05822d1170e2",
  "sourceTree": "a1fb8f9f08acc1915eba27cf37d3fa299299e563",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41203545952",
  "acceptanceReceiptSha256": "e4c65f93cbd9766a701e3a5ba70aef3d4577d6115723d9054ca89e941495da27",
  "files": {
    "src/components/frame/ActionRuntime.astro": "265a9e9175baf67ea33569beb0e65ae24c92f6231f0fbb3ee31c97658ec675dc",
    "src/components/frame/AppFrameBase.astro": "d6e53074fd67201ea8f7c8de368d12cc067c62dabbc72e42c24642548cfa40d8",
    "src/components/frame/ArticleOutlinePeek.astro": "34f8a71de373afb91004c5fa7f9031a101c4c604aea8fd6eee8b2f34b90aad9e",
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
    "src/styles/partials/_outline-peek.scss": "6a546c732c1d4caf349cee26a3bd0084936ea7f54e522b804cbda35a9fb7274d",
    "src/styles/partials/_reader.scss": "346ddfd9d1e62eb4c515b6aeab49f29d420600518b52c6deb5a02d6f54cd3a63",
    "src/styles/signature.scss": "4dc0b36890c3b293cc93bd19e5164201ff14af308437455984c7c9acd8aaf866"
  }
});
// Exact hosted-qualified Personal Presence navigation/routes; earlier inventories and profiles stay immutable.
const approvedPresence = Object.freeze({
  "sourceCommit": "4938a09f3506197cff7ce153981d1f173b195667",
  "sourceTree": "2174339c6f95cfe15b3a51294c958443ec0eaeb6",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41227281162",
  "acceptanceReceiptSha256": "0625bdace0b890d4cb16689716d93a3bb37fb81b8257145f7b978c10baa5c393",
  "files": {
    "src/components/frame/ActionRuntime.astro": "265a9e9175baf67ea33569beb0e65ae24c92f6231f0fbb3ee31c97658ec675dc",
    "src/components/frame/AppFrameBase.astro": "d6e53074fd67201ea8f7c8de368d12cc067c62dabbc72e42c24642548cfa40d8",
    "src/components/frame/ArticleOutlinePeek.astro": "34f8a71de373afb91004c5fa7f9031a101c4c604aea8fd6eee8b2f34b90aad9e",
    "src/components/frame/LeftRail.astro": "2d9d068f4b58e3f33a08f0ee08adb44a89ce3bf7985b5aaf78dd4805bd3087fe",
    "src/components/frame/RightInfoRail.astro": "8b13376ca332d19632b409ad935420e5d36f333f210e04bb48134bb4e704c636",
    "src/components/frame/StandaloneAppFrame.astro": "496c125172fc95085975dea545b5b51a85d059ccb6dc9fbea16fbb46261012b8",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/MarkdownContent.astro": "5244b38e779359bf55db1d9cdaac4d7661d3783275e0bb4f02c9afddf8df9b85",
    "src/components/gaga/PageFrame.astro": "ed7434c2f74770cc5be22853ee13c0db6f43be17424fd2417cbe30371a7acbde",
    "src/config/nav.ts": "d6fa86a5cc9328c4c6788ebc296d41be5d1d25cf70c4f3b50e1df3f273afe447",
    "src/styles/partials/_action-island.scss": "14bcbb8bc42b2eb708d209e9aac47b870d1a1cb5d551f0f72e103d21ff5f8c43",
    "src/styles/partials/_content.scss": "361e793ecb93cd1b4fe1fca9d601a31fe6a3fce8fc20f9413fa3633bfc280787",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "6a546c732c1d4caf349cee26a3bd0084936ea7f54e522b804cbda35a9fb7274d",
    "src/styles/partials/_reader.scss": "346ddfd9d1e62eb4c515b6aeab49f29d420600518b52c6deb5a02d6f54cd3a63",
    "src/styles/signature.scss": "4dc0b36890c3b293cc93bd19e5164201ff14af308437455984c7c9acd8aaf866",
    "src/config/routes.ts": "a1faf69463d00a4d4be677a342474ec395a7d2326b02ad50bed0e1098b63cd4a"
  }
});
// Exact hosted-qualified local navigation profile; all historical inventories and profiles remain immutable.
const approvedLocalNavigation = Object.freeze({
  "sourceCommit": "77abb2950c9400fc4a20ca8f79afdd809f27989a",
  "sourceTree": "4cd12c30e2bd13d121bbd45831fdee36cb89217e",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41254715596",
  "acceptanceReceiptSha256": "7b7654c2419fe7352333540d5c2c6ab40eeb4643cb07f622c33b3af14be3ed12",
  "files": {
    "src/components/frame/ActionRuntime.astro": "265a9e9175baf67ea33569beb0e65ae24c92f6231f0fbb3ee31c97658ec675dc",
    "src/components/frame/AppFrameBase.astro": "d6e53074fd67201ea8f7c8de368d12cc067c62dabbc72e42c24642548cfa40d8",
    "src/components/frame/ArticleOutlinePeek.astro": "766ed55148672b9603290e0dbf2efeae8e35843848355fbf48c07395d84317f2",
    "src/components/frame/LeftRail.astro": "2d9d068f4b58e3f33a08f0ee08adb44a89ce3bf7985b5aaf78dd4805bd3087fe",
    "src/components/frame/RightInfoRail.astro": "8b13376ca332d19632b409ad935420e5d36f333f210e04bb48134bb4e704c636",
    "src/components/frame/StandaloneAppFrame.astro": "07b05dc40af425c7b0cf412368658124069bb26bf840158aec23ffaaf1b65b7f",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/MarkdownContent.astro": "5244b38e779359bf55db1d9cdaac4d7661d3783275e0bb4f02c9afddf8df9b85",
    "src/components/gaga/PageFrame.astro": "45ada41317d9e863b96c00f37d88a4425213b1f737a33770f03aa9561fa77a2d",
    "src/config/nav.ts": "d6fa86a5cc9328c4c6788ebc296d41be5d1d25cf70c4f3b50e1df3f273afe447",
    "src/styles/partials/_action-island.scss": "14bcbb8bc42b2eb708d209e9aac47b870d1a1cb5d551f0f72e103d21ff5f8c43",
    "src/styles/partials/_content.scss": "361e793ecb93cd1b4fe1fca9d601a31fe6a3fce8fc20f9413fa3633bfc280787",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "1bf4f5e5fc4f6a488fdb18ec085aa538f97ac9cc63ce226e5041d1030d0d0212",
    "src/styles/partials/_reader.scss": "346ddfd9d1e62eb4c515b6aeab49f29d420600518b52c6deb5a02d6f54cd3a63",
    "src/styles/signature.scss": "4dc0b36890c3b293cc93bd19e5164201ff14af308437455984c7c9acd8aaf866",
    "src/config/routes.ts": "e455d71e9506506490f79a3aaad3dbea3b13fa08bb60a8779139b07a75446b98"
  }
});
// Exact hosted-qualified local navigation profile; all historical inventories and profiles remain immutable.
const approvedLocalNavigationContrast = Object.freeze({
  "sourceCommit": "6fbc2b6f23e4fcc38542ea887262c47aabe20775",
  "sourceTree": "7050fbac4127a3f27db61042399c6e13631dd148",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41255911586",
  "acceptanceReceiptSha256": "e758cfc09b2201031d5bcf156ebfb5ddba3c0791923ff346535224430ede1709",
  "files": {
    "src/components/frame/ActionRuntime.astro": "265a9e9175baf67ea33569beb0e65ae24c92f6231f0fbb3ee31c97658ec675dc",
    "src/components/frame/AppFrameBase.astro": "d6e53074fd67201ea8f7c8de368d12cc067c62dabbc72e42c24642548cfa40d8",
    "src/components/frame/ArticleOutlinePeek.astro": "766ed55148672b9603290e0dbf2efeae8e35843848355fbf48c07395d84317f2",
    "src/components/frame/LeftRail.astro": "2d9d068f4b58e3f33a08f0ee08adb44a89ce3bf7985b5aaf78dd4805bd3087fe",
    "src/components/frame/RightInfoRail.astro": "8b13376ca332d19632b409ad935420e5d36f333f210e04bb48134bb4e704c636",
    "src/components/frame/StandaloneAppFrame.astro": "07b05dc40af425c7b0cf412368658124069bb26bf840158aec23ffaaf1b65b7f",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/MarkdownContent.astro": "5244b38e779359bf55db1d9cdaac4d7661d3783275e0bb4f02c9afddf8df9b85",
    "src/components/gaga/PageFrame.astro": "45ada41317d9e863b96c00f37d88a4425213b1f737a33770f03aa9561fa77a2d",
    "src/config/nav.ts": "d6fa86a5cc9328c4c6788ebc296d41be5d1d25cf70c4f3b50e1df3f273afe447",
    "src/styles/partials/_action-island.scss": "14bcbb8bc42b2eb708d209e9aac47b870d1a1cb5d551f0f72e103d21ff5f8c43",
    "src/styles/partials/_content.scss": "361e793ecb93cd1b4fe1fca9d601a31fe6a3fce8fc20f9413fa3633bfc280787",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "92090438f1f4088f6b94c4618c10866db9193dc7be3b010aea5289faaec2c69f",
    "src/styles/partials/_reader.scss": "346ddfd9d1e62eb4c515b6aeab49f29d420600518b52c6deb5a02d6f54cd3a63",
    "src/styles/signature.scss": "4dc0b36890c3b293cc93bd19e5164201ff14af308437455984c7c9acd8aaf866",
    "src/config/routes.ts": "e455d71e9506506490f79a3aaad3dbea3b13fa08bb60a8779139b07a75446b98"
  }
});
// Exact hosted-qualified multi-device profile; historical inventories and profiles remain immutable.
const approvedMultiDevice = Object.freeze({
  "sourceCommit": "223b7e54b7a962945c3c8cacea00db2667cf7811",
  "sourceTree": "87989f72c5e000f7e73cf1f3a503c9d640a1f463",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41302684917",
  "acceptanceReceiptSha256": "5c8ddc1a28b123600c14364ffe22abb82ba6a0bfb57fe15e0cf0d120a007d863",
  "files": {
    "src/components/frame/ActionRuntime.astro": "7b2d50a03a01f641a19140fe58d106cfa25604321d1086e5c7b6b8762ffb8eb5",
    "src/components/frame/AppFrameBase.astro": "86bfdaafbdc6eea03f1d19d1604d6fb770b58b9b0a75e7f209978dddc2c06bfd",
    "src/components/frame/ArticleOutlinePeek.astro": "766ed55148672b9603290e0dbf2efeae8e35843848355fbf48c07395d84317f2",
    "src/components/frame/LeftRail.astro": "50ef509899f0174f3d55a1f55b1f1443914600d9ddc2c3606808939dfd51c44f",
    "src/components/frame/RightInfoRail.astro": "3bc9119427c460be205b48623cbdbe8cc132d1ced4018e846368ffaa2d841c77",
    "src/components/frame/StandaloneAppFrame.astro": "ec1afa7ab350fe1f35e9cd372e03f3b91591e4061e859092ddaabb0f4a7ffcfe",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/MarkdownContent.astro": "5244b38e779359bf55db1d9cdaac4d7661d3783275e0bb4f02c9afddf8df9b85",
    "src/components/gaga/PageFrame.astro": "a4b4dbc7edb7b66ad21ee3bffac117a662769955164d32cca48c976775a3bfe0",
    "src/config/nav.ts": "d6fa86a5cc9328c4c6788ebc296d41be5d1d25cf70c4f3b50e1df3f273afe447",
    "src/styles/partials/_action-island.scss": "c62960dbfca44b661dbc946461924123525ed7678dfc434048949d51f39a4e6e",
    "src/styles/partials/_content.scss": "d1d1064489270ad7912cbd227c41002dd49d504446a9a0dc2637908fbe913fec",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "9b19f65cc46017ca1748b06c0b3be44b8daa5d1d857fa06731d96dbf55582794",
    "src/styles/partials/_reader.scss": "346ddfd9d1e62eb4c515b6aeab49f29d420600518b52c6deb5a02d6f54cd3a63",
    "src/styles/signature.scss": "4dc0b36890c3b293cc93bd19e5164201ff14af308437455984c7c9acd8aaf866",
    "src/config/routes.ts": "e455d71e9506506490f79a3aaad3dbea3b13fa08bb60a8779139b07a75446b98",
    "src/components/frame/component-inputs.ts": "576a0ced0059302f71beba904e348946118b3e6d8bd998daf4365c05be9f3a13",
    "src/components/frame/site-composition.ts": "9e620e2ba0b64e17942d278e4d645e4d4ac7298efc37b0cf3c2799cea8fba1f6",
    "src/styles/partials/_left-rail.scss": "547473be2df7dca4d7aaa902d30fc5f2b34ad6538e91566e1adf1c1f5fd11d1b",
    "src/styles/partials/_right-rail.scss": "8d4ebc6fa3f41edca3462e7b96e7d1dab342c279f66d73ffeac46486515fc8e7"
  }
});
// Exact hosted-qualified hierarchy profile; historical inventories and profiles remain immutable.
const approvedHierarchy = Object.freeze({
  "sourceCommit": "80807206be9f615692ddca4ab86ae174726d0950",
  "sourceTree": "0a27832a03e8247459ea24f9a781ccc82d7ab500",
  "qualification": "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/41346067425",
  "acceptanceReceiptSha256": "6154a215403013a564042acca423637b47b18be729f7c4b7501db95648a8b08d",
  "files": {
    "src/components/frame/ActionRuntime.astro": "87b6538ec9c0d416c596d3175d1dd146f5b9412405fc224bc59294bd2a582530",
    "src/components/frame/AppFrameBase.astro": "0896e464e4ffcd69cf9e6fd6f0c9acb3075857fb063468cf3544836a2e63c958",
    "src/components/frame/ArticleOutlinePeek.astro": "4ce6a34c3bef82d45601f6b2e2dd551acd8134669baa97eea1d71695817c1517",
    "src/components/frame/LeftRail.astro": "50ef509899f0174f3d55a1f55b1f1443914600d9ddc2c3606808939dfd51c44f",
    "src/components/frame/RightInfoRail.astro": "3bc9119427c460be205b48623cbdbe8cc132d1ced4018e846368ffaa2d841c77",
    "src/components/frame/StandaloneAppFrame.astro": "a515691faaa8873226549b58e512e6029cab58e391a98f3d83f99c15f9041c56",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/MarkdownContent.astro": "5244b38e779359bf55db1d9cdaac4d7661d3783275e0bb4f02c9afddf8df9b85",
    "src/components/gaga/PageFrame.astro": "38976e25175502eddc99b35cc405c996ba130b6d149866b2761ec522e020ecb4",
    "src/config/nav.ts": "e1f063c8dff842ee9560538add2efb974386152f03cf1ac2ec843cb9430d2522",
    "src/styles/partials/_action-island.scss": "c62960dbfca44b661dbc946461924123525ed7678dfc434048949d51f39a4e6e",
    "src/styles/partials/_content.scss": "d1d1064489270ad7912cbd227c41002dd49d504446a9a0dc2637908fbe913fec",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_outline-peek.scss": "c28a887be05ba782d964edea42e2618da3d12c8b3df62fa4f35476e9a3e27e1e",
    "src/styles/partials/_reader.scss": "47b1a088344aa97a4b0130aa38029f8dacaf0601a7a951bdee6474c093e02214",
    "src/styles/signature.scss": "4dc0b36890c3b293cc93bd19e5164201ff14af308437455984c7c9acd8aaf866",
    "src/config/routes.ts": "e455d71e9506506490f79a3aaad3dbea3b13fa08bb60a8779139b07a75446b98",
    "src/components/frame/component-inputs.ts": "a203a81cd518f0a9970b91056ffaa7414fa2b6b5655e4bf2bc76b43f6da93bb1",
    "src/components/frame/site-composition.ts": "b857894a1d9ad39ccbedfc5c856807c15f9d8e7494a5204bc62dcc96afc01e73",
    "src/styles/partials/_left-rail.scss": "547473be2df7dca4d7aaa902d30fc5f2b34ad6538e91566e1adf1c1f5fd11d1b",
    "src/styles/partials/_right-rail.scss": "a752427360b5faa1fd642433fede6643d284e849f633bf1164d1baacbdfaf355",
    "src/styles/partials/_motion.scss": "9e235c879da2b673f7645e4004e39d01f7021fc2bbaa334eba4248ba169acb03"
  }
});
// Exact runtime-qualified extraction profile; registry and production admission remain separate.
const approvedExtraction=Object.freeze({
  "sourceCommit": "334b879c66cd816d553bdd67e6e91ba3be057c7a",
  "sourceTree": "7c41bab71aa772b427ff2caff0bbc5c886f8735c",
  "qualification": "https://github.com/liquid-modernity/gaga-arsenal/actions/runs/41489610845",
  "acceptanceReceiptSha256": "5dac44c89949f4730d3896341cdd44fd128701f8904ed5878bd5cbd4dcf0acda",
  "files": {
    "src/components/frame/ActionRuntime.astro": "fcd4ae1efeb1d10eaf5dde6be3b317b1a5561023881b27aaacf4a60db6482c7b",
    "src/components/frame/AppFrameBase.astro": "752a85eeec048c97f534a1ab19e28eda3c93fcc0913b39befd909bff121a4e76",
    "src/components/frame/ArticleOutlinePeek.astro": "9def03d45b799bee0cf71135f39ba73debba093fd4ebc1c113da5d426c507a6d",
    "src/components/frame/GagaDock.astro": "3ae6ddbc7cdb8553509ec9a87e83033b61a082c9cd20e6cbcc0d4998bd69bd51",
    "src/components/frame/GlobalNavigationRail.astro": "ea48ff8c6ccdf6f425172cefec93c7925f3d581957fbc5cda1db257f07d3bbd0",
    "src/components/frame/LeftRail.astro": "50ef509899f0174f3d55a1f55b1f1443914600d9ddc2c3606808939dfd51c44f",
    "src/components/frame/MainCanvas.astro": "d2ee933444c8d4ed15572943610cd5db2d340c9c52d525438865a878419ea630",
    "src/components/frame/RightInfoRail.astro": "3bc9119427c460be205b48623cbdbe8cc132d1ced4018e846368ffaa2d841c77",
    "src/components/frame/RightRailMeta.astro": "9ac4806356517bd891ba725aaed8752ab00e0430072a2d6813363295ed0a48ae",
    "src/components/frame/StandaloneAppFrame.astro": "a515691faaa8873226549b58e512e6029cab58e391a98f3d83f99c15f9041c56",
    "src/components/frame/component-inputs.ts": "a203a81cd518f0a9970b91056ffaa7414fa2b6b5655e4bf2bc76b43f6da93bb1",
    "src/components/frame/site-composition.ts": "b857894a1d9ad39ccbedfc5c856807c15f9d8e7494a5204bc62dcc96afc01e73",
    "src/components/gaga/ArticleShell.astro": "5ba40e4820a75779485622ef256f854cdaa639f3ac7d00c5b734895ffb705317",
    "src/components/gaga/ContentPanel.astro": "cc221e99db643eeb0703bbb98919f74ea54515cdf9113dfd532eddb5a225568a",
    "src/components/gaga/GagaSiteLayout.astro": "ab878fb1b320f8d0b996bfc439e1914cb519a1ea3c27af3f2967aa4433ae66ab",
    "src/components/gaga/Head.astro": "fc2664bf2cc0f8336d35b2d6dc918a6b79bd8bdb2753b4ec8f7bad2fd149e8e6",
    "src/components/gaga/MarkdownContent.astro": "5244b38e779359bf55db1d9cdaac4d7661d3783275e0bb4f02c9afddf8df9b85",
    "src/components/gaga/PageFrame.astro": "38976e25175502eddc99b35cc405c996ba130b6d149866b2761ec522e020ecb4",
    "src/components/gaga/PageTitle.astro": "8db1a53cf87b5fd7109b44457f7581a25357bbbbc224a777dcf017767340eff3",
    "src/components/gaga/media/GagaImage.astro": "0f5284568d088ee55ddaade6c060bce037d2afe6711b3ffb10423b06b73d8ca2",
    "src/config/design.ts": "df9ae23f2a09cd3c47e3bd0dcfa6a8b6452d05cdceafad75e98c5977790e252e",
    "src/config/nav.ts": "e1f063c8dff842ee9560538add2efb974386152f03cf1ac2ec843cb9430d2522",
    "src/config/reader.ts": "4329f5f484416e983412eaf03a754d8457ea6c66fe672c2717102e9ebf81ad44",
    "src/config/routes.ts": "e1f9af11b46d5840cdb957c355c3aba5ddddc5e943c11c4cc38b135fb00ff23e",
    "src/config/theme.ts": "3c576402c8e72d53ea3617177701b727468fc841dd9800019b66e28106c24de6",
    "src/styles/components/rail-behaviour.scss": "f921eaebd6256b8aa69cd350378d7fa0f827a7738f48c007c8b3f0e1b897f951",
    "src/styles/components/rail-runtime.scss": "3d546435d70af7b77bd5c4c14b7c2b81c2f31238bd2c0ceace378101634a792e",
    "src/styles/gaga-tokens.css": "ace74246b1021ebf889f457f9aaee2e0d6b82c56244a92552e8319ddd2378c2f",
    "src/styles/partials/_a11y.scss": "78fc8b98d4270e9e63a148818fccaeca3c7420d4df75fc60ae2149cb6aaf0357",
    "src/styles/partials/_action-island.scss": "c62960dbfca44b661dbc946461924123525ed7678dfc434048949d51f39a4e6e",
    "src/styles/partials/_breakpoints.generated.scss": "871d90056d38a154637b26fe2f9f76cc6340a0b551881b0dccaefe24ea567147",
    "src/styles/partials/_breakpoints.scss": "14cc4bf8c73a114d8f459b6a6453673fc49fd27e4fce225865ee0b3f5950ce18",
    "src/styles/partials/_content.scss": "d1d1064489270ad7912cbd227c41002dd49d504446a9a0dc2637908fbe913fec",
    "src/styles/partials/_coverage.scss": "5d0e9217853ac08bf3cf0872d76fceb557758727a3bfc5b81c124c071c2d1a8f",
    "src/styles/partials/_design-languages.scss": "e5f15ac20d2b0eda34be046be7af1a85cabd19d44d97a256bbf845fc86e1e76a",
    "src/styles/partials/_editorial-front.scss": "c08d1e8082cf2bcc1ce72330aefdd420606b124a4a3eddee92874962b887c3b7",
    "src/styles/partials/_frame.scss": "16c72655342178657aae90b3d2902a07df163a847f5e37582d8d591bb346e39c",
    "src/styles/partials/_gaga-dock.scss": "e8c8c118a3910f149561aa666a8fe29a2f0958d2f158b9fefa62e18f3228501c",
    "src/styles/partials/_global-nav.scss": "97fc4e00da3b6e9ce07e4efd4485cb2cdc266a1f3d554ef2e65cfcd8227a86f8",
    "src/styles/partials/_knowledge-graph.scss": "3a09495d759fd9ac2d3ace0ca7babd4234ffc6f0a4a9c8c675210ee8b5c2f8f4",
    "src/styles/partials/_landing.scss": "b1fc962a96ffba12d7b47341145aa167cc4c1753ee748745b5a4cf48785858c6",
    "src/styles/partials/_left-rail.scss": "547473be2df7dca4d7aaa902d30fc5f2b34ad6538e91566e1adf1c1f5fd11d1b",
    "src/styles/partials/_motion.scss": "9e235c879da2b673f7645e4004e39d01f7021fc2bbaa334eba4248ba169acb03",
    "src/styles/partials/_outline-peek.scss": "c28a887be05ba782d964edea42e2618da3d12c8b3df62fa4f35476e9a3e27e1e",
    "src/styles/partials/_people.scss": "084021d4cd47f51637185c78b3dc79c390d7b80a79c88920699499a272755e75",
    "src/styles/partials/_rail-polish.scss": "b4fb9b756b910c9bb3050c9addb53e156757048ac47169c1855b7fcb28cf11c0",
    "src/styles/partials/_reader.scss": "47b1a088344aa97a4b0130aa38029f8dacaf0601a7a951bdee6474c093e02214",
    "src/styles/partials/_right-rail.scss": "a752427360b5faa1fd642433fede6643d284e849f633bf1164d1baacbdfaf355",
    "src/styles/partials/_section-front.scss": "220e0573e085f4d5c213fc7981df04ffae140582f14a8a58c857630a0429f024",
    "src/styles/partials/_visual-polish.scss": "6188a9f85afde0f35d1966affa0e81adf3cbad55810ff8e178d1935a7cff1559",
    "src/styles/signature.scss": "4dc0b36890c3b293cc93bd19e5164201ff14af308437455984c7c9acd8aaf866",
    "src/styles/tokens.css": "83707608d34729fc2deae6e932ce55161e48a8d1f38efe2fb763953506238f8b",
    "src/styles/tokens/_gaga-motion.scss": "ba66f73483a4b618e9a3ca41eaca8f3af145dd3823e099578d8297e7b3275e45",
    "src/styles/tokens/_gaga-surfaces.scss": "ad71fe1e8e645cc4ac65be820e15d0834da3973cf391f3a6e13524f11e153e28"
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
for (const [path, digest] of Object.entries(approvedMotionTouch.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path,digest] of Object.entries(approvedFamily.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path,digest] of Object.entries(approvedSuperShare.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path,digest] of Object.entries(approvedPresence.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path,digest] of Object.entries(approvedLocalNavigation.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path,digest] of Object.entries(approvedLocalNavigationContrast.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path,digest] of Object.entries(approvedMultiDevice.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path,digest] of Object.entries(approvedHierarchy.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
for (const [path,digest] of Object.entries(approvedExtraction.files)) assert.ok(historicalHashes.has(path) && /^[a-f0-9]{64}$/.test(digest));
const actual = new Map(inventory.files.map(f => [f.path, createHash("sha256").update(
  readFileSync(f.path, "utf8").replaceAll("@gaga/engine-web", "@gaga/engine-runtime")
    .replaceAll("@gaga/engine/", "@gaga/engine-capabilities/"),
).digest("hex")]));
const extractionProfile=Object.entries(approvedExtraction.files).every(([path,digest])=>actual.get(path)===digest);
const hierarchyProfile = Object.entries(approvedHierarchy.files).every(([path,digest]) => actual.get(path) === digest);
const multiDeviceProfile = Object.entries(approvedMultiDevice.files).every(([path,digest]) => actual.get(path) === digest);
const localNavigationContrastProfile = Object.entries(approvedLocalNavigationContrast.files).every(([path,digest]) => actual.get(path) === digest);
const localNavigationProfile = Object.entries(approvedLocalNavigation.files).every(([path,digest]) => actual.get(path) === digest);
const presenceProfile = Object.entries(approvedPresence.files).every(([path,digest]) => actual.get(path) === digest);
const superShareProfile = Object.entries(approvedSuperShare.files).every(([path,digest]) => actual.get(path) === digest);
const familyProfile = Object.entries(approvedFamily.files).every(([path,digest]) => actual.get(path) === digest);
const motionTouchProfile = Object.entries(approvedMotionTouch.files).every(([path, digest]) => actual.get(path) === digest);
const motionProfile = Object.entries(approvedMotion.files).every(([path, digest]) => actual.get(path) === digest);
const personalProfile = Object.entries(approvedPersonal.files).every(([path, digest]) => actual.get(path) === digest);
const documentationProfile = Object.entries(approvedDocumentation.files).every(([path, digest]) => actual.get(path) === digest);
const polishProfile = Object.entries(approvedPolish.files).every(([path, digest]) => actual.get(path) === digest);
const historicalProfile = Object.keys(approvedUx.files).every(path => actual.get(path) === historicalHashes.get(path));
for (const f of inventory.files) {
  const expected = extractionProfile ? approvedExtraction.files[f.path] : hierarchyProfile ? approvedHierarchy.files[f.path] ?? historicalHashes.get(f.path) : multiDeviceProfile ? approvedMultiDevice.files[f.path] ?? historicalHashes.get(f.path) : localNavigationContrastProfile ? approvedLocalNavigationContrast.files[f.path] ?? historicalHashes.get(f.path) : localNavigationProfile ? approvedLocalNavigation.files[f.path] ?? historicalHashes.get(f.path) : presenceProfile ? approvedPresence.files[f.path] ?? historicalHashes.get(f.path) : superShareProfile ? approvedSuperShare.files[f.path] ?? historicalHashes.get(f.path) : familyProfile ? approvedFamily.files[f.path] ?? historicalHashes.get(f.path) : motionTouchProfile ? approvedMotionTouch.files[f.path] ?? historicalHashes.get(f.path) : motionProfile ? approvedMotion.files[f.path] ?? historicalHashes.get(f.path) : personalProfile ? approvedPersonal.files[f.path] ?? historicalHashes.get(f.path) : documentationProfile ? approvedDocumentation.files[f.path] ?? historicalHashes.get(f.path) : polishProfile ? approvedPolish.files[f.path] ?? historicalHashes.get(f.path) : historicalProfile ? historicalHashes.get(f.path) : approvedUx.files[f.path] ?? historicalHashes.get(f.path);
  assert.equal(actual.get(f.path), expected, "Unintended application UI/style/routing change: " + f.path);
}
console.log(
  "Preserved application UI/style/routing:",
  inventory.files.length,
  "entries; one exact qualified main-landmark correction from",
  approvedMain.sourceCommit,
  approvedMain.qualification,
  extractionProfile ? "whole qualified extraction profile " + approvedExtraction.sourceCommit + " " + approvedExtraction.qualification : hierarchyProfile ? "whole qualified hierarchy profile " + approvedHierarchy.sourceCommit + " " + approvedHierarchy.qualification : multiDeviceProfile ? "whole qualified multi-device profile " + approvedMultiDevice.sourceCommit + " " + approvedMultiDevice.qualification : localNavigationContrastProfile ? "whole qualified local navigation contrast profile " + approvedLocalNavigationContrast.sourceCommit + " " + approvedLocalNavigationContrast.qualification : localNavigationProfile ? "whole qualified local navigation profile " + approvedLocalNavigation.sourceCommit + " " + approvedLocalNavigation.qualification : presenceProfile ? "whole qualified Personal Presence profile " + approvedPresence.sourceCommit + " " + approvedPresence.qualification : superShareProfile ? "whole qualified Super Share profile " + approvedSuperShare.sourceCommit + " " + approvedSuperShare.qualification : familyProfile ? "whole qualified contextual family profile " + approvedFamily.sourceCommit + " " + approvedFamily.qualification : motionTouchProfile ? "whole qualified motion-touch profile " + approvedMotionTouch.sourceCommit + " " + approvedMotionTouch.qualification : motionProfile ? "whole qualified motion profile " + approvedMotion.sourceCommit + " " + approvedMotion.qualification : personalProfile ? "whole qualified personal profile " + approvedPersonal.sourceCommit + " " + approvedPersonal.qualification : documentationProfile ? "whole qualified documentation profile " + approvedDocumentation.sourceCommit + " " + approvedDocumentation.qualification : polishProfile ? "whole qualified polish profile " + approvedPolish.sourceCommit + " " + approvedPolish.qualification : historicalProfile ? "historical profile" : "whole accepted UX profile " + approvedUx.sourceCommit + " " + approvedUx.qualification,
);
