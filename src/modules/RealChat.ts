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

async function api(path: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<{ status: number; data: any }> {
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
type Message = {
  id: string; author_user_id: string | null; author_name: string | null;
  body: string; created_at: string; is_pinned?: boolean; edited_at?: string | null;
  reply_author?: string | null; reply_body?: string | null;
};

function excerpt(text: string, n = 80): string {
  const s = (text || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

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
  const replyRef = m.reply_author
    ? `<div class="bk-real-reply"><span class="bk-real-reply-author">${esc(m.reply_author)}</span>${esc(excerpt(m.reply_body || '', 90))}</div>`
    : '';
  const edited = m.edited_at ? ` <span class="bk-real-edited">(${esc(t('chats.real.edited'))})</span>` : '';
  return `<section class="bk-card bk-social-card bk-real-msg${own ? ' is-own' : ''}${showName ? '' : ' is-grouped'}`
    + `${avatarSlot ? ' has-avatar' : ''}${pinned ? ' is-pinned' : ''}"`
    + ` data-msg-id="${esc(m.id)}" data-msg-author="${esc(author)}" data-msg-body="${esc(m.body)}"`
    + ` data-msg-pinned="${pinned ? '1' : '0'}" data-msg-own="${own ? '1' : '0'}">`
    + (avatarSlot && showName ? avatarHtml(author) : '')
    + `<button class="bk-real-msg-menu" type="button" data-real-menu aria-haspopup="menu" aria-label="${esc(t('chats.real.actions'))}">⋯</button>`
    + `<div class="bk-card-header"><div class="bk-list-row-main">${header}`
    + (pinned ? `<span class="bk-real-pin" title="${esc(t('chats.real.pinned'))}">📌</span>` : '')
    + `</div></div>`
    + replyRef
    + `<p class="bk-card-body">${esc(m.body)}${edited}</p></section>`;
}

async function populateRooms(list: HTMLElement): Promise<void> {
  const rooms = await ensureRooms();
  list.innerHTML = rooms.length
    ? rooms.map(roomRow).join('')
    : `<p class="bk-state-copy">${esc(t('chats.real.noRooms'))}</p>`;
}

// A pinned-message bar under the header (like Telegram); click scrolls to it.
function updatePinnedBar(thread: HTMLElement, pinned: Message[]): void {
  const card = thread.closest<HTMLElement>('.bk-chat-room-card');
  if (!card) return;
  const header = card.querySelector<HTMLElement>('[data-real-chat-header]');
  let bar = card.querySelector<HTMLElement>('[data-real-pinned-bar]');
  if (!pinned.length) { bar?.remove(); return; }
  const last = pinned[pinned.length - 1];
  if (!bar) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bk-real-pinned-bar';
    btn.setAttribute('data-real-pinned-bar', '');
    if (header) header.insertAdjacentElement('afterend', btn);
    else card.insertAdjacentElement('afterbegin', btn);
    bar = btn;
  }
  bar.dataset.target = last.id;
  bar.innerHTML = `<span class="bk-real-pin">📌</span>`
    + `<span class="bk-real-pinned-text"><span class="bk-real-reply-author">${esc(t('chats.real.pinned'))}</span> ${esc(excerpt(last.body, 80))}</span>`;
}

// Signature of the rendered message set — id + edit time + pin flag per message.
// Lets the background poll (populateThread with pollGuard) skip the whole DOM swap
// when nothing changed, so it never flickers or fights the reader's scroll.
let lastThreadSig = '';

function threadSignature(messages: Message[]): string {
  return messages.map((m) => `${m.id}:${m.edited_at || ''}:${m.is_pinned ? 1 : 0}`).join('|');
}

// opts.pollGuard  — a background refresh: bail out unless the messages actually
//                   changed, and never clobber a loaded thread on a transient error.
// opts.preserveScroll — keep the reader where they are unless they're at the bottom.
async function populateThread(
  thread: HTMLElement,
  roomId: string,
  opts: { pollGuard?: boolean; preserveScroll?: boolean } = {}
): Promise<void> {
  const [myId, rooms, res] = await Promise.all([
    ensureMe(),
    ensureRooms(),
    api(`/chat-rooms/${encodeURIComponent(roomId)}/messages`, 'GET')
  ]);
  const { status, data } = res;
  const isDirect = rooms.find((r) => r.id === roomId)?.type === 'direct';

  // A background poll must never overwrite a good thread with an error, nor
  // re-render when nothing moved.
  if (opts.pollGuard && status !== 200) return;
  const messages: Message[] = status === 200 ? (data?.messages ?? []) : [];
  const sig = status === 200 ? threadSignature(messages) : '';
  if (opts.pollGuard && sig === lastThreadSig) return;

  // Capture scroll intent before the DOM changes: a reader scrolled up stays put;
  // one already at the bottom follows new messages down.
  const atBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 120;
  const prevTop = thread.scrollTop;

  // Replace only the message cards / chrome, never the sticky composer that the
  // native decorators moved into the thread (wiping it caused the overlap bug).
  thread.querySelectorAll('.bk-social-card, .bk-chat-stress-message, .bk-chat-unread-divider, .bk-chat-load-older, .bk-chat-pinned-strip, .bk-chat-date-divider, [data-real-empty], [data-real-error]')
    .forEach((el) => el.remove());

  let html: string;
  let pinned: Message[] = [];
  if (status !== 200) {
    html = `<p class="bk-state-copy" data-real-error data-tone="error">${esc(t('chats.real.loadError'))}</p>`;
  } else {
    pinned = messages.filter((m) => m.is_pinned);
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
  updatePinnedBar(thread, pinned);

  const composer = thread.querySelector('.bk-chat-composer-inside-thread, [data-chat-composer]');
  if (composer) composer.insertAdjacentHTML('beforebegin', html);
  else thread.insertAdjacentHTML('beforeend', html);
  lastThreadSig = sig;

  // On open/send/pin/delete, snap to the newest message. On a background poll,
  // only follow down if the reader was already at the bottom.
  if (opts.preserveScroll && !atBottom) thread.scrollTop = prevTop;
  else thread.scrollTop = thread.scrollHeight;
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

// Background polling for the open room — the sanctioned MVP mechanism for "new
// messages arrive" without realtime (Decisions: REST + explicit refresh OR
// periodic polling; WebSocket/SSE/presence stay post-MVP).
//
// The timer is a SINGLE persistent interval created in init, deliberately NOT
// driven by the MutationObserver: three observers watch `root` (this one, the
// composer placer, the empty-state decorator), and coupling a re-fetch to their
// churn produced a burst every time the thread re-rendered. The tick is a cheap
// no-op when no room is open.
const POLL_MS = 4000;

// Which room the thread currently shows — kept at module scope, NOT on the thread
// element: the decorators disturb the element's dataset during their cascade, and
// keying off that made `refresh` re-populate (and re-fetch) in a loop.
let populatedRoom: string | null = null;

async function pollTick(root: HTMLElement): Promise<void> {
  // Idle in a hidden tab; don't yank an open context menu out from under a tap.
  if (typeof document !== 'undefined' && document.hidden) return;
  if (menuEl && !menuEl.hidden) return;
  const roomId = roomIdFromPath();
  const thread = root.querySelector<HTMLElement>('[data-real-thread]');
  if (!roomId || !thread) return;
  await populateThread(thread, roomId, { pollGuard: true, preserveScroll: true });
}

function refresh(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') { populatedRoom = null; return; }

  root.querySelectorAll<HTMLElement>('[data-real-room-list]').forEach((list) => {
    if (list.dataset.realDone === '1') return;
    list.dataset.realDone = '1';
    void populateRooms(list);
  });

  const roomId = roomIdFromPath();
  const thread = root.querySelector<HTMLElement>('[data-real-thread]');
  if (thread && roomId) {
    // Only the first render per room. Decorator-driven mutations re-enter refresh
    // constantly; without a module-level guard each pass would re-populate.
    if (populatedRoom !== roomId) {
      populatedRoom = roomId;
      thread.dataset.realRoom = roomId;
      void ensureRoomHeader(root, roomId);
      void populateThread(thread, roomId);
    }
  } else {
    populatedRoom = null;
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
    let ok = false;
    if (composerMode?.kind === 'edit') {
      const { status } = await api(`/chat-rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(composerMode.id)}`, 'PATCH', { body: text });
      ok = status === 200;
    } else {
      const payload: Record<string, unknown> = { body: text };
      if (composerMode?.kind === 'reply') payload.reply_to_message_id = composerMode.id;
      const { status } = await api(`/chat-rooms/${encodeURIComponent(roomId)}/messages`, 'POST', payload);
      ok = status === 201;
    }
    if (ok) {
      if (textarea) textarea.value = '';
      setComposerMode(root, null);
      const thread = root.querySelector<HTMLElement>('[data-real-thread]');
      if (thread) await populateThread(thread, roomId);
    }
  } finally {
    btn.disabled = false;
  }
}

// --- Message context menu (⋮ / long-press), VK/Telegram style ------------

type MenuMsg = { id: string; author: string; body: string; pinned: boolean; own: boolean };
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
  // Build items per message: Edit only for your own; Pin and Delete for room
  // moderators (Delete also for your own).
  const isMod = Boolean(currentRole && MODERATOR_ROLES.includes(currentRole) && currentRoomId === roomIdFromPath());
  const items = [
    `<button type="button" role="menuitem" data-menu-act="reply">↩ ${esc(t('chats.real.reply'))}</button>`,
    `<button type="button" role="menuitem" data-menu-act="copy">⧉ ${esc(t('chats.real.copy'))}</button>`,
    msg.own ? `<button type="button" role="menuitem" data-menu-act="edit">✎ ${esc(t('chats.real.edit'))}</button>` : '',
    isMod ? `<button type="button" role="menuitem" data-menu-act="pin">📌 ${esc(msg.pinned ? t('chats.real.unpin') : t('chats.real.pin'))}</button>` : '',
    (msg.own || isMod) ? `<button type="button" role="menuitem" data-menu-act="delete" class="is-danger">🗑 ${esc(t('chats.real.delete'))}</button>` : '',
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

function msgFromEl(el: HTMLElement): MenuMsg {
  return {
    id: el.dataset.msgId || '',
    author: el.dataset.msgAuthor || '',
    body: el.dataset.msgBody || '',
    pinned: el.dataset.msgPinned === '1',
    own: el.dataset.msgOwn === '1'
  };
}

// The composer either sends a new message, replies to one, or edits one. This
// state drives the context banner above the input and how sendCurrent behaves.
type ComposerMode = { kind: 'reply'; id: string; author: string; body: string } | { kind: 'edit'; id: string };
let composerMode: ComposerMode | null = null;

function composerCard(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('[data-chat-send]')?.closest<HTMLElement>('.bk-chat-composer-card, section') || null;
}

function renderComposerContext(root: HTMLElement): void {
  const card = composerCard(root);
  if (!card) return;
  let banner = card.querySelector<HTMLElement>('[data-real-context]');
  if (!composerMode) { banner?.remove(); return; }
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'bk-real-ctx';
    banner.setAttribute('data-real-context', '');
    card.insertAdjacentElement('afterbegin', banner);
  }
  const label = composerMode.kind === 'reply' ? t('chats.real.replyingTo') : t('chats.real.editing');
  const detail = composerMode.kind === 'reply' ? `${esc(composerMode.author)}: ${esc(excerpt(composerMode.body, 70))}` : '';
  banner.innerHTML = `<div class="bk-real-ctx-main"><span class="bk-real-ctx-label">${esc(label)}</span>${detail}</div>`
    + `<button class="bk-real-ctx-clear" type="button" data-real-context-clear aria-label="${esc(t('chats.real.cancel'))}">×</button>`;
}

function setComposerMode(root: HTMLElement, mode: ComposerMode | null): void {
  composerMode = mode;
  renderComposerContext(root);
  const textarea = root.querySelector<HTMLTextAreaElement>('[data-chat-body]');
  if (mode?.kind === 'edit') {
    const el = root.querySelector<HTMLElement>(`.bk-real-msg[data-msg-id="${CSS.escape(mode.id)}"]`);
    if (textarea && el) textarea.value = el.dataset.msgBody || '';
  } else if (!mode && textarea) {
    // leave textarea as-is on cancel of reply; clear it when leaving edit handled by caller
  }
  textarea?.focus();
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

async function deleteMessage(root: HTMLElement, msg: MenuMsg): Promise<void> {
  const roomId = roomIdFromPath();
  if (!roomId || !msg.id) return;
  const { status } = await api(
    `/chat-rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(msg.id)}`,
    'DELETE'
  );
  if (status === 200) {
    const thread = root.querySelector<HTMLElement>('[data-real-thread]');
    if (thread) await populateThread(thread, roomId);
  }
}

// Chat-relevant report reasons (stable keys validated server-side; labels are
// localized here so the reason list is not English-only). The full reason
// catalogue lives in the backend for other surfaces.
const REPORT_REASONS = ['spam', 'harassment', 'threats', 'scam', 'suspicious_link', 'impersonation', 'other'];

// Repopulate the open context menu with a reason picker for the message being
// reported (keeps the same floating element, so no new UI/CSS is needed).
function openReportMenu(): void {
  if (!menuEl || !menuMsg) return;
  const items = REPORT_REASONS
    .map((key) => `<button type="button" role="menuitem" data-report-reason="${esc(key)}">${esc(t(`chats.report.reason.${key}`))}</button>`)
    .join('');
  menuEl.innerHTML = `<div class="bk-real-menu-note">${esc(t('chats.report.title'))}</div>${items}`;
  menuEl.hidden = false;
}

// Show a short confirmation inside the menu, then close it. Anchored to the
// reported message; no toast infrastructure required.
function menuNote(text: string): void {
  if (!menuEl) return;
  menuEl.innerHTML = `<div class="bk-real-menu-note">${esc(text)}</div>`;
  window.setTimeout(closeMenu, 1900);
}

async function submitReport(msg: MenuMsg, reasonKey: string): Promise<void> {
  if (!msg.id || !reasonKey) return;
  const { status } = await api('/reports', 'POST', {
    object_type: 'chat_message',
    object_id: msg.id,
    reason_key: reasonKey
  });
  // Spec user-facing behavior: confirm receipt, promise no specific outcome.
  menuNote(status === 201 ? t('chats.report.sent') : t('chats.report.error'));
}

const LONG_PRESS_MS = 480;

export function initRealChat(root: HTMLElement): void {
  refresh(root);
  new MutationObserver(() => refresh(root)).observe(root, { childList: true, subtree: true });
  // One persistent poll for the app's life; a no-op when no chat room is open.
  window.setInterval(() => { void pollTick(root); }, POLL_MS);

  let longPressTimer: number | null = null;
  let suppressClick = false;
  const clearLongPress = () => { if (longPressTimer !== null) { window.clearTimeout(longPressTimer); longPressTimer = null; } };

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    // A reason chosen from the report picker (menu stays open until then).
    const reasonBtn = target.closest<HTMLElement>('[data-report-reason]');
    if (reasonBtn) {
      event.preventDefault();
      const msg = menuMsg;
      if (msg) void submitReport(msg, reasonBtn.getAttribute('data-report-reason') || '');
      return;
    }

    const menuItem = target.closest<HTMLElement>('[data-menu-act]');
    if (menuItem) {
      event.preventDefault();
      const act = menuItem.getAttribute('data-menu-act');
      const msg = menuMsg;
      // Report swaps the menu for a reason picker in place; everything else closes it.
      if (act === 'report') { openReportMenu(); return; }
      closeMenu();
      if (msg && act === 'reply') setComposerMode(root, { kind: 'reply', id: msg.id, author: msg.author, body: msg.body });
      else if (msg && act === 'edit') setComposerMode(root, { kind: 'edit', id: msg.id });
      else if (msg && act === 'copy') navigator.clipboard?.writeText(msg.body).catch(() => {});
      else if (msg && act === 'pin') void pinMessage(root, msg);
      else if (msg && act === 'delete') void deleteMessage(root, msg);
      return;
    }
    const ctxClear = target.closest<HTMLElement>('[data-real-context-clear]');
    if (ctxClear) {
      event.preventDefault();
      const wasEdit = composerMode?.kind === 'edit';
      setComposerMode(root, null);
      const textarea = root.querySelector<HTMLTextAreaElement>('[data-chat-body]');
      if (wasEdit && textarea) textarea.value = '';
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
    const pinnedBar = target.closest<HTMLElement>('[data-real-pinned-bar]');
    if (pinnedBar) {
      event.preventDefault();
      const id = pinnedBar.dataset.target;
      const el = id ? root.querySelector<HTMLElement>(`.bk-real-msg[data-msg-id="${CSS.escape(id)}"]`) : null;
      const thread = el?.closest<HTMLElement>('.bk-chat-thread');
      if (el && thread) {
        // Scroll the thread only — scrollIntoView would also scroll the page and
        // push the header off-screen.
        const tr = thread.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        thread.scrollTo({ top: thread.scrollTop + (er.top - tr.top) - thread.clientHeight / 2 + er.height / 2, behavior: 'smooth' });
        el.classList.add('is-flash');
        window.setTimeout(() => el.classList.remove('is-flash'), 1200);
      }
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

  // Enter sends; Shift+Enter keeps the newline, and an in-progress IME composition
  // is never hijacked (Enter there commits the candidate, not the message).
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('[data-chat-body]')) return;
    const send = root.querySelector<HTMLButtonElement>('[data-chat-send]');
    if (!send) return;
    event.preventDefault();
    void sendCurrent(root, send);
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
