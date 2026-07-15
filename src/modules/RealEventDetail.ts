import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

async function api(path: string): Promise<{ status: number; data: any }> {
  try {
    const res = await fetch(`/api/v1${path}`, { credentials: 'same-origin' });
    let data: any = null;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

type EventRow = {
  id: string; title: string; description: string | null; status: string; location: string | null;
  starts_at: string | null; ends_at: string | null;
  entity_id: string | null; entity_name: string | null; entity_slug: string | null;
  participant_count: number;
};
type Slot = {
  id: string; requirement: string; profession_label: string | null; specialization_label: string | null;
  resource_type: string | null; count: number;
};
type Engagement = {
  id: string; status_key: string; status_label: string;
  counterparty_user: string | null; counterparty_entity: string | null; counterparty_kind: string;
};
type State = {
  event: EventRow | null; canManage: boolean;
  slots: Slot[]; engagements: Engagement[];
  notFound: boolean;
};

function navigateTo(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function slotLabel(s: Slot): string {
  if (s.requirement === 'resource') return `${s.resource_type ?? ''} × ${s.count}`;
  const spec = s.specialization_label ? ` · ${s.specialization_label}` : '';
  return `${s.profession_label ?? ''}${spec} × ${s.count}`;
}

function render(host: HTMLElement, state: State): void {
  if (state.notFound) {
    host.innerHTML = `<section class="bk-card"><p class="bk-state-copy" data-tone="error">${esc(t('eventDetail.notFound'))}</p></section>`;
    return;
  }
  const e = state.event;
  if (!e) { host.innerHTML = `<section class="bk-card"><p class="bk-state-copy">${esc(t('eventDetail.loading'))}</p></section>`; return; }

  const meta: string[] = [esc(t(`eventDetail.status.${e.status}`))];
  if (e.starts_at) meta.push(esc(new Date(e.starts_at).toLocaleString()));
  if (e.location) meta.push(esc(e.location));
  meta.push(`${e.participant_count} ${esc(t('events.list.participants'))}`);

  const entityLink = e.entity_name
    ? `<div class="bk-action-row"><button class="bk-button bk-button-ghost" type="button" data-ev-entity="${esc(e.entity_slug || e.entity_id || '')}">${esc(e.entity_name)}</button></div>`
    : '';

  const slots = state.slots.length === 0
    ? `<p class="bk-state-copy">${esc(t('eventDetail.noSlots'))}</p>`
    : `<div class="bk-list">${state.slots.map((s) => `<div class="bk-list-row"><div class="bk-list-row-main">`
        + `<span class="bk-list-row-title">${esc(slotLabel(s))}</span>`
        + `<span class="bk-state-copy">${esc(t(`eventDetail.requirement.${s.requirement}`))}</span>`
        + `</div></div>`).join('')}</div>`;

  // The roster is manager-only on the backend; only ask for it when we may see it.
  const roster = state.canManage
    ? `<div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('eventDetail.rosterTitle'))}</h3></div>`
      + (state.engagements.length === 0
        ? `<p class="bk-state-copy">${esc(t('eventDetail.noEngagements'))}</p>`
        : `<div class="bk-list">${state.engagements.map((g) => `<div class="bk-list-row"><div class="bk-list-row-main">`
            + `<span class="bk-list-row-title">${esc(g.counterparty_user ?? g.counterparty_entity ?? g.counterparty_kind)}</span>`
            + `<span class="bk-state-copy">${esc(g.status_label)}</span>`
            + `</div></div>`).join('')}</div>`)
    : '';

  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><div><h2 class="bk-title">${esc(e.title)}</h2><p class="bk-state-copy">${meta.join(' · ')}</p></div></div>`
    + (e.description ? `<p class="bk-card-body">${esc(e.description)}</p>` : '')
    + entityLink
    + `<div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('eventDetail.slotsTitle'))}</h3></div>`
    + slots
    + roster
    + `</section>`;
}

async function load(state: State, eventId: string): Promise<void> {
  const { status, data } = await api(`/events/${encodeURIComponent(eventId)}`);
  if (status !== 200) { state.notFound = true; return; }
  state.event = data.event;
  state.canManage = Boolean(data.can_manage);
  const slots = await api(`/events/${encodeURIComponent(eventId)}/slots`);
  state.slots = slots.status === 200 ? (slots.data?.slots ?? []) : [];
  if (state.canManage) {
    const eng = await api(`/events/${encodeURIComponent(eventId)}/engagements`);
    state.engagements = eng.status === 200 ? (eng.data?.engagements ?? []) : [];
  }
}

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';
  const eventId = host.getAttribute('data-real-event-detail') || '';
  const state: State = { event: null, canManage: false, slots: [], engagements: [], notFound: false };

  host.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-ev-entity]') : null;
    if (!link) return;
    event.preventDefault();
    navigateTo(`/bands/${link.getAttribute('data-ev-entity')}`);
  });

  await load(state, eventId);
  render(host, state);
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-event-detail]');
  if (host) void mount(host);
}

export function initRealEventDetail(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
