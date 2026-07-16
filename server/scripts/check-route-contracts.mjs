// Проверяет, что объявленный в таблице `access` — правда, а не намерение.
//
// Зачем. Объявление, которое никто не сверяет с поведением, — это комментарий с
// подсветкой синтаксиса. Прецедент в проекте уже есть: `check-admin-contracts.js` ловит
// admin-консоль ровно так же, и именно этот гейт единственный ни разу не сломался.
//
// Метод: поднять сервер, постучаться в каждый маршрут БЕЗ сессии и сверить с объявлением.
//   access: authed | staff  → аноним обязан получить 401 AUTH_REQUIRED
//   access: public          → аноним обязан получить что угодно, КРОМЕ 401 AUTH_REQUIRED
//
// Обратное направление (сессия есть, но не staff → 403) проверяет
// `check-admin-contracts.js`; дублировать не нужно.
//
// Тест не требует БД: 401 отдаёт диспетчер до хендлера. Публичные маршруты в хендлер
// заходят, поэтому без БД могут ответить 500 — это тоже «не 401», и для этой проверки
// достаточно. Она про гейт, а не про работоспособность.
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
