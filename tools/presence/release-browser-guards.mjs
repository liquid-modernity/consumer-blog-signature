import assert from 'node:assert/strict';
export const qualificationGuard=`      - name: Personal Presence qualification
        run: |
          node --test tools/presence/*.test.mjs
          node tools/presence/fixture-build.mjs
          npx --no-install playwright test --config tools/presence/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/presence-browser.log"
          node tools/presence/browser-report.mjs
`;
export const productionGuard=`      - name: Personal Presence production smoke
        env:
          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev
        run: |
          npx --no-install playwright test --config tools/presence/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/presence-browser.log"
          node tools/presence/browser-report.mjs
`;
export function stripPresenceGuards(source){for(const guard of [qualificationGuard,productionGuard])assert.equal(source.split(guard).length,2,'Exactly one mandatory Personal Presence guard');return source.replace(qualificationGuard,'').replace(productionGuard,'');}
