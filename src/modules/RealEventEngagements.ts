import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
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

type Candidate = { party_id: string; kind: string; label: string; subtitle: string };
type Status = { key: string; label: string; is_terminal: boolean };
type SlotOpt = { id: string; label: string };
type Engagement = {
  id: string; slot_id: string | null; status_key: string;
  counterparty_kind: string; counterparty_user: string | null; counterparty_entity: string | null;
};

type State = {
  events: Array<{ id: string; title: string }>;
  candidates: Candidate[];
  statuses: Status[];
  eventId: string;
  forbidden: boolean;
  engagements: Engagement[];
  slotOptions: SlotOpt[];
  pendingCounterparty: string;
  pendingSlot: string;
  message: string;
  tone: 'ok' | 'error' | '';
};

function counterpartyLabel(e: Engagement): string {
  return esc(e.counterparty_user ?? e.counterparty_entity ?? e.counterparty_kind);
}

function render(host: HTMLElement, state: State): void {
  const eventOptions = state.events
    .map((e) => `<option value="${esc(e.id)}"${e.id === state.eventId ? ' selected' : ''}>${esc(e.title)}</option>`).join('');

  let inner: string;
  if (state.events.length === 0) {
    inner = `<p class="bk-state-copy">${esc(t('events.engagements.noEvents'))}</p>`;
  } else if (state.forbidden) {
    inner = `<label class="bk-field"><span class="bk-label">${esc(t('events.engagements.eventLabel'))}</span><select class="bk-input" data-eng-field="event">${eventOptions}</select></label>`
      + `<p class="bk-state-copy" data-tone="error">${esc(t('events.engagements.forbidden'))}</p>`;
  } else {
    const list = state.engagements.length === 0
      ? `<p class="bk-state-copy">${esc(t('events.engagements.empty'))}</p>`
      : `<div class="bk-list">${state.engagements.map((e) => {
          const statusOptions = state.statuses
            .map((s) => `<option value="${esc(s.key)}"${s.key === e.status_key ? ' selected' : ''}>${esc(s.label)}</option>`).join('');
          // Title and status select stack inside row-main so the select takes the
          // full row width instead of squeezing the counterparty name.
          return `<div class="bk-list-row"><div class="bk-list-row-main"><span class="bk-list-row-title">${counterpartyLabel(e)}</span>`
            + `<label class="bk-field"><span class="bk-label">${esc(t('events.engagements.statusLabel'))}</span><select class="bk-select" data-eng-status="${esc(e.id)}">${statusOptions}</select></label>`
            + `</div></div>`;
        }).join('')}</div>`;

    const candOptions = state.candidates
      .map((c) => `<option value="${esc(c.party_id)}"${c.party_id === state.pendingCounterparty ? ' selected' : ''}>${esc(c.label)} · ${esc(c.subtitle)}</option>`).join('');
    const slotOptions = [`<option value="">${esc(t('events.engagements.slotNone'))}</option>`]
      .concat(state.slotOptions.map((s) => `<option value="${esc(s.id)}"${s.id === state.pendingSlot ? ' selected' : ''}>${esc(s.label)}</option>`)).join('');

    const addForm = state.candidates.length === 0
      ? `<p class="bk-state-copy">${esc(t('events.engagements.noCandidates'))}</p>`
      : `<div class="bk-field-row">`
        + `<label class="bk-field"><span class="bk-label">${esc(t('events.engagements.counterpartyLabel'))}</span><select class="bk-input" data-eng-field="counterparty">${candOptions}</select></label>`
        + `<label class="bk-field"><span class="bk-label">${esc(t('events.engagements.slotLabel'))}</span><select class="bk-input" data-eng-field="slot">${slotOptions}</select></label>`
        + `<div class="bk-action-row"><button class="bk-button bk-button-secondary" type="button" data-eng-action="create">${esc(t('events.engagements.create'))}</button></div>`
        + `</div>`;

    inner = `<label class="bk-field"><span class="bk-label">${esc(t('events.engagements.eventLabel'))}</span><select class="bk-input" data-eng-field="event">${eventOptions}</select></label>`
      + list + addForm
      + `<p class="bk-state-copy" data-eng-message role="status"${state.tone ? ` data-tone="${state.tone}"` : ''}>${esc(state.message)}</p>`;
  }

  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><div><h3 class="bk-card-title">${esc(t('events.engagements.title'))}</h3><p class="bk-state-copy">${esc(t('events.engagements.subtitle'))}</p></div></div>`
    + inner + `</section>`;
}

function slotLabelText(slot: any): string {
  if (slot.requirement === 'resource') return `${slot.resource_type ?? ''} × ${slot.count}`;
  const spec = slot.specialization_label ? ` · ${slot.specialization_label}` : '';
  return `${slot.profession_label ?? slot.profession_key ?? ''}${spec} × ${slot.count}`;
}

async function loadEvent(state: State): Promise<void> {
  state.forbidden = false;
  state.engagements = [];
  state.slotOptions = [];
  if (!state.eventId) return;
  const [eng, slots] = await Promise.all([
    api(`/events/${encodeURIComponent(state.eventId)}/engagements`, 'GET'),
    api(`/events/${encodeURIComponent(state.eventId)}/slots`, 'GET')
  ]);
  if (eng.status === 403) { state.forbidden = true; return; }
  state.engagements = eng.status === 200 ? (eng.data?.engagements ?? []) : [];
  state.slotOptions = slots.status === 200 ? (slots.data?.slots ?? []).map((s: any) => ({ id: s.id, label: slotLabelText(s) })) : [];
  state.pendingSlot = '';
}

async function createEngagement(host: HTMLElement, state: State): Promise<void> {
  if (!state.pendingCounterparty) return;
  const body: Record<string, unknown> = { counterparty_party_id: state.pendingCounterparty };
  if (state.pendingSlot) body.slot_id = state.pendingSlot;
  const { status, data } = await api(`/events/${encodeURIComponent(state.eventId)}/engagements`, 'POST', body);
  if (status === 201) {
    state.message = t('events.engagements.created'); state.tone = 'ok';
    await loadEvent(state);
  } else if (status === 403) {
    state.message = t('events.engagements.forbidden'); state.tone = 'error';
  } else {
    state.message = data?.error?.message || t('events.engagements.saveError'); state.tone = 'error';
  }
  render(host, state);
}

async function changeStatus(host: HTMLElement, state: State, engagementId: string, statusKey: string): Promise<void> {
  const { status, data } = await api(`/events/${encodeURIComponent(state.eventId)}/engagements/${encodeURIComponent(engagementId)}`, 'PATCH', { status_key: statusKey });
  if (status === 200) {
    state.message = t('events.engagements.statusChanged'); state.tone = 'ok';
    await loadEvent(state);
  } else {
    state.message = data?.error?.message || t('events.engagements.saveError'); state.tone = 'error';
  }
  render(host, state);
}

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const [events, cands, tax] = await Promise.all([
    api('/events', 'GET'), api('/parties/candidates', 'GET'), api('/taxonomy', 'GET')
  ]);
  if (events.status !== 200 || cands.status !== 200 || tax.status !== 200) {
    host.innerHTML = `<section class="bk-card"><h3 class="bk-card-title">${esc(t('events.engagements.title'))}</h3><p class="bk-state-copy" data-tone="error">${esc(t('events.engagements.loadError'))}</p></section>`;
    return;
  }

  const evs = events.data?.events ?? [];
  const candidates: Candidate[] = cands.data?.candidates ?? [];
  const state: State = {
    events: evs,
    candidates,
    statuses: tax.data?.engagement_statuses ?? [],
    eventId: evs[0]?.id ?? '',
    forbidden: false,
    engagements: [],
    slotOptions: [],
    pendingCounterparty: candidates[0]?.party_id ?? '',
    pendingSlot: '',
    message: '',
    tone: ''
  };
  await loadEvent(state);

  host.addEventListener('change', (event) => {
    const el = event.target as HTMLElement;
    const statusFor = el.getAttribute?.('data-eng-status');
    if (statusFor) { (el as HTMLSelectElement).disabled = true; void changeStatus(host, state, statusFor, (el as HTMLSelectElement).value); return; }
    const field = el.getAttribute?.('data-eng-field');
    if (!field) return;
    const value = (el as HTMLSelectElement).value;
    if (field === 'event') { state.eventId = value; state.message = ''; state.tone = ''; void loadEvent(state).then(() => render(host, state)); return; }
    if (field === 'counterparty') { state.pendingCounterparty = value; return; }
    if (field === 'slot') { state.pendingSlot = value; return; }
  });

  host.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const createBtn = target?.closest<HTMLElement>('[data-eng-action="create"]');
    if (!createBtn) return;
    event.preventDefault();
    // Prevent double-submit while the POST is in flight; render() restores it.
    (createBtn as HTMLButtonElement).disabled = true;
    void createEngagement(host, state);
  });

  render(host, state);
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-event-engagements]');
  if (host) void mount(host);
}

export function initRealEventEngagements(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
