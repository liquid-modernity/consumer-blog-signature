import assert from 'node:assert/strict';
export const qualificationGuard=`      - name: Signature motion and adaptive geometry qualification
        run: |
          node --test tools/signature/*.test.mjs
          npx --no-install playwright test --config tools/signature/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/signature-browser.log"
          node tools/signature/browser-report.mjs
`;
export const productionGuard=`      - name: Signature motion and adaptive geometry production smoke
        env:
          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev
        run: |
          npx --no-install playwright test --config tools/signature/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/signature-browser.log"
          node tools/signature/browser-report.mjs
`;
export function stripQualifiedMotionGuards(source){
 for(const guard of [qualificationGuard,productionGuard])assert.equal(source.split(guard).length,2,'Exactly one mandatory signature guard');
 return source.replace(qualificationGuard,'').replace(productionGuard,'');
}
