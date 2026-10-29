import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({ ...base, testDir:'./tools/contextual/baseline', timeout:60000, projects:[{name:'desktop',use:{browserName:'chromium',viewport:{width:1440,height:1000}}}], webServer:undefined, outputDir:'.gaga/contextual-ux/baseline-details', reporter:[['list'],['json',{outputFile:'.gaga/contextual-ux/baseline-results.json'}]] });
