// Декларативный роутер: маршрут обязан объявить свой доступ, иначе он не существует.
//
// Решение F6 (`Architecture_Decisions_v1 §3.4`, `Architecture_Review 4.3`). Причина, по
// которой это не «наведение порядка», а безопасность: до этого файла доступ был свойством
// хендлера, а не маршрута. Восемь дыр 2026-07-16 — это восемь мест, где хендлер забыл
// проверить, и ничто не могло об этом узнать. Единственный гейт, стоявший в точке
// диспетчеризации (admin, 1.15.2), — единственный, который с тех пор не ломался: новый
// admin-роут физически не мог уехать незащищённым.
//
// Здесь это правило распространено на все маршруты. `access` — обязательное поле; маршрут
// без него не регистрируется, и сервер не стартует (см. `validateRoute`). Падение при
// старте, а не при запросе: незаявленный доступ обязан быть заметен раньше, чем его найдёт
// кто-то другой.
//
// ЧТО ЭТОТ ГЕЙТ НЕ ДЕЛАЕТ. Он грубый: «есть ли вообще сессия» и «это staff». Он не знает и
// не должен знать, вправе ли актор видеть *этот* объект — object-level authz остаётся в
// хендлере и в `PermissionService`, потому что только там известно, о каком объекте речь.
// Из восьми дыр этот слой закрывает класс «аноним дошёл до данных» (admin-консоль); класс
// «дошёл не до своих данных» (IDOR) закрывается не здесь. Два слоя, разные вопросы.
import { resolveSessionUser } from './modules/auth/session.js';
import { permissionService } from './modules/permissions/PermissionService.js';
import { consumeRateLimit, isKnownPolicy, RATE_LIMIT_POLICIES } from './modules/rateLimit/rateLimitService.js';
import { getPool } from './db/client.js';
import { sendError } from './shared/http.js';

// Больше уровней не нужно: `staff` расщепится на роли, когда у `support_agent` и
// `read_only_auditor` появятся полномочия (Architecture_Review 4.3) — тогда и здесь.
const ACCESS_LEVELS = new Set(['public', 'authed', 'staff']);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// `/entities/:entityId` → параметр; `/me/invitations/:id/:decision(accept|decline)` →
// параметр с фиксированным множеством значений. Второе — не украшение: сегодня роутер
// матчит только `accept|decline`, и всё остальное отдаёт 404, не доходя до хендлера.
// Превратить это в свободный `:decision` значило бы тихо расширить контракт.
function compilePath(prefix, path) {
  const params = [];
  const segments = path.split('/').filter(Boolean).map((segment) => {
    if (!segment.startsWith(':')) return escapeRegex(segment);
    const parsed = segment.match(/^:(\w+)(?:\(([^)]+)\))?$/);
    if (!parsed) throw new Error(`Маршрут ${path}: непонятный сегмент ${segment}`);
    params.push(parsed[1]);
    return parsed[2] ? `(${parsed[2].split('|').map(escapeRegex).join('|')})` : '([^/]+)';
  });
  return { regex: new RegExp(`^${escapeRegex(prefix)}/${segments.join('/')}$`), params };
}

function validateRoute(route, index) {
  const where = `Маршрут #${index} (${route.method || '?'} ${route.path || '?'})`;
  if (!route.method || !route.path) throw new Error(`${where}: нет method или path`);
  if (!route.path.startsWith('/')) throw new Error(`${where}: path должен начинаться с /`);
  if (typeof route.handler !== 'function') throw new Error(`${where}: нет handler`);
  // Вот ради этой строки всё остальное. Забыть объявить доступ — не вариант по построению.
  if (!ACCESS_LEVELS.has(route.access)) {
    throw new Error(
      `${where}: поле access обязательно и должно быть одним из ${[...ACCESS_LEVELS].join(' | ')}. ` +
      'Маршрут без объявленного доступа не регистрируется (F6).'
    );
  }
  // То же самое для лимита: F6 требует, чтобы маршрут объявлял и доступ, И политику
  // лимита. `limit: 'none'` — законный ответ, но ответ, а не умолчание.
  if (!route.limit || !isKnownPolicy(route.limit)) {
    throw new Error(
      `${where}: поле limit обязательно и должно быть одним из ${Object.keys(RATE_LIMIT_POLICIES).join(' | ')}. ` +
      'Маршрут без объявленной политики лимита не регистрируется (F6, D5).'
    );
  }
  // Лимит в MVP — только per-actor (D5), а у public-маршрута актора нет. Политика на нём
  // не «не сработает», она соврёт: выглядит как защита, не будучи ею.
  if (route.access === 'public' && route.limit !== 'none') {
    throw new Error(
      `${where}: public-маршрут не может иметь политику лимита (${route.limit}) — лимиты ` +
      'в MVP считаются по актору (D5), а его здесь нет. Ограничение анонимных путей требует ' +
      'IP/device, вынесенных в отдельный Security Layer следующей фазы.'
    );
  }
}

export function createRouter(routes, prefix) {
  const compiled = routes.map((route, index) => {
    validateRoute(route, index);
    return { ...route, ...compilePath(prefix, route.path) };
  });

  // Возвращает true, если маршрут найден и обработан; false — пусть решает вызывающий.
  return async function dispatch(req, res, url) {
    for (const route of compiled) {
      if (route.method !== req.method) continue;
      const match = url.pathname.match(route.regex);
      if (!match) continue;

      if (route.access !== 'public') {
        // Резолв сессии здесь, ДО того как хендлер возьмёт соединение из пула, — а не
        // только гигиена. Хендлер, взявший соединение и попросивший второе внутри
        // `resolveSessionUser`, при `max: 5` вставал намертво (замерено: 20 параллельных
        // GET /entities/:id → 14×500). Резолв в диспетчере + мемоизация на запрос
        // (session.js) означают, что вложенного соединения больше не существует.
        const actor = await resolveSessionUser(req);
        if (!actor) {
          sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
          return true;
        }
        if (route.access === 'staff' && !permissionService.canReadAdminConsole(actor)) {
          sendError(res, 403, 'ADMIN_FORBIDDEN', 'Platform staff access is required');
          return true;
        }

        // Лимит — здесь, а не в хендлере, и это половина смысла D5: три «неограниченных
        // write-пути» получают лимит, не зная о нём ни строчки. Списывается ПОПЫТКА:
        // отказ хендлера не возвращает квоту, иначе перебор был бы бесплатным (0027,
        // решение 3). Пул: диспетчер соединения не держит, поэтому передаём пул, и
        // правило «соединение берут последним» не нарушено.
        if (route.limit !== 'none') {
          const verdict = await consumeRateLimit(getPool(), actor.id, route.limit);
          if (!verdict.allowed) {
            // Ответ зависит только от действий самого актора и никогда — от состояния
            // получателя (`Architecture_Decisions §3.3`). Иначе 429 стал бы способом
            // узнать, что тебя отклонили, — а §2 требует, чтобы отказ был невидим.
            res.setHeader('retry-after', String(verdict.retryAfterSeconds));
            sendError(res, 429, 'RATE_LIMITED', 'Too many requests, try again later', {
              retry_after_seconds: verdict.retryAfterSeconds
            });
            return true;
          }
        }
      }

      await route.handler(req, res, match.slice(1).map(decodeURIComponent));
      return true;
    }
    return false;
  };
}

export { ACCESS_LEVELS };
