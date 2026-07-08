import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';
import { getAsset } from '../lib/assets/assetRegistry.js';

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function roomIdFromPath(): string | null {
  const m = window.location.pathname.match(/^\/chats\/([^/]+)$/);
  const id = m?.[1] ? decodeURIComponent(m[1]) : null;
  return id && UUID.test(id) ? id : null;
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

type Room = { id: string; title: string | null; type: string; entity_name: string | null; event_title: string | null };
type Message = { id: string; author_name: string | null; body: string; created_at: string };

function roomLabel(r: Room): string {
  return r.title || r.entity_name || r.event_title || r.type;
}

// Native chat-list row (mirrors the listRow / chatRow markup), navigable to the
// real room. Not an <a>, so it does not trigger the SPA's render-time binding;
// navigation is handled by the delegated click/keydown below.
function roomRow(r: Room): string {
  return `<div class="bk-list-row" data-real-room-nav data-path="/chats/${esc(r.id)}" role="link" tabindex="0">`
    + `<img class="bk-avatar" src="${getAsset('navChatsInactive')}" alt="" loading="lazy" decoding="async" />`
    + `<div class="bk-list-row-main"><div class="bk-list-row-title">${esc(roomLabel(r))}</div>`
    + `<div class="bk-meta">${esc(t('chats.messages'))}</div></div></div>`;
}

// Native message card (mirrors chatMessages() output).
function messageCard(m: Message): string {
  return `<section class="bk-card bk-social-card"><div class="bk-card-header"><div class="bk-list-row-main">`
    + `<h3 class="bk-card-title">${esc(m.author_name || t('chats.real.you'))}</h3>`
    + `<div class="bk-meta">${esc(fmtTime(m.created_at))}</div></div></div>`
    + `<p class="bk-card-body">${esc(m.body)}</p></section>`;
}

async function populateRooms(list: HTMLElement): Promise<void> {
  const { status, data } = await api('/me/chat-rooms', 'GET');
  if (status !== 200) return; // leave the native placeholder list as-is
  const rooms: Room[] = data?.rooms ?? [];
  list.innerHTML = rooms.length
    ? rooms.map(roomRow).join('')
    : `<p class="bk-state-copy">${esc(t('chats.real.noRooms'))}</p>`;
}

async function populateThread(thread: HTMLElement, roomId: string): Promise<void> {
  const { status, data } = await api(`/chat-rooms/${encodeURIComponent(roomId)}/messages`, 'GET');
  if (status !== 200) {
    thread.innerHTML = `<p class="bk-state-copy" data-tone="error">${esc(t('chats.real.loadError'))}</p>`;
    return;
  }
  const messages: Message[] = data?.messages ?? [];
  thread.innerHTML = messages.length
    ? messages.map(messageCard).join('')
    : `<p class="bk-state-copy">${esc(t('chats.real.empty'))}</p>`;
}

function refresh(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;

  root.querySelectorAll<HTMLElement>('[data-real-room-list]').forEach((list) => {
    if (list.dataset.realDone === '1') return;
    list.dataset.realDone = '1';
    void populateRooms(list);
  });

  const roomId = roomIdFromPath();
  const thread = root.querySelector<HTMLElement>('[data-real-thread]');
  if (thread && roomId && thread.dataset.realRoom !== roomId) {
    thread.dataset.realRoom = roomId;
    void populateThread(thread, roomId);
  }
}

function navTo(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
}

async function sendCurrent(root: HTMLElement, btn: HTMLButtonElement): Promise<void> {
  const roomId = roomIdFromPath();
  const textarea = root.querySelector<HTMLTextAreaElement>('[data-chat-body]');
  const text = (textarea?.value || '').trim();
  if (!roomId || !text) return;
  btn.disabled = true;
  try {
    const { status } = await api(`/chat-rooms/${encodeURIComponent(roomId)}/messages`, 'POST', { body: text });
    if (status === 201) {
      if (textarea) textarea.value = '';
      const thread = root.querySelector<HTMLElement>('[data-real-thread]');
      if (thread) await populateThread(thread, roomId);
    }
  } finally {
    btn.disabled = false;
  }
}

export function initRealChat(root: HTMLElement): void {
  refresh(root);
  new MutationObserver(() => refresh(root)).observe(root, { childList: true, subtree: true });

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const nav = target.closest<HTMLElement>('[data-real-room-nav]');
    if (nav) {
      event.preventDefault();
      const path = nav.getAttribute('data-path');
      if (path) navTo(path);
      return;
    }
    const send = target.closest<HTMLButtonElement>('[data-chat-send]');
    if (send) {
      event.preventDefault();
      void sendCurrent(root, send);
    }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target instanceof Element ? event.target : null;
    const nav = target?.closest<HTMLElement>('[data-real-room-nav]');
    if (nav) {
      event.preventDefault();
      const path = nav.getAttribute('data-path');
      if (path) navTo(path);
    }
  });
}
