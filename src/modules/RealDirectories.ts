import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

// Client-side navigation for asynchronously-injected rows (the app's own
// [data-route] binding only runs at render time, before these rows exist). The
// SPA re-renders on popstate.
function navigateTo(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
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

// The real directory panels replacing the mock grids: entities (with a create
// form), events and documents, all read straight from the backend.

const ENTITY_TYPES = ['band', 'solo_artist', 'orchestra', 'project', 'organization', 'studio', 'venue', 'agency', 'other'];

async function mountEntities(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  async function draw(message = '', tone = ''): Promise<void> {
    const { status, data } = await api('/entities', 'GET');
    const entities: any[] = status === 200 ? (data?.entities ?? []) : [];
    const list = entities.length === 0
      ? `<p class="bk-state-copy">${esc(t('entities.real.empty'))}</p>`
      : `<div class="bk-list">${entities.map((e) => `<div class="bk-list-row"><div class="bk-list-row-main">`
          + `<a class="bk-list-row-title" href="/bands/${esc(e.slug || e.id)}" data-ent-open="${esc(e.slug || e.id)}">${esc(e.name)}</a>`
          + `<span class="bk-state-copy">${esc(t(`entities.real.type.${e.type}`) )} · ${esc(String(e.member_count ?? ''))} ${esc(t('entities.real.members'))}</span>`
          + `</div></div>`).join('')}</div>`;
    const typeOptions = ENTITY_TYPES.map((k) => `<option value="${esc(k)}">${esc(t(`entities.real.type.${k}`))}</option>`).join('');
    const form = `<div class="bk-card-section-head"><h4 class="bk-card-title">${esc(t('entities.real.createTitle'))}</h4></div>`
      + `<div class="bk-field-row">`
      + `<label class="bk-field"><span class="bk-label">${esc(t('entities.real.nameLabel'))}</span><input class="bk-input" type="text" maxlength="120" data-ent-name /></label>`
      + `<label class="bk-field"><span class="bk-label">${esc(t('entities.real.typeLabel'))}</span><select class="bk-input" data-ent-type>${typeOptions}</select></label>`
      + `<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-ent-create>${esc(t('entities.real.create'))}</button></div>`
      + `</div>`;
    host.innerHTML = `<section class="bk-card">`
      + `<div class="bk-card-section-head"><div><h3 class="bk-card-title">${esc(t('entities.real.title'))}</h3><p class="bk-state-copy">${esc(t('entities.real.subtitle'))}</p></div></div>`
      + list + form
      + `<p class="bk-state-copy" data-ent-message role="status"${tone ? ` data-tone="${tone}"` : ''}>${esc(message)}</p>`
      + `</section>`;
  }

  host.addEventListener('click', (event) => {
    const open = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-ent-open]') : null;
    if (open) { event.preventDefault(); navigateTo(`/bands/${open.getAttribute('data-ent-open')}`); return; }
    const btn = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-ent-create]') : null;
    if (!btn) return;
    event.preventDefault();
    const name = host.querySelector<HTMLInputElement>('[data-ent-name]')?.value.trim() || '';
    const type = host.querySelector<HTMLSelectElement>('[data-ent-type]')?.value || 'project';
    if (!name) { void draw(t('entities.real.nameRequired'), 'error'); return; }
    (btn as HTMLButtonElement).disabled = true;
    void api('/entities', 'POST', { name, type }).then(({ status, data }) => {
      if (status === 201) void draw(t('entities.real.created'), 'ok');
      else void draw(data?.error?.message || t('entities.real.createError'), 'error');
    });
  });

  await draw();
}

