import assert from 'node:assert/strict';
export const qualificationGuard=`      - name: Multi-device projection and interaction qualification
        run: |
          trap 'if [ -d .gaga/device-traces ]; then cp -R .gaga/device-traces "$GAGA_EVIDENCE_DIRECTORY/"; fi' EXIT
          npx --no-install playwright install --with-deps webkit
          node --test tools/device/*.test.mjs
          npx --no-install playwright test --config tools/device/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/device-browser.log"
          node tools/device/browser-report.mjs
`;
export const productionGuard=`      - name: Multi-device projection and interaction production smoke
        env:
          GAGA_PRODUCTION_BROWSER_URL: https://consumer-blog-signature.ratriatra.workers.dev
        run: |
          trap 'if [ -d .gaga/device-traces ]; then cp -R .gaga/device-traces "$GAGA_EVIDENCE_DIRECTORY/"; fi' EXIT
          npx --no-install playwright install --with-deps webkit
          npx --no-install playwright test --config tools/device/playwright.config.mjs | tee "$GAGA_EVIDENCE_DIRECTORY/device-browser.log"
          node tools/device/browser-report.mjs
`;
export function stripDeviceGuards(source){for(const guard of [qualificationGuard,productionGuard])assert.equal(source.split(guard).length,2,'Exactly one mandatory multi-device guard');return source.replace(qualificationGuard,'').replace(productionGuard,'');}
