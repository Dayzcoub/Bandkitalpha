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

async function api(path: string, method: 'GET' | 'POST' | 'PATCH', body?: unknown): Promise<{ status: number; data: any }> {
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
type Message = { id: string; author_user_id: string | null; author_name: string | null; body: string; created_at: string; is_pinned?: boolean };

const MODERATOR_ROLES = ['owner', 'admin', 'manager'];

// Deterministic initials + palette class for an avatar (no photos in the schema).
function initials(name: string): string {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  const chars = parts.slice(0, 2).map((p) => p[0]).join('');
  return (chars || '?').toUpperCase();
}
function avatarClass(name: string): string {
  let h = 0;
  for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `bk-ava-${h % 8}`;
}
function avatarHtml(name: string, extra = ''): string {
  return `<span class="bk-real-ava ${avatarClass(name)}${extra ? ` ${extra}` : ''}" aria-hidden="true">${esc(initials(name))}</span>`;
}

// Cached id of the current user, for own-vs-other message styling.
let myUserId: string | null = null;
async function ensureMe(): Promise<string | null> {
  if (myUserId) return myUserId;
  const { status, data } = await api('/auth/me', 'GET');
  if (status === 200) myUserId = data?.user?.id ?? null;
  return myUserId;
}

// Cached rooms, used to know a room's type (direct chats hide sender names).
let roomsCache: Room[] | null = null;
async function ensureRooms(): Promise<Room[]> {
  if (roomsCache) return roomsCache;
  const { status, data } = await api('/me/chat-rooms', 'GET');
  const rooms: Room[] = status === 200 ? (data?.rooms ?? []) : [];
  roomsCache = rooms;
  return rooms;
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

// Message bubble. `is-own` right-aligns and highlights the current user's own
// messages (VK/Telegram style). Actions live in a popup menu opened from the ⋮
// button (desktop) or a long-press (mobile). `showName` is false in direct chats
// and for a run of consecutive messages from the same author (only the first
// shows the name); such grouped bubbles get the is-grouped class for tighter
// spacing.
function messageCard(m: Message, myId: string | null, showName: boolean, isDirect: boolean): string {
  const own = Boolean(myId && m.author_user_id === myId);
  const author = m.author_name || t('chats.real.you');
  // Avatars only for other people's messages in group chats, on the first of a
  // run (grouped ones keep the indent for alignment but omit the avatar).
  const avatarSlot = !isDirect && !own;
  const pinned = Boolean(m.is_pinned);
  const header = showName
    ? `<h3 class="bk-card-title">${esc(author)}</h3><div class="bk-meta">${esc(fmtTime(m.created_at))}</div>`
    : `<div class="bk-meta">${esc(fmtTime(m.created_at))}</div>`;
  return `<section class="bk-card bk-social-card bk-real-msg${own ? ' is-own' : ''}${showName ? '' : ' is-grouped'}`
    + `${avatarSlot ? ' has-avatar' : ''}${pinned ? ' is-pinned' : ''}"`
    + ` data-msg-id="${esc(m.id)}" data-msg-author="${esc(author)}" data-msg-body="${esc(m.body)}" data-msg-pinned="${pinned ? '1' : '0'}">`
    + (avatarSlot && showName ? avatarHtml(author) : '')
    + `<button class="bk-real-msg-menu" type="button" data-real-menu aria-haspopup="menu" aria-label="${esc(t('chats.real.actions'))}">⋯</button>`
    + `<div class="bk-card-header"><div class="bk-list-row-main">${header}`
    + (pinned ? `<span class="bk-real-pin" title="${esc(t('chats.real.pinned'))}">📌</span>` : '')
    + `</div></div>`
    + `<p class="bk-card-body">${esc(m.body)}</p></section>`;
}

async function populateRooms(list: HTMLElement): Promise<void> {
  const rooms = await ensureRooms();
  list.innerHTML = rooms.length
    ? rooms.map(roomRow).join('')
    : `<p class="bk-state-copy">${esc(t('chats.real.noRooms'))}</p>`;
}

async function populateThread(thread: HTMLElement, roomId: string): Promise<void> {
  const [myId, rooms, res] = await Promise.all([
    ensureMe(),
    ensureRooms(),
    api(`/chat-rooms/${encodeURIComponent(roomId)}/messages`, 'GET')
  ]);
  const { status, data } = res;
  const isDirect = rooms.find((r) => r.id === roomId)?.type === 'direct';

  // Replace only the message cards / chrome, never the sticky composer that the
  // native decorators moved into the thread (wiping it caused the overlap bug).
  thread.querySelectorAll('.bk-social-card, .bk-chat-stress-message, .bk-chat-unread-divider, .bk-chat-load-older, [data-real-empty], [data-real-error]')
    .forEach((el) => el.remove());

  let html: string;
  if (status !== 200) {
    html = `<p class="bk-state-copy" data-real-error data-tone="error">${esc(t('chats.real.loadError'))}</p>`;
  } else {
    const messages: Message[] = data?.messages ?? [];
    // Show the sender name only when it changes: hidden in direct chats, and for
    // a run of consecutive messages from the same author (name on the first).
    let prevAuthor: string | null = null;
    html = messages.length
      ? messages.map((m) => {
          const sameRun = Boolean(m.author_user_id) && m.author_user_id === prevAuthor;
          prevAuthor = m.author_user_id;
          return messageCard(m, myId, !isDirect && !sameRun, isDirect);
        }).join('')
      : `<p class="bk-state-copy" data-real-empty>${esc(t('chats.real.empty'))}</p>`;
  }

  const composer = thread.querySelector('.bk-chat-composer-inside-thread, [data-chat-composer]');
  if (composer) composer.insertAdjacentHTML('beforebegin', html);
  else thread.insertAdjacentHTML('beforeend', html);

  // Show the newest message: scroll the thread to the bottom (on open and after
  // sending), so a just-sent message isn't left hidden behind the composer.
  thread.scrollTop = thread.scrollHeight;
}

// The caller's role in the currently open room, for gating moderation actions.
let currentRoomId: string | null = null;
let currentRole: string | null = null;

// A header above the thread naming the room: for a direct chat the other
// person (avatar + name), for a group the room title + member count.
async function ensureRoomHeader(root: HTMLElement, roomId: string): Promise<void> {
  const card = root.querySelector<HTMLElement>('.bk-chat-room-card');
  if (!card) return;
  let header = card.querySelector<HTMLElement>('[data-real-chat-header]');
  if (header && header.dataset.room === roomId) return;
  if (!header) {
    header = document.createElement('div');
    header.className = 'bk-real-chat-header';
    header.setAttribute('data-real-chat-header', '');
    card.insertAdjacentElement('afterbegin', header);
  }
  header.dataset.room = roomId;

  const { status, data } = await api(`/chat-rooms/${encodeURIComponent(roomId)}`, 'GET');
  if (status !== 200) { header.remove(); return; }
  currentRoomId = roomId;
  currentRole = data?.my_role || null;

  const room = data?.room || {};
  const members: Array<{ display_name: string; is_self: boolean }> = data?.members ?? [];
  let name: string;
  let subtitle: string;
  if (room.type === 'direct') {
    const other = members.find((m) => !m.is_self) || members[0];
    name = other?.display_name || t('chats.direct');
    subtitle = t('chats.direct');
  } else {
    name = room.title || room.entity_name || room.event_title || t('chats.group');
    subtitle = `${room.member_count ?? members.length} · ${t('chats.group')}`;
  }
  header.innerHTML = avatarHtml(name, 'bk-real-ava-lg')
    + `<div class="bk-real-chat-header-main"><div class="bk-real-chat-header-title">${esc(name)}</div>`
    + `<div class="bk-meta">${esc(subtitle)}</div></div>`;
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
    void ensureRoomHeader(root, roomId);
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

// --- Message context menu (⋮ / long-press), VK/Telegram style ------------

type MenuMsg = { id: string; author: string; body: string; pinned: boolean };
let menuEl: HTMLElement | null = null;
let menuMsg: MenuMsg | null = null;

function getMenu(root: HTMLElement): HTMLElement {
  // The SPA replaces root.innerHTML on navigation, which detaches the menu;
  // recreate it when that happens.
  if (menuEl && menuEl.isConnected) return menuEl;
  const el = document.createElement('div');
  el.className = 'bk-real-menu';
  el.setAttribute('role', 'menu');
  el.hidden = true;
  root.appendChild(el);
  menuEl = el;
  return el;
}

function openMenu(root: HTMLElement, anchor: HTMLElement, msg: MenuMsg): void {
  const menu = getMenu(root);
  menuMsg = msg;
  // Build items per message: Pin/Unpin only for room moderators.
  const canPin = Boolean(currentRole && MODERATOR_ROLES.includes(currentRole) && currentRoomId === roomIdFromPath());
  const items = [
    `<button type="button" role="menuitem" data-menu-act="reply">↩ ${esc(t('chats.real.reply'))}</button>`,
    `<button type="button" role="menuitem" data-menu-act="copy">⧉ ${esc(t('chats.real.copy'))}</button>`,
    canPin ? `<button type="button" role="menuitem" data-menu-act="pin">📌 ${esc(msg.pinned ? t('chats.real.unpin') : t('chats.real.pin'))}</button>` : '',
    `<button type="button" role="menuitem" data-menu-act="report" class="is-danger">⚑ ${esc(t('chats.real.report'))}</button>`
  ].filter(Boolean);
  menu.innerHTML = items.join('');
  menu.hidden = false;
  const r = anchor.getBoundingClientRect();
  const mw = menu.offsetWidth || 200;
  const mh = menu.offsetHeight || 132;
  const left = Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8));
  let top = r.bottom + 6;
  if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function closeMenu(): void {
  if (menuEl) menuEl.hidden = true;
  menuMsg = null;
}

function replyTo(root: HTMLElement, author: string, body: string): void {
  const textarea = root.querySelector<HTMLTextAreaElement>('[data-chat-body]');
  if (!textarea) return;
  const quote = `> ${author}: ${body}\n`;
  if (!textarea.value.startsWith(quote)) textarea.value = quote + textarea.value;
  textarea.focus();
}

function msgFromEl(el: HTMLElement): MenuMsg {
  return {
    id: el.dataset.msgId || '',
    author: el.dataset.msgAuthor || '',
    body: el.dataset.msgBody || '',
    pinned: el.dataset.msgPinned === '1'
  };
}

async function pinMessage(root: HTMLElement, msg: MenuMsg): Promise<void> {
  const roomId = roomIdFromPath();
  if (!roomId || !msg.id) return;
  const { status } = await api(
    `/chat-rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(msg.id)}`,
    'PATCH',
    { pinned: !msg.pinned }
  );
  if (status === 200) {
    const thread = root.querySelector<HTMLElement>('[data-real-thread]');
    if (thread) await populateThread(thread, roomId);
  }
}

const LONG_PRESS_MS = 480;

export function initRealChat(root: HTMLElement): void {
  refresh(root);
  new MutationObserver(() => refresh(root)).observe(root, { childList: true, subtree: true });

  let longPressTimer: number | null = null;
  let suppressClick = false;
  const clearLongPress = () => { if (longPressTimer !== null) { window.clearTimeout(longPressTimer); longPressTimer = null; } };

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const menuItem = target.closest<HTMLElement>('[data-menu-act]');
    if (menuItem) {
      event.preventDefault();
      const act = menuItem.getAttribute('data-menu-act');
      const msg = menuMsg;
      closeMenu();
      if (msg && act === 'reply') replyTo(root, msg.author, msg.body);
      else if (msg && act === 'copy') navigator.clipboard?.writeText(msg.body).catch(() => {});
      else if (msg && act === 'pin') void pinMessage(root, msg);
      else if (act === 'report') navTo('/complaints/new');
      return;
    }
    const trigger = target.closest<HTMLElement>('[data-real-menu]');
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      const el = trigger.closest<HTMLElement>('.bk-real-msg');
      if (el) openMenu(root, trigger, msgFromEl(el));
      return;
    }
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
    // A click anywhere else (or the click that follows a long-press) closes the menu.
    if (menuEl && !menuEl.hidden && !suppressClick) closeMenu();
    suppressClick = false;
  });

  // Long-press a message bubble to open its menu on touch devices.
  root.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const el = target?.closest<HTMLElement>('.bk-real-msg');
    if (!el || target?.closest('[data-real-menu]')) return;
    clearLongPress();
    longPressTimer = window.setTimeout(() => {
      suppressClick = true;
      openMenu(root, el, msgFromEl(el));
    }, LONG_PRESS_MS);
  });
  root.addEventListener('pointerup', clearLongPress);
  root.addEventListener('pointercancel', clearLongPress);
  root.addEventListener('pointermove', clearLongPress);

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeMenu(); return; }
    if (event.key !== 'Enter') return;
    const target = event.target instanceof Element ? event.target : null;
    const nav = target?.closest<HTMLElement>('[data-real-room-nav]');
    if (nav) {
      event.preventDefault();
      const path = nav.getAttribute('data-path');
      if (path) navTo(path);
    }
  });

  // Close the menu when the thread scrolls (it is anchored to a message rect).
  root.addEventListener('scroll', () => { if (menuEl && !menuEl.hidden) closeMenu(); }, true);
}
