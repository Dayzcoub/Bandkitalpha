import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'package.json',
  'src/main.ts',
  'src/app/App.ts',
  'public/index.html',
  'scripts/serve-dist.mjs',
  'START_BANDKIT_PREVIEW.bat',
  'START_BANDKIT_DEV.bat',
  'CHECK_BANDKIT.bat',
  'BUILD_BANDKIT.bat',
  'RESET_CACHE_AND_START.bat',
  'docs/local/LOCAL_PREVIEW_WINDOWS.md',
];

let failed = false;
for (const item of required) {
  const exists = fs.existsSync(path.join(root, item));
  console.log(`${exists ? '[OK]' : '[MISSING]'} ${item}`);
  if (!exists) failed = true;
}

if (failed) process.exit(1);
console.log('[OK] BandKit local dev kit files are present.');
