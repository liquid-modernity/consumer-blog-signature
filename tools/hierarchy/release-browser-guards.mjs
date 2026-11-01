import assert from 'node:assert/strict';
export const qualificationGuard=`      - name: Surface hierarchy and continuity qualification
        run: |
          trap 'if [ -d .gaga/hierarchy-traces ]; then cp -R .gaga/hierarchy-traces "$GAGA_EVIDENCE_DIRECTORY/"; fi' EXIT
          node --test tools/hierarchy/*.test.mjs
          npx --no-install playwright test --config tools/hierarchy/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/hierarchy-browser.log"
          node tools/hierarchy/browser-report.mjs
`;
export const productionGuard=`      - name: Surface hierarchy and continuity production smoke
        env:
          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev
        run: |
          trap 'if [ -d .gaga/hierarchy-traces ]; then cp -R .gaga/hierarchy-traces "$GAGA_EVIDENCE_DIRECTORY/"; fi' EXIT
          npx --no-install playwright test --config tools/hierarchy/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/hierarchy-browser.log"
          node tools/hierarchy/browser-report.mjs
`;
export function stripHierarchyGuards(source){for(const guard of [qualificationGuard,productionGuard])assert.equal(source.split(guard).length,2,'Exactly one mandatory hierarchy guard');return source.replace(qualificationGuard,'').replace(productionGuard,'');}
