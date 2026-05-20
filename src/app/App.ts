import { loadAppState, updatePreference } from '../lib/auth/session.js';
import { createTranslator } from '../lib/i18n/i18n.js';
import { matchRoute } from './router.js';
import type { AppContext } from './types.js';
import { renderPage } from '../routes/pages.js';
import { renderShell } from '../layouts/shells.js';

const NAVIGATION_STATE_KEY = 'bkNavigationKey';
const SCROLL_STORAGE_KEY = 'bandkit.scrollPositions.v1';

const CHAT_ROOM_IDS = ['c1', 'c2', 'c3'] as const;

type BandKitHistoryState = Record<string, unknown> & {
  [NAVIGATION_STATE_KEY]?: string;
};

type RenderOptions = {
  scrollMode?: 'top' | 'restore' | 'preserve';
  restoreKey?: string;
};

function createNavigationKey(): string {
  return `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function historyState(): BandKitHistoryState {
  return (window.history.state ?? {}) as BandKitHistoryState;
}

function navigationKeyFromState(state: BandKitHistoryState | null | undefined): string | undefined {
  return state?.[NAVIGATION_STATE_KEY];
}

function ensureInitialHistoryState(): string {
  const current = historyState();
  const existingKey = navigationKeyFromState(current);
  if (existingKey) return existingKey;
  const key = createNavigationKey();
  window.history.replaceState({ ...current, [NAVIGATION_STATE_KEY]: key }, '', window.location.href);
  return key;
}

function readScrollPositions(): Record<string, { x: number; y: number }> {
  try {
    const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { x: number; y: number }>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeScrollPositions(positions: Record<string, { x: number; y: number }>): void {
  try {
    window.sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Session storage may be unavailable in hardened browsers. Native back still works.
  }
}

function saveScrollPosition(key: string): void {
  const positions = readScrollPositions();
  positions[key] = { x: window.scrollX, y: window.scrollY };
  writeScrollPositions(positions);
}

function restoreScrollPosition(key: string): void {
  const position = readScrollPositions()[key];
  const x = position?.x ?? 0;
  const y = position?.y ?? 0;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ left: x, top: y, behavior: 'auto' });
    });
  });
}

function chatRoomLogisticsContext(): string {
  return `<section class="bk-card bk-chat-context-card" aria-label="Контекст чата"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Контекст чата</div><h3 class="bk-card-title">Групповой чат проекта и события</h3></div><div class="bk-chip-row"><span class="bk-badge bk-badge-positive">Проектный</span><span class="bk-badge">Событие</span><span class="bk-badge">Документы</span></div></div><p class="bk-state-copy">Этот чат связан с проектом, ближайшим событием и рабочими документами. Сообщения видят только участники соответствующего контекста, а внешние ссылки ограничены политикой безопасности.</p><div class="bk-card-grid bk-card-grid-3"><a class="bk-chat-context-link" href="/bands/b1" data-route="/bands/b1"><span class="bk-chat-context-icon" aria-hidden="true">♬</span><span><strong>Northern Lights Band</strong><small>Проект · участники и менеджеры</small></span></a><a class="bk-chat-context-link" href="/events/e1" data-route="/events/e1"><span class="bk-chat-context-icon" aria-hidden="true">◷</span><span><strong>Главная репетиция</strong><small>Событие · участники события</small></span></a><a class="bk-chat-context-link" href="/documents/d1" data-route="/documents/d1"><span class="bk-chat-context-icon" aria-hidden="true">▤</span><span><strong>Технический райдер</strong><small>Документ · чтение по роли</small></span></a></div><section class="bk-profile-feed-policy"><div><strong>Кто видит сообщения</strong><span>Участники проекта/события с нужной ролью. Подписка или дружба сами по себе доступ к чату не дают.</span></div><div class="bk-chip-row"><span class="bk-badge bk-badge-positive">Участники</span><span class="bk-badge">Менеджер</span><span class="bk-badge bk-badge-warning">Без внешних ссылок</span></div></section></section>`;
}

function addDirectChatNavigation(root: HTMLElement, ctx: AppContext): void {
  if (ctx.match.route.path !== '/chats' && ctx.match.route.path !== '/chats/:chatId') return;
  const chatRows = Array.from(root.querySelectorAll<HTMLElement>('.bk-chat-room-card .bk-list > .bk-list-row, .bk-chat-policy-card + .bk-card .bk-list > .bk-list-row'));
  chatRows.slice(0, CHAT_ROOM_IDS.length).forEach((row, index) => {
    if (row.dataset.chatNavigationReady === 'true') return;
    const route = `/chats/${CHAT_ROOM_IDS[index]}`;
    row.dataset.chatNavigationReady = 'true';
    row.classList.add('bk-chat-nav-row');
    row.insertAdjacentHTML('beforeend', `<button class="bk-button bk-button-secondary bk-chat-nav-open" type="button" data-route="${route}">Открыть</button>`);
  });
}

function decorateRenderedPage(root: HTMLElement, ctx: AppContext): void {
  if (ctx.match.route.path === '/chats/:chatId') {
    const chatRoom = root.querySelector<HTMLElement>('.bk-chat-room-card');
    if (chatRoom && !root.querySelector('.bk-chat-context-card')) {
      chatRoom.insertAdjacentHTML('beforebegin', chatRoomLogisticsContext());
    }
  }
  addDirectChatNavigation(root, ctx);
}

export function createBandKitApp(root: HTMLElement) {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  let path = window.location.pathname;
  let activeNavigationKey = ensureInitialHistoryState();

  function render(options: RenderOptions = {}): void {
    const state = loadAppState();
    const match = matchRoute(path);
    const ctx: AppContext = { state, t: createTranslator(state.locale), path, match };
    document.documentElement.lang = state.locale;
    document.documentElement.dataset.theme = state.theme;
    root.innerHTML = renderShell(ctx, renderPage(ctx));
    decorateRenderedPage(root, ctx);
    bindEvents();

    if (options.scrollMode === 'top') {
      window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
    }
    if (options.scrollMode === 'restore' && options.restoreKey) {
      restoreScrollPosition(options.restoreKey);
    }
  }

  function navigate(nextPath: string): void {
    if (nextPath === path) return;
    saveScrollPosition(activeNavigationKey);
    const nextNavigationKey = createNavigationKey();
    activeNavigationKey = nextNavigationKey;
    path = nextPath;
    window.history.pushState({ [NAVIGATION_STATE_KEY]: nextNavigationKey }, '', nextPath);
    render({ scrollMode: 'top' });
  }

  function goBack(): void {
    saveScrollPosition(activeNavigationKey);
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate('/feed');
  }

  function closeMobileMenu(): void {
    const layer = root.querySelector<HTMLElement>('[data-mobile-menu-layer]');
    layer?.classList.remove('is-open');
    layer?.setAttribute('aria-hidden', 'true');
  }

  function openMobileMenu(): void {
    const layer = root.querySelector<HTMLElement>('[data-mobile-menu-layer]');
    layer?.classList.add('is-open');
    layer?.setAttribute('aria-hidden', 'false');
  }

  function bindEvents(): void {
    root.querySelectorAll<HTMLElement>('[data-route]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        const nextPath = node.dataset.route;
        if (nextPath) {
          closeMobileMenu();
          navigate(nextPath);
        }
      });
    });
    root.querySelectorAll<HTMLElement>('[data-history-back]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        closeMobileMenu();
        goBack();
      });
    });
    root.querySelectorAll<HTMLElement>('[data-mobile-menu-open]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        openMobileMenu();
      });
    });
    root.querySelectorAll<HTMLElement>('[data-mobile-menu-close]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        closeMobileMenu();
      });
    });
    root.querySelectorAll<HTMLSelectElement>('select[data-pref]').forEach((node) => {
      node.addEventListener('change', () => {
        const pref = node.dataset.pref as 'locale' | 'role' | 'verification' | 'uiState' | 'theme' | undefined;
        if (pref) updatePreference(pref, node.value);
        render({ scrollMode: 'preserve' });
      });
    });
  }

  window.addEventListener('beforeunload', () => {
    saveScrollPosition(activeNavigationKey);
  });

  window.addEventListener('popstate', (event) => {
    saveScrollPosition(activeNavigationKey);
    path = window.location.pathname;
    const stateKey = navigationKeyFromState(event.state as BandKitHistoryState | null);
    activeNavigationKey = stateKey ?? ensureInitialHistoryState();
    render({ scrollMode: 'restore', restoreKey: activeNavigationKey });
  });

  render({ scrollMode: 'preserve' });
}