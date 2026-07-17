// Проверяет объявленный в таблице `access` двумя способами, и ни один из них не
// достаточен сам по себе.
//
// ЧТО ПРОВЕРЯЕТ ДИНАМИЧЕСКАЯ ЧАСТЬ. Поднять сервер, постучаться в каждый маршрут БЕЗ
// сессии, сверить с объявлением: `authed`/`staff` → 401 AUTH_REQUIRED; `public` → что
// угодно, кроме 401.
//
// ЧЕГО ОНА НЕ МОЖЕТ, и это стоило регрессии на проде стейджинга 2026-07-16.
// Для `authed` она замкнута сама на себя: 401 отдаёт САМ ДИСПЕТЧЕР, до хендлера. Тест видит 401, сверяет
// с объявлением `authed` и говорит «совпало» — хотя доказал он лишь то, что роутер
// делает то, что ему велели. Объявить `authed` маршрут, который обязан быть `public`, —
// ошибка, которую эта часть подтвердит как корректность.
//
// Так и вышло: `GET /entities` объявили `authed`, тест был зелёный, а хендлер с 1.15.3
// сознательно обслуживает гостя со скоупингом («каталог отвечает гостям, но
// members-only сущность гость не видит»). Поймал не тест, а смоук на стейджинге, уже
// после деплоя.
//
// ПОЭТОМУ СТАТИЧЕСКАЯ ЧАСТЬ. Для каждого `authed`-маршрута: если его хендлер сам зовёт
// `resolveSessionUser` и при этом нигде не отвечает `AUTH_REQUIRED` — он анонима терпит,
// а значит либо маршрут должен быть `public`, либо в хендлере не хватает проверки. Оба
// случая надо увидеть глазами.
//
// Её предел назван честно: хендлер, который гейтит через хелпер (`requireRoomAccess`,
// `requireTarget`), сюда не попадает — `resolveSessionUser` в его теле нет. Проверка
// ловит конкретный класс, а не доказывает корректность всех объявлений.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { buildRoutes } from '../src/routes.js';
import { createRouter } from '../src/router.js';
import { notFound, sendError } from '../src/shared/http.js';

const PREFIX = '/api/v1';
const env = { apiPrefix: PREFIX, nodeEnv: 'test', port: 0, filesDir: '/tmp', trustedProxyIps: ['127.0.0.1'] };
const routes = buildRoutes(env);
const dispatch = createRouter(routes, PREFIX);

const server = http.createServer((req, res) => {
  Promise.resolve()
    .then(async () => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      if (await dispatch(req, res, url)) return;
      notFound(res);
    })
    .catch(() => sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error'));
});

// Подставляет в `:param` что-нибудь синтаксически годное. Значение не важно: до хендлера,
// который стал бы его разбирать, аноним доходить не должен.
function concretePath(path) {
  return path.replace(/:(\w+)\(([^)]+)\)/g, (_, __, options) => options.split('|')[0])
    .replace(/:(\w+)/g, '00000000-0000-4000-8000-000000000000');
}

function request(port, method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

const failures = [];

// --- статическая часть: терпит ли хендлер `authed`-маршрута анонима? ---

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function handlerBodies() {
  const bodies = new Map();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.routes.js')) {
        const source = fs.readFileSync(full, 'utf8');
        const parts = source.split(/\nexport (?:async )?function (handle\w+)\s*\(/);
        for (let i = 1; i < parts.length; i += 2) {
          // Тело — до следующего `export function`, чтобы чужие проверки не засчитались.
          bodies.set(parts[i], parts[i + 1].split(/\nexport (?:async )?function /)[0]);
        }
      }
    }
  };
  walk(path.join(ROOT, 'src', 'modules'));
  return bodies;
}

const bodies = handlerBodies();
for (const line of fs.readFileSync(path.join(ROOT, 'src', 'routes.js'), 'utf8').split('\n')) {
  if (!line.includes("access: 'authed'")) continue;
  const routePath = line.match(/path: '([^']+)'/)?.[1];
  // `handle[A-Z]`, а не `handle\w+`: последнее первым делом матчит слово `handler:` из
  // самой строки таблицы, и проверка молча не находит ничего. Поймано негативным
  // контролем — зелёный ответ тут не значил ничего.
  const handlerName = line.match(/\b(handle[A-Z]\w*)/)?.[1];
  const body = handlerName && bodies.get(handlerName);
  if (!body) continue; // гейтит через хелпер — этой проверке не видно, и так и задумано
  if (body.includes('resolveSessionUser') && !body.includes('AUTH_REQUIRED')) {
    failures.push(
      `${routePath} объявлен authed, но ${handlerName}() резолвит сессию и НЕ отвечает ` +
      'AUTH_REQUIRED — он обслуживает гостя. Либо маршрут public, либо в хендлере нет проверки.'
    );
  }
}

// --- динамическая часть ---

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

for (const route of routes) {
  const path = `${PREFIX}${concretePath(route.path)}`;
  const { status, body } = await request(port, route.method, path);
  const gated = status === 401 && body.includes('AUTH_REQUIRED');

  if (route.access === 'public' && gated) {
    failures.push(`${route.method} ${route.path} объявлен public, но диспетчер требует сессию`);
  }
  if (route.access !== 'public' && !gated) {
    failures.push(
      `${route.method} ${route.path} объявлен ${route.access}, но аноним получил ${status} вместо 401 AUTH_REQUIRED`
    );
  }
}

server.close();

if (failures.length) {
  console.error('Объявленный доступ расходится с фактическим:\n');
  console.error(failures.map((line) => `  ${line}`).join('\n'));
  process.exit(1);
}
console.log(`check-route-contracts: ok — ${routes.length} маршрутов, объявленный доступ совпадает с фактическим`);
