import assert from 'node:assert/strict';
export const qualificationGuard='      - name: Personal state and latent interaction qualification\n        run: |\n          node --test tools/personal/*.test.mjs\n          npx --no-install playwright test --config tools/personal/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/personal-browser.log"\n          node tools/personal/browser-report.mjs\n';
export const productionGuard='      - name: Browser-local synthetic personal state production smoke\n        env:\n          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev\n        run: |\n          npx --no-install playwright test --config tools/personal/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/personal-browser.log"\n          node tools/personal/browser-report.mjs\n';
export function stripQualifiedPersonalGuards(source){
 assert.equal(source.split(qualificationGuard).length,2,'Exactly one mandatory Personal State qualification guard');
 assert.equal(source.split(productionGuard).length,2,'Exactly one mandatory Personal State production smoke');
 return source.replace(qualificationGuard,'').replace(productionGuard,'');
}
