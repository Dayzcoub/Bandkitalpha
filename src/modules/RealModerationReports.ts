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

// The practical triage transitions (the full case machine lives in the backend).
const STATES = ['created', 'triage', 'in_review', 'action_required', 'resolved', 'rejected', 'closed'];
// Case actions offered in the detail view; hide_content only fits chat messages.
const ACTIONS = ['warning', 'hide_content', 'restrict_user', 'suspend_user'];

type Report = {
  id: string; object_type: string; object_type_label: string; object_id: string | null;
  reason_label: string; state_key: string; details: string | null;
  reporter_name: string | null; created_at: string;
};
type CaseAction = { action_key: string; action_label: string; reason: string; actor_name: string | null; target_name: string | null };
type Detail = { evidence_body: string | null; details: string | null; actions: CaseAction[] };

type State = {
  reports: Report[];
  openDetail: string;
  details: Record<string, Detail>;
  message: string;
  tone: 'ok' | 'error' | '';
};

function stateOptions(current: string): string {
  const keys = STATES.includes(current) ? STATES : [current, ...STATES];
  return keys.map((k) => `<option value="${esc(k)}"${k === current ? ' selected' : ''}>${esc(t(`moderation.reports.state.${k}`))}</option>`).join('');
}

// Case detail: preserved evidence + action history + take-action form. The
// reason input is required by policy — the button posts it with the action.
function detailPanel(state: State, r: Report): string {
  const d = state.details[r.id];
  if (!d) return `<p class="bk-state-copy">${esc(t('moderation.reports.loading'))}</p>`;
  const evidence = d.evidence_body
    ? `<p class="bk-state-copy"><strong>${esc(t('moderation.reports.evidence'))}</strong> ${esc(d.evidence_body)}</p>`
    : '';
  const details = d.details
    ? `<p class="bk-state-copy"><strong>${esc(t('moderation.reports.detailsLabel'))}</strong> ${esc(d.details)}</p>`
    : '';
  const history = d.actions.length
    ? `<div class="bk-list">${d.actions.map((a) => `<div class="bk-list-row"><div class="bk-list-row-main">`
        + `<span class="bk-list-row-title">${esc(a.action_label)}</span>`
        + `<span class="bk-state-copy">${esc(a.reason)}${a.target_name ? ` · ${esc(a.target_name)}` : ''}${a.actor_name ? ` · ${esc(a.actor_name)}` : ''}</span>`
        + `</div></div>`).join('')}</div>`
    : '';
  const actionButtons = ACTIONS
    .filter((key) => key !== 'hide_content' || (r.object_type === 'chat_message' && r.object_id))
    .map((key) => `<button class="bk-button bk-button-secondary" type="button" data-case-action="${esc(key)}" data-case-id="${esc(r.id)}">${esc(t(`moderation.reports.action.${key}`))}</button>`)
    .join('');
  const form = `<div class="bk-field-row">`
    + `<label class="bk-field"><span class="bk-label">${esc(t('moderation.reports.actionReason'))}</span><input class="bk-input" type="text" maxlength="2000" data-case-reason="${esc(r.id)}" /></label>`
    + `<div class="bk-action-row">${actionButtons}</div>`
    + `</div>`;
  return `<div class="bk-case-detail">${evidence}${details}${history}${form}</div>`;
}

