import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';
import { setSessionUser } from '../lib/auth/session.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

type ApiResult = { status: number; data: any };

async function api(path: string, body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(`/api/v1${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin'
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data };
  } catch {
    // Backend unreachable — treat as unauthenticated so the app still renders.
    return { status: 0, data: null };
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
    const { status, data } = await api('/auth/login', { email: fieldValue(form, 'email'), password: fieldValue(form, 'password') });
    if (status === 200) {
      // Full reload re-runs hydrateSessionState, so the session drives state.
      window.location.href = '/feed';
      return;
    }
    setMessage(form, data?.error?.message || t('auth.msg.loginFailed'));
  } else if (kind === 'register') {
    const { status, data } = await api('/auth/register', {
      email: fieldValue(form, 'email'),
      password: fieldValue(form, 'password'),
      display_name: fieldValue(form, 'display_name')
    });
    if (status === 201) {
      const devToken = data?.dev_verify_token ? ` ${t('auth.msg.devToken')} ${data.dev_verify_token}` : '';
      setMessage(form, `${t('auth.msg.checkEmail')}${devToken}`, 'ok');
      return;
    }
    setMessage(form, data?.error?.message || t('auth.msg.registerFailed'));
  } else if (kind === 'verify') {
    const { status } = await api('/auth/verify-email', { token: fieldValue(form, 'token') });
    setMessage(form, status === 200 ? t('auth.msg.verified') : t('auth.msg.tokenInvalid'), status === 200 ? 'ok' : 'error');
  }
}

export function initAuthClient(root: HTMLElement): void {
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
