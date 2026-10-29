import { resolve } from 'node:path';
const app=process.env.GAGA_APPLICATION_DIR,out=process.env.GAGA_EVIDENCE_DIRECTORY;
if(!app||!out)throw Error('Explicit isolated application and evidence directories required');
export default {
 testDir:resolve(import.meta.dirname,'browser'),timeout:120000,retries:0,workers:1,
 projects:[320,360,390,768,1440].flatMap(width=>['paper','dark'].map(theme=>({name:width+'-'+theme,metadata:{width,theme},use:{browserName:'chromium',viewport:{width,height:width===1440?1000:844},hasTouch:width<1440,isMobile:width<768,deviceScaleFactor:1}}))),
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
 webServer:{command:'node tools/gaga/preview.mjs',cwd:app,url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:30000},
 outputDir:out+'/test-results',reporter:[['list'],['json',{outputFile:out+'/browser-results.json'}]]
};
