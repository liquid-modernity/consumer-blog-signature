import assert from 'node:assert/strict';
export const qualificationGuard=`      - name: Contextual surface family qualification
        run: |
          node --test tools/family/*.test.mjs
          npx --no-install playwright test --config tools/family/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/family-browser.log"
          node tools/family/browser-report.mjs
`;
export const productionGuard=`      - name: Contextual surface family production smoke
        env:
          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev
        run: |
          npx --no-install playwright test --config tools/family/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/family-browser.log"
          node tools/family/browser-report.mjs
`;
export function stripQualifiedFamilyGuards(source){
 for(const guard of [qualificationGuard,productionGuard])assert.equal(source.split(guard).length,2,'Exactly one mandatory family guard');
 return source.replace(qualificationGuard,'').replace(productionGuard,'');
}
