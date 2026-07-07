import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

async function api(path: string, method: 'GET' | 'PUT', body?: unknown): Promise<{ status: number; data: any }> {
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
type Item = { profession_key: string; specialization_key: string | null; is_primary: boolean };

type State = {
  professions: Profession[];
  specializations: Specialization[];
  items: Item[];
  pendingProfession: string;
  pendingSpecialization: string;
  message: string;
  tone: 'ok' | 'error' | '';
};

function labelFor(state: State, key: string): string {
  return state.professions.find((p) => p.key === key)?.label ?? key;
}
function specLabelFor(state: State, key: string | null): string {
  if (!key) return '';
  return state.specializations.find((s) => s.key === key)?.label ?? key;
}

function render(host: HTMLElement, state: State): void {
  const profOptions = state.professions
    .map((p) => `<option value="${esc(p.key)}"${p.key === state.pendingProfession ? ' selected' : ''}>${esc(p.label)}</option>`)
    .join('');
  const specForPending = state.specializations.filter((s) => s.profession_key === state.pendingProfession);
  const specOptions = [`<option value="">${esc(t('profile.professions.specializationNone'))}</option>`]
    .concat(specForPending.map((s) => `<option value="${esc(s.key)}"${s.key === state.pendingSpecialization ? ' selected' : ''}>${esc(s.label)}</option>`))
    .join('');

  const list = state.items.length === 0
    ? `<p class="bk-state-copy">${esc(t('profile.professions.empty'))}</p>`
    : `<div class="bk-list">${state.items.map((item, i) => {
        const spec = specLabelFor(state, item.specialization_key);
        const title = spec ? `${esc(labelFor(state, item.profession_key))} · ${esc(spec)}` : esc(labelFor(state, item.profession_key));
        return `<div class="bk-list-row" data-rpe-item="${i}"><div class="bk-list-row-main"><span class="bk-list-row-title">${title}</span></div>`
          + `<label class="bk-inline-check"><input type="radio" name="rpe-primary" data-rpe-primary="${i}"${item.is_primary ? ' checked' : ''} /> ${esc(t('profile.professions.primary'))}</label>`
          + `<button class="bk-button bk-button-ghost" type="button" data-rpe-remove="${i}">${esc(t('profile.professions.remove'))}</button></div>`;
      }).join('')}</div>`;

  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><div><h3 class="bk-card-title">${esc(t('profile.professions.title'))}</h3><p class="bk-state-copy">${esc(t('profile.professions.subtitle'))}</p></div></div>`
    + `<div class="bk-field-row">`
    + `<label class="bk-field"><span class="bk-label">${esc(t('profile.professions.professionLabel'))}</span><select class="bk-input" data-rpe-field="profession">${profOptions}</select></label>`
    + `<label class="bk-field"><span class="bk-label">${esc(t('profile.professions.specializationLabel'))}</span><select class="bk-input" data-rpe-field="specialization">${specOptions}</select></label>`
    + `<div class="bk-action-row"><button class="bk-button bk-button-secondary" type="button" data-rpe-action="add">${esc(t('profile.professions.add'))}</button></div>`
    + `</div>`
    + list
    + `<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-rpe-action="save">${esc(t('profile.professions.save'))}</button></div>`
    + `<p class="bk-state-copy" data-rpe-message role="status"${state.tone ? ` data-tone="${state.tone}"` : ''}>${esc(state.message)}</p>`
    + `</section>`;
}

async function save(host: HTMLElement, state: State): Promise<void> {
  const payload = { professions: state.items.map((i) => ({ profession_key: i.profession_key, specialization_key: i.specialization_key, is_primary: i.is_primary })) };
  const { status, data } = await api('/me/professions', 'PUT', payload);
  if (status === 200) {
    state.items = (data?.professions ?? []).map((r: any) => ({ profession_key: r.profession_key, specialization_key: r.specialization_key ?? null, is_primary: Boolean(r.is_primary) }));
    state.message = t('profile.professions.saved');
    state.tone = 'ok';
  } else if (data?.error?.code === 'SPECIALIZATION_MISMATCH') {
    state.message = t('profile.professions.mismatch');
    state.tone = 'error';
  } else if (data?.error?.code === 'PROFESSION_DUPLICATE') {
    state.message = t('profile.professions.duplicate');
    state.tone = 'error';
  } else {
    state.message = t('profile.professions.saveError');
    state.tone = 'error';
  }
  render(host, state);
}

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const [tax, mine] = await Promise.all([api('/taxonomy', 'GET'), api('/me/professions', 'GET')]);
  if (tax.status !== 200 || mine.status !== 200) {
    host.innerHTML = `<section class="bk-card"><h3 class="bk-card-title">${esc(t('profile.professions.title'))}</h3><p class="bk-state-copy" data-tone="error">${esc(t('profile.professions.loadError'))}</p></section>`;
    return;
  }

  const professions: Profession[] = tax.data?.professions ?? [];
  const state: State = {
    professions,
    specializations: tax.data?.specializations ?? [],
    items: (mine.data?.professions ?? []).map((r: any) => ({ profession_key: r.profession_key, specialization_key: r.specialization_key ?? null, is_primary: Boolean(r.is_primary) })),
    pendingProfession: professions[0]?.key ?? '',
    pendingSpecialization: '',
    message: '',
    tone: ''
  };

  host.addEventListener('change', (event) => {
    const el = event.target as HTMLElement;
    const field = el.getAttribute?.('data-rpe-field');
    if (field === 'profession') {
      state.pendingProfession = (el as HTMLSelectElement).value;
      state.pendingSpecialization = '';
      render(host, state);
      return;
    }
    if (field === 'specialization') {
      state.pendingSpecialization = (el as HTMLSelectElement).value;
      return;
    }
    const primaryIdx = el.getAttribute?.('data-rpe-primary');
    if (primaryIdx !== null && primaryIdx !== undefined) {
      const idx = Number(primaryIdx);
      state.items.forEach((item, i) => { item.is_primary = i === idx; });
      render(host, state);
    }
  });

  host.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const removeBtn = target.closest<HTMLElement>('[data-rpe-remove]');
    if (removeBtn) {
      event.preventDefault();
      state.items.splice(Number(removeBtn.getAttribute('data-rpe-remove')), 1);
      state.message = ''; state.tone = '';
      render(host, state);
      return;
    }
    const action = target.closest<HTMLElement>('[data-rpe-action]')?.getAttribute('data-rpe-action');
    if (action === 'add') {
      event.preventDefault();
      const professionKey = state.pendingProfession;
      if (!professionKey) return;
      if (state.items.some((i) => i.profession_key === professionKey)) {
        state.message = t('profile.professions.duplicate'); state.tone = 'error';
        render(host, state);
        return;
      }
      state.items.push({ profession_key: professionKey, specialization_key: state.pendingSpecialization || null, is_primary: false });
      state.message = ''; state.tone = '';
      render(host, state);
      return;
    }
    if (action === 'save') {
      event.preventDefault();
      void save(host, state);
    }
  });

  render(host, state);
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-professions]');
  if (host) void mount(host);
}

export function initRealProfessionsEditor(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
