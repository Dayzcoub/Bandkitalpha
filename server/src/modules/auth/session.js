import { getPool } from '../../db/client.js';
import { getSessionToken, hashToken } from '../../shared/auth.js';

// Один резолв на запрос. WeakMap, а не поле на `req`: ключ живёт ровно столько же, сколько
// запрос, и никто не может случайно прочитать «актора» из тела запроса.
//
// Мемоизация здесь — не оптимизация, а половина фикса дедлока пула. Хендлер берёт
// соединение (`getPool().connect()`) и внутри зовёт эту функцию, которая просит второе.
// При `max: 5` пять параллельных запросов держали весь пул и ждали шестого соединения,
// которого не будет: 20 параллельных `GET /entities/demo-band` давали 14×500 (замерено,
// чекпоинт 1.16.2). Вторая половина фикса — в `router.js`: диспетчер резолвит сессию до
// хендлера, поэтому его вызов попадает сюда уже готовым ответом и соединения не берёт.
//
// Инвалидации нет и не должно быть: запрос живёт миллисекунды, а сессия, отозванная в
// середине запроса, всё равно проверяется заново на следующем (Lifecycle §5.1 — revoke
// обязан сработать на следующем REST-запросе, а не внутри текущего).
const RESOLVED = new WeakMap();

// Resolves the authenticated user from the session cookie, or null.
// Server-side source of truth for "who is acting" (Security Standard §2).
export async function resolveSessionUser(req) {
  if (RESOLVED.has(req)) return RESOLVED.get(req);
  const user = await lookupSessionUser(req);
  RESOLVED.set(req, user);
  return user;
}

async function lookupSessionUser(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const result = await getPool().query(
    `select u.id, u.display_name, u.handle, u.email, u.status, u.sanction, u.email_verified, u.platform_role
     from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()
     limit 1`,
    [hashToken(token)]
  );
  return result.rows[0] || null;
}
