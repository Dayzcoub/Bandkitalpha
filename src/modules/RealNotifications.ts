import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function locale() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return normalizeLocale(stored);
}
function t(key: string): string {
  return createTranslator(locale())(key);
}
function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}
function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleString(locale() === 'ru' ? 'ru-RU' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

async function api(path: string, method: 'GET' | 'POST', body?: unknown): Promise<{ status: number; data: any }> {
  try {
    const res = await fetch(`/api/v1${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin'
    });
    let data: any = null;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

interface Notification {
  id: string; type_key: string; created_at: string; read_at: string | null;
  actor_name: string | null; entity_name: string | null;
}

// Notifications hold references, not text (backend 0025) — the readable line is built
// here from the type + actor (+ entity for an invitation). Actor prefix + type suffix
// reads correctly in both ru and en, so no interpolation is needed.
function line(n: Notification): string {
  const actor = esc(n.actor_name || t('notifications.someone'));
  const known = ['friend_request', 'friend_accepted', 'conversation_request', 'entity_invitation'].includes(n.type_key);
  const suffix = t(`notifications.type.${known ? n.type_key : 'unknown'}`);
  const entity = n.type_key === 'entity_invitation' && n.entity_name ? ` «${esc(n.entity_name)}»` : '';
  return `<strong>${actor}</strong> ${esc(suffix)}${entity}`;
}

function renderList(box: HTMLElement, notifications: Notification[]): void {
  if (!notifications.length) {
    box.innerHTML = `<p class="bk-state-copy">${esc(t('notifications.empty'))}</p>`;
    return;
  }
  box.innerHTML = `<div class="bk-list">${notifications.map((n) => {
    const unread = !n.read_at ? ' bk-notif-unread' : '';
    return `<div class="bk-list-row${unread}"><div class="bk-list-row-main">`
      + `<div class="bk-list-row-title">${line(n)}</div>`
      + `<div class="bk-meta">${esc(fmtTime(n.created_at))}</div>`
      + `</div></div>`;
  }).join('')}</div>`;
}

// The unread count on the bell. The bell buttons are re-rendered on every route, so
// the badge is (re)applied on each poll rather than kept as state.
function updateBadge(root: HTMLElement, count: number): void {
  root.querySelectorAll<HTMLElement>('[data-route="/notifications"]').forEach((btn) => {
    let badge = btn.querySelector<HTMLElement>('[data-notif-badge]');
    if (count <= 0) { badge?.remove(); return; }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'bk-notif-badge';
      badge.setAttribute('data-notif-badge', '');
      btn.appendChild(badge);
    }
    badge.textContent = count > 99 ? '99+' : String(count);
  });
}

async function poll(root: HTMLElement): Promise<void> {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') { updateBadge(root, 0); return; }
  if (typeof document !== 'undefined' && document.hidden) return;
  const { status, data } = await api('/me/notifications', 'GET');
  if (status !== 200) return;

  const box = root.querySelector<HTMLElement>('[data-real-notifications]');
  if (box) {
    renderList(box, data?.notifications ?? []);
    // Reading the page IS the delivery (no push channel in MVP): mark everything
    // read, then reflect the cleared count on the bell.
    if ((data?.unread || 0) > 0) {
      await api('/me/notifications/read', 'POST', {});
      updateBadge(root, 0);
      return;
    }
  }
  updateBadge(root, data?.unread || 0);
}

const POLL_MS = 20000;

export function initRealNotifications(root: HTMLElement): void {
  const run = () => { void poll(root); };
  run();
  // Poll on navigation, NOT via a MutationObserver: poll() itself mutates the DOM
  // (badge + list), so an observer would re-enter and storm the network. popstate
  // fires on every SPA route change; the setTimeout lets the app finish its own
  // re-render first, so the new page's mount point and bell are already present.
  window.addEventListener('popstate', () => { window.setTimeout(run, 0); });
  window.setInterval(run, POLL_MS);
}
