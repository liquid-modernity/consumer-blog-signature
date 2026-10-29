import { devices } from '@playwright/test';
const production = process.env.GAGA_PRODUCTION_BROWSER_URL;
if (production && production !== 'https://consumer-blog-signature.ratriatra.workers.dev') throw Error('Unexpected production origin');
export default {
 testDir: './browser', timeout: 90000, retries:0, workers:1,
 projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'touch',use:{...devices['iPhone 13'],browserName:'chromium',viewport:{width:390,height:844},deviceScaleFactor:1}}],
 use:{baseURL:production || 'http://127.0.0.1:4173',trace:'retain-on-failure'},
 webServer:production ? undefined : {command:'node tools/gaga/preview.mjs',url:'http://127.0.0.1:4173',timeout:30000,reuseExistingServer:false},
 reporter:[['list'],['json',{outputFile:'.gaga/polish-v2/browser-results.json'}]], outputDir:'.gaga/polish-v2/traces'
};