async function mountEvents(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';
  const { status, data } = await api('/events', 'GET');
  const events: any[] = status === 200 ? (data?.events ?? []) : [];
  const list = events.length === 0
    ? `<p class="bk-state-copy">${esc(t('events.list.empty'))}</p>`
    : `<div class="bk-list">${events.map((e) => {
        const meta: string[] = [];
        if (e.entity_name) meta.push(esc(e.entity_name));
        meta.push(esc(e.status));
        if (e.location) meta.push(esc(e.location));
        meta.push(`${e.participant_count ?? 0} ${esc(t('events.list.participants'))}`);
        return `<div class="bk-list-row"><div class="bk-list-row-main">`
          + `<span class="bk-list-row-title">${esc(e.title)}</span>`
          + `<span class="bk-state-copy">${meta.join(' · ')}</span>`
          + `</div></div>`;
      }).join('')}</div>`;
  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><div><h3 class="bk-card-title">${esc(t('events.list.title'))}</h3><p class="bk-state-copy">${esc(t('events.list.subtitle'))}</p></div></div>`
    + list + `</section>`;
}

async function mountDocuments(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  function sizeLabel(bytes: number): string {
    if (!bytes) return '';
    const kb = bytes / 1024;
    return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  }

  async function draw(message = '', tone = ''): Promise<void> {
    const { status, data } = await api('/documents', 'GET');
    const docs: any[] = status === 200 ? (data?.documents ?? []) : [];
    const list = docs.length === 0
      ? `<p class="bk-state-copy">${esc(t('documents.real.empty'))}</p>`
      : `<div class="bk-list">${docs.map((d) => {
          const meta: string[] = [];
          if (d.document_type) meta.push(esc(d.document_type));
          if (d.status) meta.push(esc(d.status));
          if (d.entity_name) meta.push(esc(d.entity_name));
          if (d.has_file) meta.push(`v${esc(String(d.version_number))} · ${esc(sizeLabel(Number(d.size_bytes)))}`);
          const fileAction = d.has_file
            ? `<a class="bk-button bk-button-secondary" href="/api/v1/documents/${esc(d.id)}/file" download>${esc(t('documents.real.download'))}</a>`
            : `<span class="bk-state-copy">${esc(t('documents.real.noFile'))}</span>`;
          return `<div class="bk-list-row"><div class="bk-list-row-main">`
            + `<span class="bk-list-row-title">${esc(d.title)}</span>`
            + `<span class="bk-state-copy">${meta.join(' · ')}</span>`
            + `<div class="bk-action-row">${fileAction}`
            + `<label class="bk-button bk-button-ghost" for="up-${esc(d.id)}">${esc(t(d.has_file ? 'documents.real.replace' : 'documents.real.upload'))}</label>`
            + `<input id="up-${esc(d.id)}" class="bk-visually-hidden" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" data-doc-upload="${esc(d.id)}" />`
            + `</div></div></div>`;
        }).join('')}</div>`;
    host.innerHTML = `<section class="bk-card">`
      + `<div class="bk-card-section-head"><div><h3 class="bk-card-title">${esc(t('documents.real.title'))}</h3><p class="bk-state-copy">${esc(t('documents.real.subtitle'))}</p></div></div>`
      + list
      + `<p class="bk-state-copy" data-doc-message role="status"${tone ? ` data-tone="${tone}"` : ''}>${esc(message)}</p>`
      + `</section>`;
  }

  // Raw-body upload: the file streams as-is, the name travels percent-encoded in
  // a header (no multipart parser needed on the backend).
  host.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    const docId = input?.getAttribute?.('data-doc-upload');
    if (!docId) return;
    const file = input.files?.[0];
    if (!file) return;
    void draw(t('documents.real.uploading'), '');
    void fetch(`/api/v1/documents/${encodeURIComponent(docId)}/file`, {
      method: 'POST',
      headers: { 'content-type': file.type || 'application/octet-stream', 'x-filename': encodeURIComponent(file.name) },
      body: file,
      credentials: 'same-origin'
    }).then(async (res) => {
      const body = await res.json().catch(() => null);
      if (res.status === 201) return draw(t('documents.real.uploaded'), 'ok');
      if (res.status === 415) return draw(t('documents.real.typeRejected'), 'error');
      if (res.status === 413) return draw(t('documents.real.tooLarge'), 'error');
      if (res.status === 409) {
        const code = body?.error?.code;
        if (code === 'PLAN_STORAGE_FULL') return draw(t('documents.real.planStorageFull'), 'error');
        if (code === 'PLAN_VERSION_LIMIT') return draw(t('documents.real.planVersionLimit'), 'error');
      }
      if (res.status === 403 || res.status === 404) return draw(t('documents.real.uploadForbidden'), 'error');
      return draw(body?.error?.message || t('documents.real.uploadError'), 'error');
    }).catch(() => draw(t('documents.real.uploadError'), 'error'));
  });

  await draw();
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const ents = root.querySelector<HTMLElement>('[data-real-entities-list]');
  if (ents) void mountEntities(ents);
  const evs = root.querySelector<HTMLElement>('[data-real-events-list]');
  if (evs) void mountEvents(evs);
  const docs = root.querySelector<HTMLElement>('[data-real-documents-list]');
  if (docs) void mountDocuments(docs);
}

export function initRealDirectories(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
