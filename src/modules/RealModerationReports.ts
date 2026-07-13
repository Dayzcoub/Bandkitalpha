import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

async function api(path: string, method: 'GET' | 'PATCH', body?: unknown): Promise<{ status: number; data: any }> {
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

type Report = {
  id: string; object_type_label: string; object_id: string | null;
  reason_label: string; state_key: string; details: string | null;
  reporter_name: string | null; created_at: string;
};

type State = { reports: Report[]; message: string; tone: 'ok' | 'error' | '' };

function stateOptions(current: string): string {
  const keys = STATES.includes(current) ? STATES : [current, ...STATES];
  return keys.map((k) => `<option value="${esc(k)}"${k === current ? ' selected' : ''}>${esc(t(`moderation.reports.state.${k}`))}</option>`).join('');
}

function render(host: HTMLElement, state: State): void {
  const body = state.reports.length === 0
    ? `<p class="bk-state-copy">${esc(t('moderation.reports.empty'))}</p>`
    : `<div class="bk-list">${state.reports.map((r) => {
        const meta: string[] = [esc(r.reason_label)];
        if (r.reporter_name) meta.push(`${esc(t('moderation.reports.by'))} ${esc(r.reporter_name)}`);
        return `<div class="bk-list-row"><div class="bk-list-row-main">`
          + `<span class="bk-list-row-title">${esc(r.object_type_label)}</span>`
          + `<span class="bk-state-copy">${meta.join(' · ')}</span>`
          + `<label class="bk-field"><span class="bk-label">${esc(t('moderation.reports.stateLabel'))}</span>`
          + `<select class="bk-select" data-report-state="${esc(r.id)}">${stateOptions(r.state_key)}</select></label>`
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

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const state: State = { reports: [], message: '', tone: '' };
  const status = await load(state);
  // Not platform moderation staff — leave the surface empty (the mock queue stays).
  if (status === 403 || status === 401) { host.innerHTML = ''; return; }

  host.addEventListener('change', (event) => {
    const el = event.target as HTMLElement;
    const reportId = el.getAttribute?.('data-report-state');
    if (reportId) { (el as HTMLSelectElement).disabled = true; void changeState(host, state, reportId, (el as HTMLSelectElement).value); }
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
