import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
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

type Room = { id: string; title: string | null; type: string; member_status: string; entity_name: string | null; event_title: string | null };
type Message = { id: string; author_user_id: string | null; author_name: string | null; body: string; created_at: string };

type State = {
  rooms: Room[];
  roomId: string;
  messages: Message[];
  message: string;
  tone: 'ok' | 'error' | '';
};

function roomLabel(r: Room): string {
  return r.title || r.entity_name || r.event_title || r.type;
}

function currentRoom(state: State): Room | undefined {
  return state.rooms.find((r) => r.id === state.roomId);
}

function render(host: HTMLElement, state: State): void {
  if (state.rooms.length === 0) {
    host.innerHTML = `<section class="bk-card"><div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('chats.real.title'))}</h3><span class="bk-badge bk-badge-positive">API</span></div>`
      + `<p class="bk-state-copy">${esc(t('chats.real.noRooms'))}</p></section>`;
    return;
  }

  const roomOptions = state.rooms
    .map((r) => `<option value="${esc(r.id)}"${r.id === state.roomId ? ' selected' : ''}>${esc(roomLabel(r))}</option>`).join('');

  const list = state.messages.length === 0
    ? `<p class="bk-state-copy">${esc(t('chats.real.empty'))}</p>`
    : `<div class="bk-list">${state.messages.map((m) => `<div class="bk-list-row"><div class="bk-list-row-main">`
        + `<div class="bk-label">${esc(m.author_name || t('chats.real.you'))}</div>`
        + `<div class="bk-list-row-title">${esc(m.body)}</div></div></div>`).join('')}</div>`;

  const readOnly = currentRoom(state)?.member_status === 'read_only';
  const composer = readOnly
    ? `<p class="bk-state-copy" data-tone="error">${esc(t('chats.real.readOnly'))}</p>`
    : `<label class="bk-field"><span class="bk-label">${esc(t('chats.composer'))}</span>`
      + `<textarea class="bk-textarea" data-chat-input placeholder="${esc(t('chats.real.placeholder'))}"></textarea></label>`
      + `<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-chat-action="send">${esc(t('chats.send'))}</button></div>`;

  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('chats.real.title'))}</h3><span class="bk-badge bk-badge-positive">API</span></div>`
    + `<label class="bk-field"><span class="bk-label">${esc(t('chats.real.roomLabel'))}</span><select class="bk-input" data-chat-field="room">${roomOptions}</select></label>`
    + list + composer
    + `<p class="bk-state-copy" data-chat-message role="status"${state.tone ? ` data-tone="${state.tone}"` : ''}>${esc(state.message)}</p>`
    + `</section>`;
}

async function loadMessages(state: State): Promise<void> {
  state.messages = [];
  if (!state.roomId) return;
  const { status, data } = await api(`/chat-rooms/${encodeURIComponent(state.roomId)}/messages`, 'GET');
  state.messages = status === 200 ? (data?.messages ?? []) : [];
}

async function send(host: HTMLElement, state: State): Promise<void> {
  const input = host.querySelector<HTMLTextAreaElement>('[data-chat-input]');
  const text = (input?.value || '').trim();
  if (!text) return;
  const { status, data } = await api(`/chat-rooms/${encodeURIComponent(state.roomId)}/messages`, 'POST', { body: text });
  if (status === 201) {
    state.message = t('chats.real.sent'); state.tone = 'ok';
    await loadMessages(state);
  } else {
    state.message = data?.error?.message || t('chats.real.sendError'); state.tone = 'error';
  }
  render(host, state);
}

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const { status, data } = await api('/me/chat-rooms', 'GET');
  if (status !== 200) {
    host.innerHTML = `<section class="bk-card"><h3 class="bk-card-title">${esc(t('chats.real.title'))}</h3><p class="bk-state-copy" data-tone="error">${esc(t('chats.real.loadError'))}</p></section>`;
    return;
  }

  const rooms: Room[] = data?.rooms ?? [];
  const state: State = { rooms, roomId: rooms[0]?.id ?? '', messages: [], message: '', tone: '' };
  await loadMessages(state);

  host.addEventListener('change', (event) => {
    const el = event.target as HTMLElement;
    if (el.getAttribute?.('data-chat-field') === 'room') {
      state.roomId = (el as HTMLSelectElement).value;
      state.message = ''; state.tone = '';
      void loadMessages(state).then(() => render(host, state));
    }
  });

  host.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const btn = target?.closest<HTMLElement>('[data-chat-action="send"]');
    if (!btn) return;
    event.preventDefault();
    // Prevent double-send while the POST is in flight; render() restores it.
    (btn as HTMLButtonElement).disabled = true;
    void send(host, state);
  });

  render(host, state);
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-chat]');
  if (host) void mount(host);
}

export function initRealChatPanel(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
