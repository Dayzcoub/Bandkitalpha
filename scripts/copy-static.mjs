import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const publicDir = path.join(root, 'public');
fs.mkdirSync(dist, { recursive: true });
for (const entry of fs.readdirSync(publicDir)) {
  const src = path.join(publicDir, entry);
  const dst = path.join(dist, entry);
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true });
}
const srcStyles = path.join(root, 'src', 'styles');
const distStyles = path.join(dist, 'styles');
if (fs.existsSync(srcStyles)) {
  fs.mkdirSync(distStyles, { recursive: true });
  for (const name of ['tokens.css', 'global.css']) {
    const srcStyle = path.join(srcStyles, name);
    if (fs.existsSync(srcStyle)) {
      fs.copyFileSync(srcStyle, path.join(distStyles, name));
      fs.copyFileSync(srcStyle, path.join(publicDir, 'styles', name));
    }
  }
}
console.log('copied public assets and synchronized runtime styles to dist');
