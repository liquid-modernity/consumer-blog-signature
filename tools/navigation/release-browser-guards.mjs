import assert from 'node:assert/strict';
export const qualificationGuard=`      - name: Local navigation and Outline convergence qualification
        run: |
          trap 'if [ -d .gaga/navigation-traces ]; then cp -R .gaga/navigation-traces "$GAGA_EVIDENCE_DIRECTORY/"; fi' EXIT
          node --test tools/navigation/*.test.mjs
          npx --no-install playwright test --config tools/navigation/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/navigation-browser.log"
          node tools/navigation/browser-report.mjs
`;
export const productionGuard=`      - name: Local navigation and Outline convergence production smoke
        env:
          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev
        run: |
          trap 'if [ -d .gaga/navigation-traces ]; then cp -R .gaga/navigation-traces "$GAGA_EVIDENCE_DIRECTORY/"; fi' EXIT
          npx --no-install playwright test --config tools/navigation/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/navigation-browser.log"
          node tools/navigation/browser-report.mjs
`;
export function stripNavigationGuards(source) {
 for(const guard of [qualificationGuard,productionGuard])assert.equal(source.split(guard).length,2,'Exactly one mandatory local-navigation guard');
 return source.replace(qualificationGuard,'').replace(productionGuard,'');
}
