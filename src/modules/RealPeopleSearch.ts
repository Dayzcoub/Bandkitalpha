import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

// The app's own [data-route] binding runs only at render time; rows injected later
// navigate manually and the SPA re-renders on popstate (same pattern as RealChat).
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

interface FoundUser { id: string; display_name: string; handle: string | null; }

function resultsHtml(users: FoundUser[]): string {
  if (users.length === 0) return `<p class="bk-state-copy">${esc(t('people.empty'))}</p>`;
  return `<div class="bk-list">${users.map((u) => {
    const sub = u.handle ? `<span class="bk-state-copy">@${esc(u.handle)}</span>` : '';
    return `<div class="bk-list-row"><div class="bk-list-row-main">`
      + `<span class="bk-list-row-title">${esc(u.display_name)}</span>${sub}`
      + `</div><div class="bk-action-row">`
      + `<button class="bk-button bk-button-primary" type="button" data-people-msg="${esc(u.id)}">${esc(t('people.message'))}</button>`
      + `<button class="bk-button" type="button" data-people-friend="${esc(u.id)}">${esc(t('people.addFriend'))}</button>`
      + `</div></div>`;
  }).join('')}</div>`;
}

function setStatus(host: HTMLElement, message: string, tone = ''): void {
  const el = host.querySelector<HTMLElement>('[data-people-status]');
  if (el) { el.textContent = message; if (tone) el.dataset.tone = tone; else delete el.dataset.tone; }
}

function mount(host: HTMLElement): void {
  if (host.dataset.ready === '1') return;
  host.dataset.ready = '1';

  host.className = 'bk-card';
  host.innerHTML = `<div class="bk-card-section-head"><div>`
    + `<h3 class="bk-card-title">${esc(t('people.title'))}</h3>`
    + `<p class="bk-state-copy">${esc(t('people.subtitle'))}</p></div></div>`
    + `<label class="bk-field"><input class="bk-input" type="search" maxlength="80" autocomplete="off"`
    + ` placeholder="${esc(t('people.searchPlaceholder'))}" data-people-q /></label>`
    + `<div data-people-results><p class="bk-state-copy">${esc(t('people.hint'))}</p></div>`
    + `<p class="bk-state-copy" data-people-status role="status"></p>`;

  let timer: number | null = null;
  host.addEventListener('input', (event) => {
    if (!(event.target instanceof HTMLElement) || !event.target.closest('[data-people-q]')) return;
    setStatus(host, '');
    const q = host.querySelector<HTMLInputElement>('[data-people-q]')?.value.trim() || '';
    const results = host.querySelector<HTMLElement>('[data-people-results]');
    if (!results) return;
    if (q.length < 2) { results.innerHTML = `<p class="bk-state-copy">${esc(t('people.hint'))}</p>`; return; }
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(async () => {
      results.innerHTML = `<p class="bk-state-copy">${esc(t('people.searching'))}</p>`;
      const { status, data } = await api(`/users/search?q=${encodeURIComponent(q)}`, 'GET');
      results.innerHTML = resultsHtml(status === 200 ? (data?.users ?? []) : []);
    }, 250);
  });

  host.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const msgBtn = target.closest<HTMLElement>('[data-people-msg]');
    if (msgBtn) {
      event.preventDefault();
      const id = msgBtn.getAttribute('data-people-msg') || '';
      void (async () => {
        const { status, data } = await api('/conversations/personal', 'POST', { user_id: id });
        if ((status === 200 || status === 201) && data?.room?.id) navigateTo(`/chats/${encodeURIComponent(data.room.id)}`);
        else setStatus(host, t('people.actionError'), 'critical');
      })();
      return;
    }

    const friendBtn = target.closest<HTMLElement>('[data-people-friend]');
    if (friendBtn) {
      event.preventDefault();
      const id = friendBtn.getAttribute('data-people-friend') || '';
      void (async () => {
        const { status } = await api(`/me/friends/${encodeURIComponent(id)}`, 'POST');
        setStatus(host, status === 200 || status === 201 ? t('people.friendSent') : t('people.actionError'),
          status === 200 || status === 201 ? 'positive' : 'critical');
      })();
    }
  });
}

function maybeMount(root: HTMLElement): void {
  if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
  const host = root.querySelector<HTMLElement>('[data-real-people-search]');
  if (host) mount(host);
}

export function initRealPeopleSearch(root: HTMLElement): void {
  maybeMount(root);
  new MutationObserver(() => maybeMount(root)).observe(root, { childList: true, subtree: true });
}
