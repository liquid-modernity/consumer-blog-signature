import assert from 'node:assert/strict';
export const qualificationGuard=`      - name: Super Share qualification
        run: |
          node --test tools/share/*.test.mjs
          npx --no-install playwright test --config tools/share/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/share-browser.log"
          node tools/share/browser-report.mjs
`;
export const productionGuard=`      - name: Super Share production smoke
        env:
          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev
        run: |
          npx --no-install playwright test --config tools/share/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/share-browser.log"
          node tools/share/browser-report.mjs
`;
export function stripSuperShareGuards(source){
 for(const guard of [qualificationGuard,productionGuard])assert.equal(source.split(guard).length,2,'Exactly one mandatory Super Share guard');
 return source.replace(qualificationGuard,'').replace(productionGuard,'');
}
