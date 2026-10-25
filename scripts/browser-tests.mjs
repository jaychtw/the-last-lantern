import {existsSync,mkdirSync,symlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

// Use trusted system FFmpeg when available. Keep Playwright's browser cache inside
// node_modules so cloud setup never writes the home directory or downloads tools.
if(existsSync('/usr/bin/ffmpeg')&&existsSync('/usr/bin/chromium')){
  const cache=resolve('node_modules/.cache/playwright');
  const ffmpeg=resolve(cache,'ffmpeg-1011');
  mkdirSync(ffmpeg,{recursive:true});
  const target=resolve(ffmpeg,'ffmpeg-linux');
  if(!existsSync(target))symlinkSync('/usr/bin/ffmpeg',target);
  process.env.PLAYWRIGHT_BROWSERS_PATH=cache;
}
const result=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test',...process.argv.slice(2)],{stdio:'inherit',env:process.env});
process.exit(result.status??1);
