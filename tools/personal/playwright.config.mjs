import { devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { browserTarget } from '../gaga/browser-contract.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const { production, baseURL }=browserTarget(process.env.GAGA_PRODUCTION_BROWSER_URL);
export default {
 testDir:'./browser',timeout:45000,retries:0,workers:1,
 use:{baseURL,trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'touch',use:{...devices['iPhone 13'],browserName:'chromium',viewport:{width:390,height:844},deviceScaleFactor:1}}],
 webServer:production?undefined:{cwd:root,command:'node tools/gaga/preview.mjs',url:baseURL,reuseExistingServer:false,timeout:30000},
 reporter:[['list'],['json',{outputFile:root+'/.gaga/personal-results.json'}]],
 outputDir:root+'/.gaga/personal-traces'
};
