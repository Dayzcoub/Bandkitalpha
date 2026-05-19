import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 5199);
const appName = 'BandKit MVP Shell';
const appVersion = '1.10.0-mobile-reference-ui';

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, '');
  const candidate = path.join(dist, normalized);
  return candidate.startsWith(dist) ? candidate : path.join(dist, 'index.html');
}

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('[BandKit] dist/index.html not found. Run: npm run build');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const requestPath = req.url ?? '/';

  if (requestPath.startsWith('/__bandkit_health')) {
    const body = JSON.stringify({ ok: true, app: appName, version: appVersion, dist, port }, null, 2);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'X-BandKit-App': appVersion,
    });
    res.end(body);
    return;
  }

  let filePath = safePath(requestPath);
  if (requestPath === '/' || !path.extname(filePath)) filePath = path.join(dist, 'index.html');
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(dist, 'index.html');

  const body = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': mime.get(path.extname(filePath)) ?? 'application/octet-stream',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-BandKit-App': appVersion,
  });
  res.end(body);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[BandKit] Port ${port} is busy. Close old local servers or run RESET_CACHE_AND_START.bat.`);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log('');
  console.log(`${appName} ${appVersion}`);
  console.log(`Local preview: http://${host}:${port}`);
  console.log(`Health check:  http://${host}:${port}/__bandkit_health`);
  console.log('Press Ctrl+C to stop.');
  console.log('');
});
