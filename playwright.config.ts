import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
export default defineConfig({
  testDir:'./tests/browser',workers:1,fullyParallel:true,timeout:240000,
  reporter:[['list'],['json',{outputFile:'docs/evidence/browser-results.json'}]],
  use:{baseURL:'http://127.0.0.1:4173/the-last-lantern/',
    launchOptions:{executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']},
    trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'npm run preview -- --port 4173 --strictPort --base /the-last-lantern/',url:'http://127.0.0.1:4173/the-last-lantern/',reuseExistingServer:false}
});
