import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';
import { setSessionUser } from '../lib/auth/session.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

type ApiResult = { status: number; data: any };

async function api(path: string, body?: unknown): Promise<ApiResult> {
  // Timeout so a hung backend (accepted connection, no response) can't block the
  // bootstrap /auth/me await and leave the SPA rendering nothing.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`/api/v1${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      signal: controller.signal
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data };
  } catch {
    // Backend unreachable / timed out — treat as unauthenticated so the app renders.
    return { status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

// Bootstrap: resolve the live session and make it the app's source of truth.
// Awaited before the first render so guards reflect the real session (no flash).
export async function hydrateSessionState(): Promise<void> {
  const { status, data } = await api('/auth/me');
  const user = status === 200 ? data?.user : null;
  setSessionUser(user || null);
  document.documentElement.dataset.bandkitAuthed = user ? 'true' : 'false';
  if (user) document.documentElement.dataset.bandkitUser = user.email;
  else delete document.documentElement.dataset.bandkitUser;
}

function fieldValue(form: HTMLElement, name: string): string {
  return (form.querySelector<HTMLInputElement>(`[data-auth-field="${name}"]`)?.value || '').trim();
}

// SPA navigation: the app re-renders on popstate (same pattern as the other Real*
// modules). Used to move from register/verify onto the login screen.
function navigateTo(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// One-shot handoff to the login screen after register/verify. Held in memory only
// (never persisted, never in the URL — it can carry a password), and cleared the
// first time it is applied.
let pendingLoginPrefill: { email?: string; password?: string; message?: string; tone?: 'error' | 'ok' | 'info' } | null = null;
let appRoot: HTMLElement | null = null;

function applyPendingPrefill(root: HTMLElement): void {
  if (!pendingLoginPrefill) return;
  const form = root.querySelector<HTMLElement>('form[data-auth-form="login"]');
  if (!form) return;
  const prefill = pendingLoginPrefill;
  pendingLoginPrefill = null; // one-shot: applied once, then forgotten
  if (prefill.email) {
    const field = form.querySelector<HTMLInputElement>('[data-auth-field="email"]');
    if (field) field.value = prefill.email;
  }
  if (prefill.password) {
    const field = form.querySelector<HTMLInputElement>('[data-auth-field="password"]');
    if (field) field.value = prefill.password;
  }
  if (prefill.message) setMessage(form, prefill.message, prefill.tone || 'info');
}

function setMessage(form: HTMLElement, text: string, tone: 'error' | 'ok' | 'info' = 'error'): void {
  const box = form.querySelector<HTMLElement>('[data-auth-message]');
  if (!box) return;
  box.textContent = text; // textContent — no HTML injection (Security §5)
  box.dataset.tone = tone;
}

async function submitAuthForm(form: HTMLElement): Promise<void> {
  const kind = form.dataset.authForm;
  setMessage(form, t('auth.msg.working'), 'info');

  if (kind === 'login') {
    const code = fieldValue(form, 'code');
    const body: Record<string, string> = { email: fieldValue(form, 'email'), password: fieldValue(form, 'password') };
    if (code) body.code = code;
    const { status, data } = await api('/auth/login', body);
    if (status === 200) {
      // Full reload re-runs hydrateSessionState, so the session drives state.
      window.location.href = '/feed';
      return;
    }
    if (data?.error?.code === 'AUTH_2FA_REQUIRED') {
      const wrap = form.querySelector<HTMLElement>('[data-auth-2fa-wrap]');
      if (wrap) wrap.hidden = false;
      setMessage(form, t('auth.2fa.required'), 'info');
      return;
    }
    if (data?.error?.code === 'AUTH_2FA_INVALID') {
      setMessage(form, t('auth.2fa.invalid'));
      return;
    }
    setMessage(form, data?.error?.message || t('auth.msg.loginFailed'));
  } else if (kind === 'register') {
    const locale = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
    const { status, data } = await api('/auth/register', {
      email: fieldValue(form, 'email'),
      password: fieldValue(form, 'password'),
      display_name: fieldValue(form, 'display_name'),
      locale: normalizeLocale(locale)
    });
    if (status === 201) {
      // Registration does not sign you in — move to the login screen with the
      // credentials carried over, so the next step is one click. The confirmation
      // notice (and, on a provider-less local run, the dev token) rides along.
      const devToken = data?.dev_verify_token ? ` ${t('auth.msg.devToken')} ${data.dev_verify_token}` : '';
      pendingLoginPrefill = {
        email: fieldValue(form, 'email'),
        password: fieldValue(form, 'password'),
        message: `${t(data?.email_sent ? 'auth.msg.checkEmail' : 'auth.msg.noMailProvider')}${devToken}`,
        tone: 'ok'
      };
      navigateTo('/login');
      if (appRoot) applyPendingPrefill(appRoot);
      return;
    }
    setMessage(form, data?.error?.message || t('auth.msg.registerFailed'));
  } else if (kind === 'verify') {
    const { status, data } = await api('/auth/verify-email', { token: fieldValue(form, 'token') });
    if (status === 200) {
      // Verified — land on the login screen with the address prefilled and a clear
      // "email confirmed" status, so the confirmation is not a dead end.
      pendingLoginPrefill = { email: data?.email || '', message: t('auth.msg.verified'), tone: 'ok' };
      navigateTo('/login');
      if (appRoot) applyPendingPrefill(appRoot);
      return;
    }
    setMessage(form, t('auth.msg.tokenInvalid'), 'error');
  }
}

// A verification link from the email lands on /auth/verify-email?token=... —
// prefill the field and submit it, so the user only has to click the link.
function consumeVerifyTokenFromUrl(root: HTMLElement): void {
  const form = root.querySelector<HTMLElement>('form[data-auth-form="verify"]');
  if (!form || form.dataset.tokenApplied === '1') return;
  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) return;
  form.dataset.tokenApplied = '1';
  const field = form.querySelector<HTMLInputElement>('[data-auth-field="token"]');
  if (field) field.value = token;
  // Drop the token from the address bar so it is not kept in history/referrer.
  window.history.replaceState({}, '', window.location.pathname);
  void submitAuthForm(form);
}

export function initAuthClient(root: HTMLElement): void {
  appRoot = root;
  consumeVerifyTokenFromUrl(root);
  applyPendingPrefill(root);
  new MutationObserver(() => { consumeVerifyTokenFromUrl(root); applyPendingPrefill(root); }).observe(root, { childList: true, subtree: true });

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const submit = target.closest<HTMLElement>('[data-auth-submit]');
    if (submit) {
      const form = submit.closest<HTMLElement>('form[data-auth-form]');
      if (form) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void submitAuthForm(form);
      }
      return;
    }

    const logout = target.closest<HTMLElement>('[data-auth-action="logout"]');
    if (logout) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void api('/auth/logout', {}).then(() => {
        setSessionUser(null);
        // Explicit guest on logout so the mock fallback doesn't keep a stale role.
        localStorage.setItem('bandkit.role', 'guest');
        window.location.href = '/';
      });
    }
  }, true);
}
