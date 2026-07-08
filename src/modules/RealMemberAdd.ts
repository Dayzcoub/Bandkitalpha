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

// Fills the [data-real-member-add] host (rendered on /bands for logged-in users)
// with a real add-member form backed by POST /entities/:id/members.
async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const { status, data } = await api('/entities');
  const entities: Array<{ id: string; name: string }> = status === 200 ? (data?.entities ?? []) : [];

  if (entities.length === 0) {
    host.innerHTML = `<section class="bk-card"><div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('bands.member.title'))}</h3></div><p class="bk-state-copy">${esc(t('bands.member.noEntities'))}</p></section>`;
    return;
  }

  const options = entities.map((e) => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');
  host.innerHTML = `<section class="bk-card"><div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('bands.member.title'))}</h3></div>`
    + `<label class="bk-field"><span class="bk-label">${esc(t('bands.member.entityLabel'))}</span><select class="bk-input" data-rma-field="entity">${options}</select></label>`
    + `<label class="bk-field"><span class="bk-label">${esc(t('bands.member.emailLabel'))}</span><input class="bk-input" type="email" data-rma-field="email" autocomplete="email" /></label>`
    + `<label class="bk-field"><span class="bk-label">${esc(t('bands.member.roleLabel'))}</span><select class="bk-input" data-rma-field="role"><option value="member">${esc(t('bands.member.roleMember'))}</option><option value="guest">${esc(t('bands.member.roleGuest'))}</option></select></label>`
    + `<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-rma-action="add">${esc(t('bands.member.add'))}</button></div>`
    + `<p class="bk-state-copy" data-rma-message role="status"></p></section>`;
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-member-add]');
  if (host) void mount(host);
}

async function submitAdd(host: HTMLElement): Promise<void> {
  const entityId = host.querySelector<HTMLSelectElement>('[data-rma-field="entity"]')?.value || '';
  const email = (host.querySelector<HTMLInputElement>('[data-rma-field="email"]')?.value || '').trim();
  const role = host.querySelector<HTMLSelectElement>('[data-rma-field="role"]')?.value || 'member';
  const msg = host.querySelector<HTMLElement>('[data-rma-message]');
  const setMsg = (text: string, tone: 'ok' | 'error') => { if (msg) { msg.textContent = text; msg.dataset.tone = tone; } };

  if (!email) {
    setMsg(t('bands.member.emailRequired'), 'error');
    return;
  }
  // Disable the button while the POST is in flight to prevent double-submit.
  const btn = host.querySelector<HTMLButtonElement>('[data-rma-action="add"]');
  if (btn) btn.disabled = true;
  try {
    const { status, data } = await api(`/entities/${encodeURIComponent(entityId)}/members`, { email, role });
    if (status === 201) {
      setMsg(t('bands.member.added'), 'ok');
      const input = host.querySelector<HTMLInputElement>('[data-rma-field="email"]');
      if (input) input.value = '';
    } else if (status === 403) {
      setMsg(t('bands.member.forbidden'), 'error');
    } else if (status === 404) {
      setMsg(t('bands.member.notFound'), 'error');
    } else if (status === 409) {
      setMsg(t('bands.member.already'), 'error');
    } else {
      setMsg(data?.error?.message || 'error', 'error');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

export function initRealMemberAdd(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });

  root.addEventListener('click', (event) => {
    const btn = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-rma-action="add"]') : null;
    if (!btn) return;
    const host = btn.closest<HTMLElement>('[data-real-member-add]');
    if (!host) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void submitAdd(host);
  }, true);
}
