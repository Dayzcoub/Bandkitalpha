// Server-side link guard (Security AntiFraud §4). The frontend has its own
// linkPolicy for a UX hint, but that is never the guard — the server is the
// source of truth (CLAUDE.md: frontend checks are hints, not security). MVP is
// strict mode: external links, shorteners and punycode/unicode-lookalike domains
// in user messages are blocked. Reason: extortion, social engineering, phishing,
// scam. Returns { blocked, reason } where reason is a stable code the client maps
// to a localized warning.

const SHORTENERS = /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|cutt\.ly|rebrand\.ly|buff\.ly|shorturl\.at)\b/i;
// http(s):// or www. or a bare host with a common TLD.
const URL_LIKE = /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|ru|net|org|io|me|app|dev|xyz|link|click|top|info|biz|co|tg|onion)\b)/i;
// Punycode host label (IDN homograph vector).
const PUNYCODE = /\bxn--[a-z0-9-]+/i;
// A non-ASCII label directly before a dotted TLD — unicode look-alike domain.
const UNICODE_DOMAIN = /[^\x00-\x7F][^\s]*\.[a-z]{2,}/i;

// Ordered most-specific first so the reason is the most useful one.
export function checkLinkPolicy(text) {
  const value = String(text ?? '');
  if (PUNYCODE.test(value)) return { blocked: true, reason: 'punycode' };
  if (SHORTENERS.test(value)) return { blocked: true, reason: 'shortener' };
  if (UNICODE_DOMAIN.test(value)) return { blocked: true, reason: 'suspicious_domain' };
  if (URL_LIKE.test(value)) return { blocked: true, reason: 'external_url' };
  return { blocked: false, reason: null };
}
