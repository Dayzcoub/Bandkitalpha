// Auth primitives — zero-dep, Node stdlib only (Security Standard §1, §8, §15).
// Passwords: scrypt (salt$hash). Tokens: random, stored only as sha256 hash.
import crypto from 'node:crypto';
import { isIP } from 'node:net';
import { promisify } from 'node:util';
import { getEnv } from '../config/env.js';

const scrypt = promisify(crypto.scrypt);
const KEY_LEN = 64;
const SESSION_COOKIE_NAME = 'bandkit_session';

// Returns `saltHex$hashHex`. algo is tracked separately in auth_credentials.
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(String(password), salt, KEY_LEN);
  return `${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes('$')) return false;
  const [saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scrypt(String(password), salt, expected.length || KEY_LEN);
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

// Raw token goes to the client (cookie / verification link); DB stores only the hash.
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key) out[key] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function getSessionToken(req) {
  return parseCookies(req)[SESSION_COOKIE_NAME] || null;
}

export function setSessionCookie(res, token, expiresAt, secure) {
  const attrs = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`
  ];
  if (secure) attrs.push('Secure');
  res.setHeader('set-cookie', attrs.join('; '));
}

export function clearSessionCookie(res, secure) {
  const attrs = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) attrs.push('Secure');
  res.setHeader('set-cookie', attrs.join('; '));
}

// ЕДИНСТВЕННАЯ точка получения IP-адреса клиента во всём проекте. Ни один другой файл
// не читает `x-forwarded-for`, `x-real-ip` или `socket.remoteAddress` напрямую — это
// проверяется механически (`scripts/check-ip-sources.mjs` в `npm run check`), потому что
// правило, которое держится на внимательности, здесь уже один раз не удержалось.
//
// Что было сломано (найдено 2026-07-16, до первого потребителя). Функция брала ПЕРВЫЙ
// элемент `x-forwarded-for`, а наш nginx собирает заголовок так:
//
//   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;   # "$http_x_forwarded_for, $remote_addr"
//
// то есть ДОПИСЫВАЕТ настоящий адрес справа, сохраняя всё, что прислал клиент, слева.
// Первый элемент поэтому целиком под контролем отправителя: `X-Forwarded-For: 1.2.3.4`
// — и в `sessions.ip` ложится `1.2.3.4`. Настоящий адрес при этом был рядом, вторым.
//
// Почему это чинится сейчас, до всякого IP-лимита: значение уже пишется в `sessions.ip`
// с миграции 0003 и выглядит как форензика, не будучи ею. А лимит по ключу, которым
// управляет атакующий, — не просто обходимый: он позволяет выжечь чужую квоту, подставив
// чужой адрес. Такой лимит хуже отсутствующего.
//
// Правило: доверяем не заголовку, а пиру. Если сокет пришёл не от доверенного прокси,
// клиент говорит сам за себя — его заявления игнорируются целиком. Если от доверенного,
// берём ПОСЛЕДНИЙ элемент: именно его дописал наш nginx, и он равен `$remote_addr`,
// который nginx наблюдал сам. Всё левее — по-прежнему чужие слова.
//
// Допущение, которое здесь зашито: ровно один доверенный хоп. Появится второй прокси
// перед nginx (CDN, LB) — последний элемент станет адресом nginx, а не клиента, и эту
// функцию придётся менять вместе с конфигом. Другого способа нет: длина цепочки — это
// факт о развёртывании, а не о запросе.
export function clientIp(req) {
  const peer = normalizeIp(req.socket?.remoteAddress);
  if (!peer) return null;
  if (!getEnv().trustedProxyIps.includes(peer)) return peer;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded !== 'string' || !forwarded) return peer;
  const hops = forwarded.split(',');
  const observed = normalizeIp(hops[hops.length - 1]);
  // Мусор в последнем элементе означает, что заголовок собрал не тот nginx, который мы
  // читали. Тогда честнее адрес пира, чем чужая строка.
  return observed || peer;
}

// `::ffff:127.0.0.1` — тот же 127.0.0.1, увиденный через IPv6-сокет. Без этого пир от
// собственного nginx не совпал бы со списком доверенных, и мы бы молча вернули адрес
// прокси вместо клиента. Возвращает null для всего, что не является IP.
function normalizeIp(value) {
  const trimmed = String(value ?? '').trim();
  const unmapped = trimmed.startsWith('::ffff:') ? trimmed.slice('::ffff:'.length) : trimmed;
  return isIP(unmapped) ? unmapped : null;
}

export { SESSION_COOKIE_NAME };
