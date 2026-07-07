import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
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

// Fills the [data-real-event-create] host (rendered on /events for logged-in
// users) with a real create-event form backed by POST /events.
async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const { status, data } = await api('/entities');
  const entities: Array<{ id: string; name: string }> = status === 200 ? (data?.entities ?? []) : [];

  if (entities.length === 0) {
    host.innerHTML = `<section class="bk-card"><div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('events.real.title'))}</h3><span class="bk-badge">API</span></div><p class="bk-state-copy">${esc(t('events.real.noEntities'))}</p></section>`;
    return;
  }

  const options = entities.map((e) => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');
  host.innerHTML = `<section class="bk-card"><div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('events.real.title'))}</h3><span class="bk-badge bk-badge-positive">API</span></div>`
    + `<label class="bk-field"><span class="bk-label">${esc(t('events.real.entityLabel'))}</span><select class="bk-input" data-rec-field="entity">${options}</select></label>`
    + `<label class="bk-field"><span class="bk-label">${esc(t('events.real.titleLabel'))}</span><input class="bk-input" type="text" data-rec-field="title" /></label>`
    + `<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-rec-action="create">${esc(t('events.real.create'))}</button></div>`
    + `<p class="bk-state-copy" data-rec-message role="status"></p></section>`;
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-event-create]');
  if (host) void mount(host);
}

async function submitCreate(host: HTMLElement): Promise<void> {
  const entityId = host.querySelector<HTMLSelectElement>('[data-rec-field="entity"]')?.value || '';
  const title = (host.querySelector<HTMLInputElement>('[data-rec-field="title"]')?.value || '').trim();
  const msg = host.querySelector<HTMLElement>('[data-rec-message]');
  const setMsg = (text: string, tone: 'ok' | 'error') => { if (msg) { msg.textContent = text; msg.dataset.tone = tone; } };

  if (!title) {
    setMsg(t('events.real.titleRequired'), 'error');
    return;
  }
  // Disable the button while the POST is in flight to prevent double-submit.
  const btn = host.querySelector<HTMLButtonElement>('[data-rec-action="create"]');
  if (btn) btn.disabled = true;
  try {
    const { status, data } = await api('/events', { entity_id: entityId, title });
    if (status === 201) {
      setMsg(t('events.real.created'), 'ok');
      const input = host.querySelector<HTMLInputElement>('[data-rec-field="title"]');
      if (input) input.value = '';
    } else if (status === 403) {
      setMsg(t('events.real.forbidden'), 'error');
    } else {
      setMsg(data?.error?.message || 'error', 'error');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

export function initRealEventCreate(root: HTMLElement): void {
  maybeMount(root);
  // The SPA replaces innerHTML on navigation; re-mount when the host reappears.
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });

  root.addEventListener('click', (event) => {
    const btn = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-rec-action="create"]') : null;
    if (!btn) return;
    const host = btn.closest<HTMLElement>('[data-real-event-create]');
    if (!host) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void submitCreate(host);
  }, true);
}
