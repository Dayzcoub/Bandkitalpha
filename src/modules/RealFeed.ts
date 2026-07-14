import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

async function api(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<{ status: number; data: any }> {
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

type Post = {
  id: string; entity_id: string; entity_name: string; body: string;
  visibility: string; is_pinned: boolean; published_at: string; author_name: string | null;
};
type EntityRow = { id: string; name: string };

type State = {
  posts: Post[];
  entities: EntityRow[];
  subscribedIds: Set<string>;
  pendingEntity: string;
  pendingVisibility: string;
  message: string;
  tone: 'ok' | 'error' | '';
};

function postCardHtml(p: Post): string {
  const meta: string[] = [esc(p.entity_name)];
  if (p.author_name) meta.push(esc(p.author_name));
  meta.push(esc(new Date(p.published_at).toLocaleString()));
  // Non-public layers get a small text marker so the viewer understands scope.
  if (p.visibility !== 'public') meta.push(esc(t(`feed.real.visibility.${p.visibility}`)));
  return `<div class="bk-list-row"><div class="bk-list-row-main">`
    + `<span class="bk-list-row-title">${esc(p.entity_name)}</span>`
    + `<span class="bk-state-copy">${meta.join(' · ')}</span>`
    + `<p class="bk-card-body">${esc(p.body)}</p>`
    + `</div></div>`;
}

function render(host: HTMLElement, state: State): void {
  const feed = state.posts.length === 0
    ? `<p class="bk-state-copy">${esc(t('feed.real.empty'))}</p>`
    : `<div class="bk-list" data-real-feed-list>${state.posts.map(postCardHtml).join('')}</div>`;

  const subs = state.entities.length === 0
    ? ''
    : `<div class="bk-card-section-head"><h4 class="bk-card-title">${esc(t('feed.real.subscriptionsTitle'))}</h4></div>`
      + `<div class="bk-list">${state.entities.map((e) => {
          const on = state.subscribedIds.has(e.id);
          return `<div class="bk-list-row"><div class="bk-list-row-main">`
            + `<span class="bk-list-row-title">${esc(e.name)}</span>`
            + `<div class="bk-action-row"><button class="bk-button bk-button-secondary" type="button" data-sub-toggle="${esc(e.id)}" data-sub-on="${on ? '1' : '0'}">${esc(on ? t('feed.real.unsubscribe') : t('feed.real.subscribe'))}</button></div>`
            + `</div></div>`;
        }).join('')}</div>`;

  const entityOptions = state.entities
    .map((e) => `<option value="${esc(e.id)}"${e.id === state.pendingEntity ? ' selected' : ''}>${esc(e.name)}</option>`).join('');
  const visibilityOptions = ['public', 'subscribers', 'members']
    .map((v) => `<option value="${esc(v)}"${v === state.pendingVisibility ? ' selected' : ''}>${esc(t(`feed.real.visibility.${v}`))}</option>`).join('');
  const composer = state.entities.length === 0
    ? ''
    : `<div class="bk-card-section-head"><h4 class="bk-card-title">${esc(t('feed.real.composerTitle'))}</h4></div>`
      + `<div class="bk-field-row">`
      + `<label class="bk-field"><span class="bk-label">${esc(t('feed.real.entityLabel'))}</span><select class="bk-input" data-feed-field="entity">${entityOptions}</select></label>`
      + `<label class="bk-field"><span class="bk-label">${esc(t('feed.real.visibilityLabel'))}</span><select class="bk-input" data-feed-field="visibility">${visibilityOptions}</select></label>`
      + `<label class="bk-field"><span class="bk-label">${esc(t('feed.real.bodyLabel'))}</span><textarea class="bk-textarea" maxlength="8000" data-feed-body></textarea></label>`
      + `<div class="bk-action-row"><button class="bk-button bk-button-primary" type="button" data-feed-action="publish">${esc(t('feed.real.publish'))}</button></div>`
      + `</div>`;

  host.innerHTML = `<section class="bk-card">`
    + `<div class="bk-card-section-head"><div><h3 class="bk-card-title">${esc(t('feed.real.title'))}</h3><p class="bk-state-copy">${esc(t('feed.real.subtitle'))}</p></div></div>`
    + feed + subs + composer
    + `<p class="bk-state-copy" data-feed-message role="status"${state.tone ? ` data-tone="${state.tone}"` : ''}>${esc(state.message)}</p>`
    + `</section>`;
}

async function load(state: State): Promise<void> {
  const [feed, ents, subs] = await Promise.all([
    api('/me/feed', 'GET'), api('/entities', 'GET'), api('/me/subscriptions', 'GET')
  ]);
  state.posts = feed.status === 200 ? (feed.data?.posts ?? []) : [];
  state.entities = ents.status === 200 ? (ents.data?.entities ?? []) : [];
  state.subscribedIds = new Set(
    subs.status === 200 ? (subs.data?.subscriptions ?? []).map((s: any) => s.entity_id) : []
  );
  if (!state.pendingEntity) state.pendingEntity = state.entities[0]?.id ?? '';
}

async function toggleSubscription(host: HTMLElement, state: State, entityId: string, isOn: boolean): Promise<void> {
  const { status, data } = isOn
    ? await api(`/entities/${encodeURIComponent(entityId)}/subscription`, 'DELETE')
    : await api(`/entities/${encodeURIComponent(entityId)}/subscription`, 'PUT');
  if (status === 200) {
    state.message = t(isOn ? 'feed.real.unsubscribed' : 'feed.real.subscribed'); state.tone = 'ok';
    await load(state);
  } else {
    state.message = data?.error?.message || t('feed.real.subscribeError'); state.tone = 'error';
  }
  render(host, state);
}

async function publish(host: HTMLElement, state: State): Promise<void> {
  const bodyEl = host.querySelector<HTMLTextAreaElement>('[data-feed-body]');
  const text = bodyEl?.value.trim() || '';
  if (!text) {
    state.message = t('feed.real.bodyRequired'); state.tone = 'error';
    render(host, state);
    return;
  }
  const { status, data } = await api(`/entities/${encodeURIComponent(state.pendingEntity)}/posts`, 'POST',
    { body: text, visibility: state.pendingVisibility });
  if (status === 201) {
    state.message = t('feed.real.published'); state.tone = 'ok';
    await load(state);
  } else if (status === 422) {
    state.message = t('feed.real.linkBlocked'); state.tone = 'error';
  } else if (status === 403) {
    state.message = t('feed.real.forbidden'); state.tone = 'error';
  } else {
    state.message = data?.error?.message || t('feed.real.publishError'); state.tone = 'error';
  }
  render(host, state);
}

async function mount(host: HTMLElement): Promise<void> {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  const state: State = {
    posts: [], entities: [], subscribedIds: new Set(),
    pendingEntity: '', pendingVisibility: 'public', message: '', tone: ''
  };
  await load(state);

  host.addEventListener('change', (event) => {
    const el = event.target as HTMLElement;
    const field = el.getAttribute?.('data-feed-field');
    if (field === 'entity') { state.pendingEntity = (el as HTMLSelectElement).value; return; }
    if (field === 'visibility') { state.pendingVisibility = (el as HTMLSelectElement).value; return; }
  });

  host.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const sub = target?.closest<HTMLElement>('[data-sub-toggle]');
    if (sub) {
      event.preventDefault();
      (sub as HTMLButtonElement).disabled = true;
      void toggleSubscription(host, state, sub.getAttribute('data-sub-toggle') || '', sub.getAttribute('data-sub-on') === '1');
      return;
    }
    const pub = target?.closest<HTMLElement>('[data-feed-action="publish"]');
    if (pub) {
      event.preventDefault();
      (pub as HTMLButtonElement).disabled = true;
      void publish(host, state);
    }
  });

  render(host, state);
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-feed]');
  if (host) void mount(host);
}

export function initRealFeed(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