function render(host: HTMLElement, state: State): void {
  const body = state.reports.length === 0
    ? `<p class="bk-state-copy">${esc(t('moderation.reports.empty'))}</p>`
    : `<div class="bk-list">${state.reports.map((r) => {
        const meta: string[] = [esc(r.reason_label)];
        if (r.reporter_name) meta.push(`${esc(t('moderation.reports.by'))} ${esc(r.reporter_name)}`);
        const detail = state.openDetail === r.id ? detailPanel(state, r) : '';
        return `<div class="bk-list-row"><div class="bk-list-row-main">`
          + `<span class="bk-list-row-title">${esc(r.object_type_label)}</span>`
          + `<span class="bk-state-copy">${meta.join(' · ')}</span>`
          + `<label class="bk-field"><span class="bk-label">${esc(t('moderation.reports.stateLabel'))}</span>`
          + `<select class="bk-select" data-report-state="${esc(r.id)}">${stateOptions(r.state_key)}</select></label>`
          + `<div class="bk-action-row"><button class="bk-button bk-button-secondary" type="button" data-case-toggle="${esc(r.id)}" aria-expanded="${state.openDetail === r.id ? 'true' : 'false'}">${esc(t('moderation.reports.detail'))}</button></div>`
          + detail
          + `</div></div>`;
      }).join('')}</div>`;

  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><div><h3 class="bk-card-title">${esc(t('moderation.reports.title'))}</h3><p class="bk-state-copy">${esc(t('moderation.reports.subtitle'))}</p></div></div>`
    + body
    + `<p class="bk-state-copy" data-reports-message role="status"${state.tone ? ` data-tone="${state.tone}"` : ''}>${esc(state.message)}</p>`
    + `</section>`;
}

async function load(state: State): Promise<number> {
  const { status, data } = await api('/reports', 'GET');
  state.reports = status === 200 ? (data?.reports ?? []) : [];
  return status;
}

async function loadDetail(state: State, reportId: string): Promise<void> {
  const { status, data } = await api(`/reports/${encodeURIComponent(reportId)}`, 'GET');
  if (status !== 200) return;
  state.details[reportId] = {
    evidence_body: data?.report?.context?.body ?? null,
    details: data?.report?.details ?? null,
    actions: data?.actions ?? []
  };
}

async function changeState(host: HTMLElement, state: State, reportId: string, stateKey: string): Promise<void> {
  const { status, data } = await api(`/reports/${encodeURIComponent(reportId)}`, 'PATCH', { state_key: stateKey });
  if (status === 200) {
    state.message = t('moderation.reports.updated'); state.tone = 'ok';
    await load(state);
  } else {
    state.message = data?.error?.message || t('moderation.reports.updateError'); state.tone = 'error';
  }
  render(host, state);
}

async function takeAction(host: HTMLElement, state: State, reportId: string, actionKey: string): Promise<void> {
  const reasonEl = host.querySelector<HTMLInputElement>(`[data-case-reason="${CSS.escape(reportId)}"]`);
  const reason = reasonEl?.value.trim() || '';
  if (!reason) {
    state.message = t('moderation.reports.reasonRequired'); state.tone = 'error';
    render(host, state);
    return;
  }
  const { status, data } = await api(`/reports/${encodeURIComponent(reportId)}/actions`, 'POST', { action_key: actionKey, reason });
  if (status === 200) {
    state.message = t('moderation.reports.actionTaken'); state.tone = 'ok';
    await loadDetail(state, reportId);
  } else {
    state.message = data?.error?.message || t('moderation.reports.actionError'); state.tone = 'error';
  }
  render(host, state);
}

async function toggleDetail(host: HTMLElement, state: State, reportId: string): Promise<void> {
  if (state.openDetail === reportId) { state.openDetail = ''; render(host, state); return; }
  state.openDetail = reportId;
  if (!(reportId in state.details)) await loadDetail(state, reportId);
  render(host, state);
}

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const state: State = { reports: [], openDetail: '', details: {}, message: '', tone: '' };
  const status = await load(state);
  // Not platform moderation staff — leave the surface empty (the mock queue stays).
  if (status === 403 || status === 401) { host.innerHTML = ''; return; }

  host.addEventListener('change', (event) => {
    const el = event.target as HTMLElement;
    const reportId = el.getAttribute?.('data-report-state');
    if (reportId) { (el as HTMLSelectElement).disabled = true; void changeState(host, state, reportId, (el as HTMLSelectElement).value); }
  });

  host.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const toggle = target?.closest<HTMLElement>('[data-case-toggle]');
    if (toggle) { event.preventDefault(); void toggleDetail(host, state, toggle.getAttribute('data-case-toggle') || ''); return; }
    const actionBtn = target?.closest<HTMLElement>('[data-case-action]');
    if (actionBtn) {
      event.preventDefault();
      (actionBtn as HTMLButtonElement).disabled = true;
      void takeAction(host, state, actionBtn.getAttribute('data-case-id') || '', actionBtn.getAttribute('data-case-action') || '');
    }
  });

  render(host, state);
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-moderation-reports]');
  if (host) void mount(host);
}

export function initRealModerationReports(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
