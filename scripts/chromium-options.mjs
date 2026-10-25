import {existsSync} from 'node:fs';
// Same default as browser QA; allow a real desktop browser/window for independent
// hardware profiling. The recorded cloud measurements use the default headless.
export const chromiumOptions={
  executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),
  headless:process.env.LANTERN_HEADLESS!=='0',
  args:['--no-sandbox']
};
