// Authenticated encryption for secrets at rest (aes-256-gcm), zero-dep.
// Key comes from TWOFACTOR_KEK (64 hex chars = 32 bytes). Used to protect TOTP
// secrets so a database read alone cannot generate valid codes (Security §10).
import crypto from 'node:crypto';

let cachedKek;

function getKek() {
  if (cachedKek !== undefined) return cachedKek;
  const raw = process.env.TWOFACTOR_KEK || '';
  cachedKek = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, 'hex') : null;
  return cachedKek;
}

export function twoFactorConfigured() {
  return getKek() !== null;
}

export function encryptSecret(plaintext) {
  const kek = getKek();
  if (!kek) throw Object.assign(new Error('TWOFACTOR_KEK is not configured'), { code: 'KEK_MISSING' });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${enc.toString('base64')}`;
}

export function decryptSecret(payload) {
  const kek = getKek();
  if (!kek) throw Object.assign(new Error('TWOFACTOR_KEK is not configured'), { code: 'KEK_MISSING' });
  const [iv, tag, data] = String(payload).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}
