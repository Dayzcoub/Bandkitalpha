import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

async function api(path: string, body?: unknown): Promise<{ status: number; data: any }> {
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
    return { status: 0, data: null };
  }
}

function show(el: HTMLElement | null, visible: boolean): void {
  if (el) el.hidden = !visible;
}

async function reflectStatus(root: HTMLElement): Promise<void> {
  const status = root.querySelector<HTMLElement>('[data-2fa-status]');
  if (!status) return; // panel not on this page
  const { data } = await api('/auth/me');
  const on = Boolean(data?.user?.two_factor_enabled);
  status.textContent = on ? t('auth.2fa.statusOn') : t('auth.2fa.statusOff');
  status.dataset.tone = on ? 'ok' : '';
  show(root.querySelector<HTMLElement>('[data-2fa-action="enroll"]'), !on);
  show(root.querySelector<HTMLElement>('[data-2fa-action="disable"]'), on);
}

function setMessage(root: HTMLElement, text: string, tone: 'error' | 'ok' | 'info' = 'error'): void {
  const box = root.querySelector<HTMLElement>('[data-2fa-message]');
  if (!box) return;
  box.textContent = text;
  box.dataset.tone = tone;
}

function fieldValue(root: HTMLElement, name: string): string {
  return (root.querySelector<HTMLInputElement>(`[data-2fa-field="${name}"]`)?.value || '').trim();
}

async function handleAction(root: HTMLElement, action: string): Promise<void> {
  if (action === 'enroll') {
    const { status, data } = await api('/auth/2fa/enroll', {});
    if (status === 200) {
      const secretEl = root.querySelector<HTMLElement>('[data-2fa-secret]');
      if (secretEl) secretEl.textContent = `${data.secret}\n${data.otpauth_uri}`;
      show(root.querySelector<HTMLElement>('[data-2fa-enroll]'), true);
      setMessage(root, t('auth.2fa.addHint'), 'info');
    } else {
      setMessage(root, data?.error?.message || 'error');
    }
  } else if (action === 'confirm') {
    const { status, data } = await api('/auth/2fa/confirm', { code: fieldValue(root, 'code') });
    if (status === 200) {
      const list = root.querySelector<HTMLElement>('[data-2fa-recovery-list]');
      if (list) list.textContent = (data.recovery_codes || []).join('\n');
      show(root.querySelector<HTMLElement>('[data-2fa-recovery]'), true);
      show(root.querySelector<HTMLElement>('[data-2fa-enroll]'), false);
      setMessage(root, t('auth.2fa.enabledMsg'), 'ok');
      await reflectStatus(root);
    } else {
      setMessage(root, data?.error?.message || t('auth.2fa.invalid'));
    }
  } else if (action === 'disable') {
    show(root.querySelector<HTMLElement>('[data-2fa-disable-form]'), true);
  } else if (action === 'disable-confirm') {
    const { status, data } = await api('/auth/2fa/disable', { code: fieldValue(root, 'disable-code') });
    if (status === 200) {
      show(root.querySelector<HTMLElement>('[data-2fa-disable-form]'), false);
      show(root.querySelector<HTMLElement>('[data-2fa-recovery]'), false);
      setMessage(root, t('auth.2fa.disabledMsg'), 'ok');
      await reflectStatus(root);
    } else {
      setMessage(root, data?.error?.message || t('auth.2fa.invalid'));
    }
  }
}

export function initTwoFactor(root: HTMLElement): void {
  void reflectStatus(root);
  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-2fa-action]') : null;
    if (!target) return;
    const action = target.getAttribute('data-2fa-action');
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void handleAction(root, action);
  }, true);
}
