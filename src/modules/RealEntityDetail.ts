import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

async function api(path: string, method: 'GET' | 'PUT' | 'DELETE'): Promise<{ status: number; data: any }> {
  try {
    const res = await fetch(`/api/v1${path}`, { method, credentials: 'same-origin' });
    let data: any = null;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

type Entity = { id: string; name: string; slug: string | null; type: string; status: string; visibility: string; member_count: number };
type PlanUsage = {
  plan: { key: string; label: string; max_members: number; max_storage_bytes: number; max_file_versions: number; max_upload_bytes: number };
  usage: { members: number; storage_bytes: number };
};
type Post = { id: string; body: string; visibility: string; published_at: string; author_name: string | null };
type State = { entity: Entity | null; posts: Post[]; subscribed: boolean; plan: PlanUsage | null; notFound: boolean; message: string; tone: 'ok' | 'error' | '' };

function badgeHtml(label: string): string {
  return `<span class="bk-badge bk-badge-positive">${esc(label)}</span>`;
}

function render(host: HTMLElement, state: State): void {
  if (state.notFound) {
    host.innerHTML = `<section class="bk-card"><p class="bk-state-copy" data-tone="error">${esc(t('entityDetail.notFound'))}</p></section>`;
    return;
  }
  const e = state.entity;
  if (!e) { host.innerHTML = `<section class="bk-card"><p class="bk-state-copy">${esc(t('entityDetail.loading'))}</p></section>`; return; }

  const meta = `${esc(t(`entities.real.type.${e.type}`))} · ${esc(String(e.member_count))} ${esc(t('entities.real.members'))} · ${esc(t(`entityDetail.visibility.${e.visibility}`))}`;
  const subBtn = state.subscribed
    ? `<button class="bk-button bk-button-secondary" type="button" data-entity-sub="0">${esc(t('feed.real.unsubscribe'))}</button>`
    : `<button class="bk-button bk-button-primary" type="button" data-entity-sub="1">${esc(t('feed.real.subscribe'))}</button>`;

  // Plan + live usage: members only (the API 404s for everyone else, so a
  // missing block simply means "not your workspace").
  const p = state.plan;
  // Scale the unit to the value: a few hundred bytes rendered as "0.0 MB" reads
  // like a bug rather than a small file.
  const size = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0)} MB`;
    return `${(bytes / 1073741824).toFixed(1)} GB`;
  };
  const planBlock = p
    ? `<div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('entityDetail.planTitle'))}</h3>${badgeHtml(p.plan.label)}</div>`
      + `<div class="bk-list"><div class="bk-list-row"><div class="bk-list-row-main">`
      + `<span class="bk-state-copy">${esc(t('entityDetail.planMembers'))}: ${p.usage.members} / ${p.plan.max_members}</span>`
      + `<span class="bk-state-copy">${esc(t('entityDetail.planStorage'))}: ${esc(size(p.usage.storage_bytes))} / ${esc(size(p.plan.max_storage_bytes))}</span>`
      + `<span class="bk-state-copy">${esc(t('entityDetail.planVersions'))}: ${p.plan.max_file_versions} · ${esc(t('entityDetail.planUpload'))}: ${esc(size(p.plan.max_upload_bytes))}</span>`
      + `</div></div></div>`
    : '';

  const posts = state.posts.length === 0
    ? `<p class="bk-state-copy">${esc(t('entityDetail.noPosts'))}</p>`
    : `<div class="bk-list">${state.posts.map((p) => {
        const pmeta: string[] = [];
        if (p.author_name) pmeta.push(esc(p.author_name));
        pmeta.push(esc(new Date(p.published_at).toLocaleString()));
        if (p.visibility !== 'public') pmeta.push(esc(t(`feed.real.visibility.${p.visibility}`)));
        return `<div class="bk-list-row"><div class="bk-list-row-main">`
          + `<span class="bk-state-copy">${pmeta.join(' · ')}</span>`
          + `<p class="bk-card-body">${esc(p.body)}</p></div></div>`;
      }).join('')}</div>`;

  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><div><h2 class="bk-title">${esc(e.name)}</h2><p class="bk-state-copy">${meta}</p></div>`
    + `<div class="bk-action-row">${subBtn}<button class="bk-button bk-button-ghost" type="button" data-report-target data-report-type="entity" data-report-id="${esc(e.id)}">⚑ ${esc(t('feed.real.report'))}</button></div></div>`
    + `<p class="bk-state-copy" data-entity-message role="status"${state.tone ? ` data-tone="${state.tone}"` : ''}>${esc(state.message)}</p>`
    + planBlock
    + `<div class="bk-card-section-head"><h3 class="bk-card-title">${esc(t('entityDetail.postsTitle'))}</h3></div>`
    + posts
    + `</section>`;
}

async function load(state: State, ref: string): Promise<void> {
  const { status, data } = await api(`/entities/${encodeURIComponent(ref)}`, 'GET');
  if (status === 404) { state.notFound = true; return; }
  state.entity = status === 200 ? (data?.entity ?? null) : null;
  if (!state.entity) return;
  const [posts, plan] = await Promise.all([
    api(`/entities/${encodeURIComponent(state.entity.id)}/posts`, 'GET'),
    api(`/entities/${encodeURIComponent(state.entity.id)}/plan`, 'GET')
  ]);
  state.posts = posts.status === 200 ? (posts.data?.posts ?? []) : [];
  state.subscribed = posts.status === 200 ? Boolean(posts.data?.subscribed) : false;
  state.plan = plan.status === 200 ? { plan: plan.data.plan, usage: plan.data.usage } : null;
}

async function toggleSubscription(host: HTMLElement, state: State, subscribe: boolean): Promise<void> {
  if (!state.entity) return;
  const { status, data } = subscribe
    ? await api(`/entities/${encodeURIComponent(state.entity.id)}/subscription`, 'PUT')
    : await api(`/entities/${encodeURIComponent(state.entity.id)}/subscription`, 'DELETE');
  if (status === 200) {
    state.message = t(subscribe ? 'feed.real.subscribed' : 'feed.real.unsubscribed'); state.tone = 'ok';
    await load(state, state.entity.id);
  } else {
    state.message = data?.error?.message || t('feed.real.subscribeError'); state.tone = 'error';
  }
  render(host, state);
}

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';
  const ref = host.getAttribute('data-real-entity-detail') || '';
  const state: State = { entity: null, posts: [], subscribed: false, plan: null, notFound: false, message: '', tone: '' };

  host.addEventListener('click', (event) => {
    const btn = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-entity-sub]') : null;
    if (!btn) return;
    event.preventDefault();
    (btn as HTMLButtonElement).disabled = true;
    void toggleSubscription(host, state, btn.getAttribute('data-entity-sub') === '1');
  });

  await load(state, ref);
  render(host, state);
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-entity-detail]');
  if (host) void mount(host);
}

export function initRealEntityDetail(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
