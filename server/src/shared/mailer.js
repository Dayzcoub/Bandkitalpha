// Outbound email — zero-dep (Resend's HTTP API over fetch), matching the
// backend's stdlib-only rule. Provider is chosen by MAIL_PROVIDER:
//   none   (default) — nothing is sent; the caller falls back to the dev token.
//   resend — POST https://api.resend.com/emails with RESEND_API_KEY.
//
// Sending must never break the request it rides on: registration succeeds even
// if the mail provider is down, and the token is still valid (the user can ask
// for a resend later). Failures are logged, never thrown.
import { logError, logInfo } from './logger.js';

// Overridable so the send path can be exercised against a local stub in tests.
const RESEND_ENDPOINT = process.env.RESEND_ENDPOINT || 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 8000;

export function mailerConfigured(env) {
  return env.mailProvider === 'resend' && Boolean(env.resendApiKey && env.mailFrom);
}

// Returns { sent, id?, reason? } — never throws.
export async function sendMail(env, { to, subject, html, text }) {
  if (!mailerConfigured(env)) {
    // Dev/staging without a provider: make the mail visible in the logs instead
    // of silently dropping it.
    logInfo('Mail not sent (no provider configured)', { to, subject });
    return { sent: false, reason: 'no_provider' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.resendApiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ from: env.mailFrom, to: [to], subject, html, text }),
      signal: controller.signal
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      // Log the provider's reason, never the message body or token.
      logError('Mail provider rejected the message', { status: res.status, error: data?.message || data?.name || null, to });
      return { sent: false, reason: 'provider_error' };
    }
    logInfo('Mail sent', { to, subject, id: data?.id || null });
    return { sent: true, id: data?.id || null };
  } catch (error) {
    logError('Mail send failed', { message: error?.message || String(error), to });
    return { sent: false, reason: 'transport_error' };
  } finally {
    clearTimeout(timer);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

// Verification email. The link carries the one-time, short-lived token; the
// plain-text part repeats it so clients that strip links still work.
export function verificationEmail(locale, { displayName, verifyUrl }) {
  const ru = locale !== 'en';
  const name = escapeHtml(displayName || '');
  const url = escapeHtml(verifyUrl);
  const subject = ru ? 'Подтвердите email — BandKit' : 'Confirm your email — BandKit';
  const heading = ru ? 'Подтвердите email' : 'Confirm your email';
  const intro = ru
    ? `Здравствуйте${name ? ', ' + name : ''}! Чтобы завершить регистрацию в BandKit, подтвердите адрес.`
    : `Hi${name ? ' ' + name : ''}! Confirm your address to finish signing up for BandKit.`;
  const cta = ru ? 'Подтвердить email' : 'Confirm email';
  const fallback = ru ? 'Если кнопка не работает, откройте ссылку:' : 'If the button does not work, open this link:';
  const ignore = ru
    ? 'Если вы не регистрировались в BandKit, просто проигнорируйте это письмо.'
    : 'If you did not sign up for BandKit, just ignore this email.';
  const expiry = ru ? 'Ссылка действует 24 часа и одноразовая.' : 'The link is valid for 24 hours and can be used once.';

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#0b0d12;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e8eaf0">`
    + `<div style="max-width:520px;margin:0 auto;background:#141821;border-radius:14px;padding:32px">`
    + `<h1 style="margin:0 0 12px;font-size:22px;color:#fff">${heading}</h1>`
    + `<p style="margin:0 0 20px;line-height:1.5;color:#b8bfd0">${intro}</p>`
    + `<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#6c5ce7;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">${cta}</a></p>`
    + `<p style="margin:0 0 6px;font-size:13px;color:#8b93a7">${fallback}</p>`
    + `<p style="margin:0 0 20px;font-size:13px;word-break:break-all"><a href="${url}" style="color:#8ab4ff">${url}</a></p>`
    + `<p style="margin:0 0 6px;font-size:13px;color:#8b93a7">${expiry}</p>`
    + `<p style="margin:0;font-size:13px;color:#8b93a7">${ignore}</p>`
    + `</div></body></html>`;

  const text = `${heading}\n\n${intro}\n\n${verifyUrl}\n\n${expiry}\n${ignore}`;
  return { subject, html, text };
}
