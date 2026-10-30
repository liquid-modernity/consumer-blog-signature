import assert from 'node:assert/strict';
export const qualificationGuard='      - name: Documentation and information browser qualification\n        run: |\n          npx --no-install playwright test --config tools/documentation/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/documentation-browser.log"\n          node tools/documentation/browser-report.mjs\n';
export const productionGuard='      - name: Documentation and information production smoke\n        env:\n          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev\n        run: |\n          npx --no-install playwright test --config tools/documentation/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/documentation-browser.log"\n          node tools/documentation/browser-report.mjs\n';
export function stripQualifiedDocumentationGuards(source) {
 assert.equal(source.split(qualificationGuard).length,2,'Exactly one mandatory documentation qualification guard');
 assert.equal(source.split(productionGuard).length,2,'Exactly one mandatory documentation production guard');
 return source.replace(qualificationGuard,'').replace(productionGuard,'');
}
