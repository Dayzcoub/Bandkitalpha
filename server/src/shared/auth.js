// Auth primitives — zero-dep, Node stdlib only (Security Standard §1, §8, §15).
// Passwords: scrypt (salt$hash). Tokens: random, stored only as sha256 hash.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

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

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}

export { SESSION_COOKIE_NAME };
