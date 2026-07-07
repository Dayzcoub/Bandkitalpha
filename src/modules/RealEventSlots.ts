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

type Profession = { key: string; label: string };
type Specialization = { key: string; profession_key: string; label: string };
type ResourceType = { key: string; label: string };
type Slot = {
  id: string; requirement: 'party' | 'resource';
  profession_key: string | null; profession_label: string | null;
  specialization_key: string | null; specialization_label: string | null;
  resource_type: string | null; count: number;
};

type State = {
  events: Array<{ id: string; title: string }>;
  professions: Profession[];
  specializations: Specialization[];
  resourceTypes: ResourceType[];
  eventId: string;
  slots: Slot[];
  requirement: 'party' | 'resource';
  pendingProfession: string;
  pendingSpecialization: string;
  pendingResource: string;
  pendingCount: number;
  message: string;
  tone: 'ok' | 'error' | '';
};

function slotTitle(slot: Slot): string {
  if (slot.requirement === 'resource') {
    return `${esc(slot.resource_type ?? '')} × ${slot.count}`;
  }
  const spec = slot.specialization_label ? ` · ${esc(slot.specialization_label)}` : '';
  return `${esc(slot.profession_label ?? slot.profession_key ?? '')}${spec} × ${slot.count}`;
}

function render(host: HTMLElement, state: State): void {
  const eventOptions = state.events
    .map((e) => `<option value="${esc(e.id)}"${e.id === state.eventId ? ' selected' : ''}>${esc(e.title)}</option>`)
    .join('');

  const reqRow = `<label class="bk-field"><span class="bk-label">${esc(t('events.slots.requirementLabel'))}</span>`
    + `<select class="bk-input" data-res-field="requirement">`
    + `<option value="party"${state.requirement === 'party' ? ' selected' : ''}>${esc(t('events.slots.requirementParty'))}</option>`
    + `<option value="resource"${state.requirement === 'resource' ? ' selected' : ''}>${esc(t('events.slots.requirementResource'))}</option>`
    + `</select></label>`;

  let detailFields: string;
  if (state.requirement === 'party') {
    const profOptions = state.professions
      .map((p) => `<option value="${esc(p.key)}"${p.key === state.pendingProfession ? ' selected' : ''}>${esc(p.label)}</option>`).join('');
    const specForPending = state.specializations.filter((s) => s.profession_key === state.pendingProfession);
    const specOptions = [`<option value="">${esc(t('events.slots.specializationNone'))}</option>`]
      .concat(specForPending.map((s) => `<option value="${esc(s.key)}"${s.key === state.pendingSpecialization ? ' selected' : ''}>${esc(s.label)}</option>`)).join('');
    detailFields = `<label class="bk-field"><span class="bk-label">${esc(t('events.slots.professionLabel'))}</span><select class="bk-input" data-res-field="profession">${profOptions}</select></label>`
      + `<label class="bk-field"><span class="bk-label">${esc(t('events.slots.specializationLabel'))}</span><select class="bk-input" data-res-field="specialization">${specOptions}</select></label>`;
  } else {
    const resOptions = state.resourceTypes
      .map((r) => `<option value="${esc(r.key)}"${r.key === state.pendingResource ? ' selected' : ''}>${esc(r.label)}</option>`).join('');
    detailFields = `<label class="bk-field"><span class="bk-label">${esc(t('events.slots.resourceLabel'))}</span><select class="bk-input" data-res-field="resource">${resOptions}</select></label>`;
  }

  const countField = `<label class="bk-field"><span class="bk-label">${esc(t('events.slots.countLabel'))}</span><input class="bk-input" type="number" min="1" value="${state.pendingCount}" data-res-field="count" /></label>`;

  const list = state.slots.length === 0
    ? `<p class="bk-state-copy">${esc(t('events.slots.empty'))}</p>`
    : `<div class="bk-list">${state.slots.map((slot) => `<div class="bk-list-row"><div class="bk-list-row-main"><span class="bk-list-row-title">${slotTitle(slot)}</span></div></div>`).join('')}</div>`;

  const noEvents = state.events.length === 0;
  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><div><h3 class="bk-card-title">${esc(t('events.slots.title'))}</h3><p class="bk-state-copy">${esc(t('events.slots.subtitle'))}</p></div><span class="bk-badge bk-badge-positive">API</span></div>`
    + (noEvents
      ? `<p class="bk-state-copy">${esc(t('events.slots.noEvents'))}</p>`
      : `<label class="bk-field"><span class="bk-label">${esc(t('events.slots.eventLabel'))}</span><select class="bk-input" data-res-field="event">${eventOptions}</select></label>`
        + list
        + `<div class="bk-field-row">${reqRow}${detailFields}${countField}<div class="bk-action-row"><button class="bk-button bk-button-secondary" type="button" data-res-action="add">${esc(t('events.slots.add'))}</button></div></div>`
        + `<p class="bk-state-copy" data-res-message role="status"${state.tone ? ` data-tone="${state.tone}"` : ''}>${esc(state.message)}</p>`)
    + `</section>`;
}

async function loadSlots(state: State): Promise<void> {
  if (!state.eventId) { state.slots = []; return; }
  const { status, data } = await api(`/events/${encodeURIComponent(state.eventId)}/slots`, 'GET');
  state.slots = status === 200 ? (data?.slots ?? []) : [];
}

async function addSlot(host: HTMLElement, state: State): Promise<void> {
  const body: Record<string, unknown> = { requirement: state.requirement, count: state.pendingCount };
  if (state.requirement === 'party') {
    body.profession_key = state.pendingProfession;
    if (state.pendingSpecialization) body.specialization_key = state.pendingSpecialization;
  } else {
    body.resource_type = state.pendingResource;
  }
  const { status, data } = await api(`/events/${encodeURIComponent(state.eventId)}/slots`, 'POST', body);
  if (status === 201) {
    state.message = t('events.slots.added'); state.tone = 'ok';
    await loadSlots(state);
  } else if (status === 403) {
    state.message = t('events.slots.forbidden'); state.tone = 'error';
  } else if (data?.error?.code === 'SPECIALIZATION_MISMATCH') {
    state.message = t('events.slots.mismatch'); state.tone = 'error';
  } else {
    state.message = t('events.slots.saveError'); state.tone = 'error';
  }
  render(host, state);
}

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const [tax, events] = await Promise.all([api('/taxonomy', 'GET'), api('/events', 'GET')]);
  if (tax.status !== 200 || events.status !== 200) {
    host.innerHTML = `<section class="bk-card"><h3 class="bk-card-title">${esc(t('events.slots.title'))}</h3><p class="bk-state-copy" data-tone="error">${esc(t('events.slots.loadError'))}</p></section>`;
    return;
  }

  const professions: Profession[] = tax.data?.professions ?? [];
  const resourceTypes: ResourceType[] = tax.data?.resource_types ?? [];
  const evs = events.data?.events ?? [];
  const state: State = {
    events: evs,
    professions,
    specializations: tax.data?.specializations ?? [],
    resourceTypes,
    eventId: evs[0]?.id ?? '',
    slots: [],
    requirement: 'party',
    pendingProfession: professions[0]?.key ?? '',
    pendingSpecialization: '',
    pendingResource: resourceTypes[0]?.key ?? '',
    pendingCount: 1,
    message: '',
    tone: ''
  };
  await loadSlots(state);

  host.addEventListener('change', (event) => {
    const el = event.target as HTMLElement;
    const field = el.getAttribute?.('data-res-field');
    if (!field) return;
    const value = (el as HTMLSelectElement | HTMLInputElement).value;
    if (field === 'event') { state.eventId = value; state.message = ''; state.tone = ''; void loadSlots(state).then(() => render(host, state)); return; }
    if (field === 'requirement') { state.requirement = value === 'resource' ? 'resource' : 'party'; render(host, state); return; }
    if (field === 'profession') { state.pendingProfession = value; state.pendingSpecialization = ''; render(host, state); return; }
    if (field === 'specialization') { state.pendingSpecialization = value; return; }
    if (field === 'resource') { state.pendingResource = value; return; }
    if (field === 'count') { const n = Number(value); state.pendingCount = Number.isInteger(n) && n > 0 ? n : 1; }
  });

  host.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const action = target?.closest<HTMLElement>('[data-res-action="add"]');
    if (!action) return;
    event.preventDefault();
    if (!state.eventId) return;
    // Prevent double-submit while the POST is in flight; render() restores it.
    (action as HTMLButtonElement).disabled = true;
    void addSlot(host, state);
  });

  render(host, state);
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-event-slots]');
  if (host) void mount(host);
}

export function initRealEventSlots(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
