const urlLikePattern = /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|ru|net|org|io|me|app|dev|xyz)\b)/i;
const shortenerPattern = /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly)\b/i;

export interface LinkPolicyResult {
  hasBlockedLink: boolean;
  reason: 'external_url' | 'shortener' | null;
}

export function checkLinkPolicy(text: string): LinkPolicyResult {
  if (shortenerPattern.test(text)) {
    return { hasBlockedLink: true, reason: 'shortener' };
  }
  if (urlLikePattern.test(text)) {
    return { hasBlockedLink: true, reason: 'external_url' };
  }
  return { hasBlockedLink: false, reason: null };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
