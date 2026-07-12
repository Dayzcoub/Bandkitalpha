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

type Reason = { key: string; label: string };
type RelRow = {
  id: string; type_label: string; polarity: string;
  reason_label: string | null; note: string | null; event_title: string | null;
  disputed: boolean; dispute_state: string | null;
};

type State = {
  records: RelRow[];
  reasons: Reason[];
  openDisputeFor: string;
  pendingReason: string;
  message: string;
  tone: 'ok' | 'error' | '';
};

// A subject-facing dispute form for one record: pick an optional reason, add an
// optional statement, submit. Reuses shared field/button primitives (no new CSS).
function disputeForm(state: State, recordId: string): string {
  const reasonOptions = [`<option value="">${esc(t('profile.reliability.reasonNone'))}</option>`]
    .concat(state.reasons.map((r) => `<option value="${esc(r.key)}"${r.key === state.pendingReason ? ' selected' : ''}>${esc(r.label)}</option>`)).join('');
  return `<div class="bk-field-row">`
    + `<label class="bk-field"><span class="bk-label">${esc(t('profile.reliability.reasonLabel'))}</span><select class="bk-input" data-dispute-reason>${reasonOptions}</select></label>`
    + `<label class="bk-field"><span class="bk-label">${esc(t('profile.reliability.noteLabel'))}</span><input class="bk-input" type="text" maxlength="2000" data-dispute-note /></label>`
    + `<div class="bk-action-row">`
    + `<button class="bk-button bk-button-secondary" type="button" data-submit-dispute data-rel-id="${esc(recordId)}">${esc(t('profile.reliability.submitDispute'))}</button>`
    + `<button class="bk-button bk-button-ghost" type="button" data-cancel-dispute>${esc(t('profile.reliability.cancel'))}</button>`
    + `</div></div>`;
}

function render(host: HTMLElement, state: State): void {
  const body = state.records.length === 0
    ? `<p class="bk-state-copy">${esc(t('profile.reliability.empty'))}</p>`
    : `<div class="bk-list">${state.records.map((r) => {
        const parts: string[] = [];
        if (r.event_title) parts.push(esc(r.event_title));
        if (r.reason_label) parts.push(esc(r.reason_label));
        if (r.dispute_state) parts.push(esc(t(`profile.reliability.disputeState.${r.dispute_state}`)));
        else if (r.disputed) parts.push(esc(t('profile.reliability.disputedBadge')));
        if (r.note) parts.push(esc(r.note));
        const meta = parts.length ? `<span class="bk-state-copy">${parts.join(' · ')}</span>` : '';
        // The subject can open a dispute only on a record that has none yet.
        const action = !r.dispute_state
          ? (state.openDisputeFor === r.id
            ? disputeForm(state, r.id)
            : `<div class="bk-action-row"><button class="bk-button bk-button-secondary" type="button" data-open-dispute="${esc(r.id)}">${esc(t('profile.reliability.dispute'))}</button></div>`)
          : '';
        return `<div class="bk-list-row"><div class="bk-list-row-main">`
          + `<span class="bk-list-row-title">${esc(r.type_label)}</span>${meta}${action}</div></div>`;
      }).join('')}</div>`;

  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><div><h3 class="bk-card-title">${esc(t('profile.reliability.title'))}</h3><p class="bk-state-copy">${esc(t('profile.reliability.subtitle'))}</p></div></div>`
    + body
    + `<p class="bk-state-copy" data-rel-message role="status"${state.tone ? ` data-tone="${state.tone}"` : ''}>${esc(state.message)}</p>`
    + `</section>`;
}

async function load(state: State): Promise<void> {
  const [mine, cat] = await Promise.all([api('/me/reliability', 'GET'), api('/reliability/event-types', 'GET')]);
  state.records = mine.status === 200 ? (mine.data?.reliability_events ?? []) : [];
  state.reasons = cat.status === 200 ? (cat.data?.reasons ?? []) : [];
}

async function submitDispute(host: HTMLElement, state: State, recordId: string): Promise<void> {
  const noteEl = host.querySelector<HTMLInputElement>('[data-dispute-note]');
  const body: Record<string, unknown> = {};
  if (state.pendingReason) body.reason_key = state.pendingReason;
  const note = noteEl?.value.trim();
  if (note) body.note = note;
  const { status, data } = await api(`/reliability-events/${encodeURIComponent(recordId)}/dispute`, 'POST', body);
  if (status === 201) {
    state.message = t('profile.reliability.disputeOpened'); state.tone = 'ok';
    state.openDisputeFor = '';
    await load(state);
  } else {
    state.message = data?.error?.message || t('profile.reliability.disputeError'); state.tone = 'error';
  }
  render(host, state);
}

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const state: State = { records: [], reasons: [], openDisputeFor: '', pendingReason: '', message: '', tone: '' };
  await load(state);

  host.addEventListener('change', (event) => {
    const el = event.target as HTMLElement;
    if (el.hasAttribute?.('data-dispute-reason')) {
      state.pendingReason = (el as HTMLSelectElement).value;
    }
  });

  host.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const openBtn = target?.closest<HTMLElement>('[data-open-dispute]');
    if (openBtn) {
      event.preventDefault();
      state.openDisputeFor = openBtn.getAttribute('data-open-dispute') || '';
      state.pendingReason = '';
      render(host, state);
      return;
    }
    if (target?.closest('[data-cancel-dispute]')) {
      event.preventDefault();
      state.openDisputeFor = '';
      render(host, state);
      return;
    }
    const submitBtn = target?.closest<HTMLElement>('[data-submit-dispute]');
    if (submitBtn) {
      event.preventDefault();
      (submitBtn as HTMLButtonElement).disabled = true;
      void submitDispute(host, state, submitBtn.getAttribute('data-rel-id') || '');
    }
  });

  render(host, state);
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-my-reliability]');
  if (host) void mount(host);
}

export function initRealMyReliability(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
