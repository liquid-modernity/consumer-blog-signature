import assert from 'node:assert/strict';
export const qualificationGuard=`      - name: Personal Presence qualification
        run: |
          trap 'if [ -d .gaga/presence-traces ]; then cp -R .gaga/presence-traces "$GAGA_EVIDENCE_DIRECTORY/"; fi' EXIT
          node --test tools/presence/*.test.mjs
          node tools/presence/fixture-build.mjs
          npx --no-install playwright test --config tools/presence/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/presence-browser.log"
          node tools/presence/browser-report.mjs
`;
export const productionGuard=`      - name: Personal Presence production smoke
        env:
          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev
        run: |
          trap 'if [ -d .gaga/presence-traces ]; then cp -R .gaga/presence-traces "$GAGA_EVIDENCE_DIRECTORY/"; fi' EXIT
          npx --no-install playwright test --config tools/presence/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/presence-browser.log"
          node tools/presence/browser-report.mjs
`;
export function stripPresenceGuards(source){for(const guard of [qualificationGuard,productionGuard])assert.equal(source.split(guard).length,2,'Exactly one mandatory Personal Presence guard');return source.replace(qualificationGuard,'').replace(productionGuard,'');}
