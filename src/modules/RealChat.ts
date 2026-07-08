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
type Message = { id: string; author_user_id: string | null; author_name: string | null; body: string; created_at: string };

// Cached id of the current user, for own-vs-other message styling.
let myUserId: string | null = null;
async function ensureMe(): Promise<string | null> {
  if (myUserId) return myUserId;
  const { status, data } = await api('/auth/me', 'GET');
  if (status === 200) myUserId = data?.user?.id ?? null;
  return myUserId;
}

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

// Message card matching the native chat markup so the existing decorators apply:
// the .bk-chat-message-card class + .bk-chat-message-actions footer let
// ChatMessageControls' observer attach delete/report on hover/long-press, and
// the reply link mirrors the mock. `is-own` right-aligns and highlights the
// current user's own messages (VK/Telegram style).
function messageCard(m: Message, index: number, myId: string | null): string {
  const own = Boolean(myId && m.author_user_id === myId);
  const author = m.author_name || t('chats.real.you');
  return `<section class="bk-card bk-social-card bk-chat-message-card bk-real-msg${own ? ' is-own' : ''}"`
    + ` id="chat-message-${esc(m.id)}" data-message-index="${index}"`
    + ` data-reply-author="${esc(author)}" data-reply-body="${esc(m.body)}">`
    + `<div class="bk-card-header"><div class="bk-list-row-main">`
    + `<h3 class="bk-card-title">${esc(author)}</h3>`
    + `<div class="bk-meta">${esc(fmtTime(m.created_at))}</div></div></div>`
    + `<p class="bk-card-body">${esc(m.body)}</p>`
    + `<footer class="bk-chat-message-actions">`
    + `<button class="bk-chat-reply-action" type="button" data-real-reply data-reply-author="${esc(author)}" data-reply-body="${esc(m.body)}">↩ ${esc(t('chats.real.reply'))}</button>`
    + `</footer></section>`;
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
  const [myId, res] = await Promise.all([ensureMe(), api(`/chat-rooms/${encodeURIComponent(roomId)}/messages`, 'GET')]);
  const { status, data } = res;

  // Replace only the message cards / chrome, never the sticky composer that the
  // native decorators moved into the thread (wiping it caused the overlap bug).
  thread.querySelectorAll('.bk-social-card, .bk-chat-stress-message, .bk-chat-unread-divider, .bk-chat-load-older, [data-real-empty], [data-real-error]')
    .forEach((el) => el.remove());

  let html: string;
  if (status !== 200) {
    html = `<p class="bk-state-copy" data-real-error data-tone="error">${esc(t('chats.real.loadError'))}</p>`;
  } else {
    const messages: Message[] = data?.messages ?? [];
    html = messages.length
      ? messages.map((m, i) => messageCard(m, i, myId)).join('')
      : `<p class="bk-state-copy" data-real-empty>${esc(t('chats.real.empty'))}</p>`;
  }

  const composer = thread.querySelector('.bk-chat-composer-inside-thread, [data-chat-composer]');
  if (composer) composer.insertAdjacentHTML('beforebegin', html);
  else thread.insertAdjacentHTML('beforeend', html);
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
      return;
    }
    const reply = target.closest<HTMLElement>('[data-real-reply]');
    if (reply) {
      event.preventDefault();
      const author = reply.getAttribute('data-reply-author') || '';
      const body = reply.getAttribute('data-reply-body') || '';
      const textarea = root.querySelector<HTMLTextAreaElement>('[data-chat-body]');
      if (textarea) {
        const quote = `> ${author}: ${body}\n`;
        if (!textarea.value.startsWith(quote)) textarea.value = quote + textarea.value;
        textarea.focus();
      }
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
