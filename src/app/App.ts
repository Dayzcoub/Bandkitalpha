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

type ChatContextMeta = {
  kind: 'project' | 'direct' | 'safety';
  title: string;
  chips: string[];
  copy: string;
  links: Array<{ route: string; icon: string; title: string; meta: string }>;
  visibilityTitle: string;
  visibilityCopy: string;
  visibilityChips: string[];
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

function currentChatId(ctx: AppContext): string {
  return ctx.match.params.chatId ?? ctx.path.split('/').filter(Boolean).at(-1) ?? 'c1';
}

function chatContextMeta(ctx: AppContext): ChatContextMeta {
  const id = currentChatId(ctx);
  if (id === 'c2') {
    return {
      kind: 'direct',
      title: 'Личный чат с Mira Voice',
      chips: ['Личный', 'Trusted', 'Файлы'],
      copy: 'Это личный диалог. Он не даёт доступ к проектным документам или workspace, но может быть связан с будущим приглашением или обменом файлами.',
      links: [
        { route: '/profile/p2', icon: '●', title: 'Mira Voice', meta: 'Профиль · доверенный контакт' },
        { route: '/documents/d3', icon: '▤', title: 'Вокальные файлы', meta: 'Документ · личный обмен' },
        { route: '/events/e2', icon: '◷', title: 'Клубный концерт', meta: 'Возможное событие · без автодоступа' },
      ],
      visibilityTitle: 'Кто видит сообщения',
      visibilityCopy: 'Только участники личного диалога. Дружба или подписка не открывают этот чат другим пользователям.',
      visibilityChips: ['Личный чат', 'Trusted', 'Без внешних ссылок'],
    };
  }
  if (id === 'c3') {
    return {
      kind: 'safety',
      title: 'Проверка подозрительного контакта',
      chips: ['Личный', 'Safety', 'Link policy'],
      copy: 'Этот чат помечен как потенциально подозрительный. Он нужен для проверки контакта, блокировки внешних ссылок и передачи жалобы в модерацию при необходимости.',
      links: [
        { route: '/complaints/new', icon: '!', title: 'Пожаловаться', meta: 'Safety flow · сохранить контекст' },
        { route: '/moderation', icon: '⚑', title: 'Очередь модерации', meta: 'Для модераторов · проверка риска' },
        { route: '/settings/security', icon: '◇', title: 'Безопасность', meta: '2FA · защита аккаунта' },
      ],
      visibilityTitle: 'Что ограничено',
      visibilityCopy: 'Внешние ссылки, просьбы об оплате вне платформы и подозрительные контакты должны блокироваться или отправляться на проверку.',
      visibilityChips: ['Ссылка заблокирована', 'Report ready', 'Не платить вне платформы'],
    };
  }
  return {
    kind: 'project',
    title: 'Групповой чат проекта и события',
    chips: ['Проектный', 'Событие', 'Документы'],
    copy: 'Этот чат связан с проектом, ближайшим событием и рабочими документами. Сообщения видят только участники соответствующего контекста, а внешние ссылки ограничены политикой безопасности.',
    links: [
      { route: '/bands/b1', icon: '♬', title: 'Northern Lights Band', meta: 'Проект · участники и менеджеры' },
      { route: '/events/e1', icon: '◷', title: 'Главная репетиция', meta: 'Событие · участники события' },
      { route: '/documents/d1', icon: '▤', title: 'Технический райдер', meta: 'Документ · чтение по роли' },
    ],
    visibilityTitle: 'Кто видит сообщения',
    visibilityCopy: 'Участники проекта/события с нужной ролью. Подписка или дружба сами по себе доступ к чату не дают.',
    visibilityChips: ['Участники', 'Менеджер', 'Без внешних ссылок'],
  };
}

function chatRoomLogisticsContext(ctx: AppContext): string {
  const meta = chatContextMeta(ctx);
  const chipHtml = meta.chips.map((chip, index) => `<span class="bk-badge${index === 0 ? ' bk-badge-positive' : ''}">${chip}</span>`).join('');
  const linkHtml = meta.links.map((link) => `<a class="bk-chat-context-link" href="${link.route}" data-route="${link.route}"><span class="bk-chat-context-icon" aria-hidden="true">${link.icon}</span><span><strong>${link.title}</strong><small>${link.meta}</small></span></a>`).join('');
  const visibilityChips = meta.visibilityChips.map((chip, index) => `<span class="bk-badge${index === 0 ? ' bk-badge-positive' : index === 2 ? ' bk-badge-warning' : ''}">${chip}</span>`).join('');
  return `<section class="bk-card bk-chat-context-card" data-chat-kind="${meta.kind}" aria-label="Контекст чата"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Контекст чата</div><h3 class="bk-card-title">${meta.title}</h3></div><div class="bk-chip-row">${chipHtml}</div></div><p class="bk-state-copy">${meta.copy}</p><div class="bk-card-grid bk-card-grid-3">${linkHtml}</div><section class="bk-profile-feed-policy"><div><strong>${meta.visibilityTitle}</strong><span>${meta.visibilityCopy}</span></div><div class="bk-chip-row">${visibilityChips}</div></section></section>`;
}

function chatUnreadIndex(ctx: AppContext): number {
  const id = currentChatId(ctx);
  if (id === 'c3') return 2;
  if (id === 'c2') return 0;
  return 1;
}

function chatHistoryFilters(ctx: AppContext): string[] {
  const base = ['Все', 'Непрочитанные', 'Упоминания', 'Файлы', 'Документы', 'Закреплённые'];
  if (chatContextMeta(ctx).kind === 'safety') return [...base, 'Риски', 'Ссылки', 'Жалобы'];
  return base;
}

function chatPinnedText(ctx: AppContext): { title: string; body: string; meta: string } {
  const kind = chatContextMeta(ctx).kind;
  if (kind === 'direct') {
    return {
      title: 'Закреплено: обмен файлами',
      body: 'Вокальные демо и материалы обсуждаются в личном контексте, без открытия доступа к проектному workspace.',
      meta: 'Pinned · личный чат',
    };
  }
  if (kind === 'safety') {
    return {
      title: 'Закреплено: безопасность',
      body: 'Не переходить по внешним ссылкам и не переводить оплату вне платформы. При риске — оформить жалобу с контекстом сообщения.',
      meta: 'Pinned · safety',
    };
  }
  return {
    title: 'Закреплено: рабочее решение',
    body: 'Репетиция привязана к событию, актуальный райдер лежит в документах, спорные изменения обсуждаем в этом чате.',
    meta: 'Pinned · проект/событие',
  };
}

function chatHistoryChrome(ctx: AppContext): string {
  const filters = chatHistoryFilters(ctx).map((item, index) => `<button class="bk-chat-history-filter${index === 0 ? ' is-active' : ''}" type="button">${item}</button>`).join('');
  const pinned = chatPinnedText(ctx);
  return `<section class="bk-chat-history-toolbar" aria-label="Навигация по истории чата"><div class="bk-chat-history-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Поиск в чате" placeholder="Поиск в чате, документах и решениях" /></div><div class="bk-chat-history-filters">${filters}</div></section><section class="bk-chat-pinned-summary"><div><span>${pinned.meta}</span><strong>${pinned.title}</strong><p>${pinned.body}</p></div></section><button class="bk-chat-load-older" type="button">Загрузить старые сообщения</button><div class="bk-chat-date-divider">18 мая 2026</div>`;
}

function addDirectChatNavigation(root: HTMLElement, ctx: AppContext): void {
  if (ctx.match.route.path !== '/chats' && ctx.match.route.path !== '/chats/:chatId') return;
  const chatRows = Array.from(root.querySelectorAll<HTMLElement>('.bk-chat-room-card .bk-list > .bk-list-row, .bk-chat-policy-card + .bk-card .bk-list > .bk-list-row'));
  const activeChatId = currentChatId(ctx);
  chatRows.slice(0, CHAT_ROOM_IDS.length).forEach((row, index) => {
    const chatId = CHAT_ROOM_IDS[index];
    const route = `/chats/${chatId}`;
    row.dataset.chatNavigationReady = 'true';
    row.dataset.route = route;
    row.setAttribute('role', 'link');
    row.setAttribute('tabindex', '0');
    row.classList.add('bk-chat-nav-row');
    if (ctx.match.route.path === '/chats/:chatId' && chatId === activeChatId) {
      row.classList.add('is-active');
      row.setAttribute('aria-current', 'true');
    } else {
      row.classList.remove('is-active');
      row.removeAttribute('aria-current');
    }
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        row.click();
      }
    });
  });
}

function moveComposerIntoChatThread(chatRoom: HTMLElement, thread: HTMLElement): HTMLElement | null {
  const existingComposer = thread.querySelector<HTMLElement>('[data-chat-composer="true"]');
  if (existingComposer) return existingComposer;

  const externalComposer = chatRoom.nextElementSibling instanceof HTMLElement ? chatRoom.nextElementSibling : null;
  if (!externalComposer || !externalComposer.querySelector('textarea')) return null;

  externalComposer.dataset.chatComposer = 'true';
  externalComposer.classList.add('bk-chat-composer-card', 'bk-chat-composer-inside-thread');
  thread.appendChild(externalComposer);
  return externalComposer;
}

function decorateChatMessageHistory(root: HTMLElement, ctx: AppContext): void {
  if (ctx.match.route.path !== '/chats/:chatId') return;
  const chatRoom = root.querySelector<HTMLElement>('.bk-chat-room-card');
  const thread = root.querySelector<HTMLElement>('.bk-chat-thread');
  if (!chatRoom || !thread) return;

  if (!thread.querySelector('.bk-chat-history-toolbar')) {
    thread.insertAdjacentHTML('afterbegin', chatHistoryChrome(ctx));
  }

  const composerCard = moveComposerIntoChatThread(chatRoom, thread);
  const messages = Array.from(thread.querySelectorAll<HTMLElement>('.bk-social-card'));
  const unreadIndex = Math.min(chatUnreadIndex(ctx), Math.max(messages.length - 1, 0));

  messages.forEach((message, index) => {
    message.classList.add('bk-chat-message-card');
    message.dataset.messageIndex = String(index);
    message.id = `chat-message-m${index + 1}`;
    message.dataset.replyAuthor = message.querySelector('.bk-card-title')?.textContent?.trim() ?? 'Сообщение';
    message.dataset.replyBody = message.querySelector('.bk-card-body')?.textContent?.trim() ?? '';

    if (index === unreadIndex) {
      message.classList.add('bk-chat-first-unread');
      message.dataset.chatUnreadAnchor = 'true';
      if (!message.previousElementSibling?.classList.contains('bk-chat-unread-divider')) {
        message.insertAdjacentHTML('beforebegin', '<div class="bk-chat-unread-divider" data-chat-unread-anchor>Новые сообщения</div>');
      }
    }

    if (!message.querySelector('.bk-chat-message-actions')) {
      message.insertAdjacentHTML('beforeend', `<footer class="bk-chat-message-actions"><a class="bk-chat-anchor-link" href="#chat-message-m${index + 1}" aria-label="Ссылка на сообщение">#m${index + 1}</a><button class="bk-chat-reply-action" type="button" data-chat-reply-index="${index}">↩ Ответить</button></footer>`);
    }
  });

  if (composerCard && !composerCard.querySelector('[data-chat-reply-context]')) {
    composerCard.insertAdjacentHTML('afterbegin', '<div class="bk-chat-reply-context" data-chat-reply-context hidden><div><span>Ответ с контекстом</span><strong data-chat-reply-author></strong><p data-chat-reply-body></p></div><button type="button" data-chat-reply-clear aria-label="Убрать контекст ответа">×</button></div>');
  }

  thread.querySelectorAll<HTMLButtonElement>('[data-chat-reply-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.chatReplyIndex ?? '-1');
      const source = messages[index];
      const replyContext = root.querySelector<HTMLElement>('[data-chat-reply-context]');
      if (!source || !replyContext) return;
      replyContext.hidden = false;
      const authorNode = replyContext.querySelector<HTMLElement>('[data-chat-reply-author]');
      const bodyNode = replyContext.querySelector<HTMLElement>('[data-chat-reply-body]');
      if (authorNode) authorNode.textContent = source.dataset.replyAuthor ?? 'Сообщение';
      if (bodyNode) bodyNode.textContent = source.dataset.replyBody ?? '';
      composerCard?.querySelector<HTMLTextAreaElement>('textarea')?.focus();
    });
  });

  root.querySelector<HTMLButtonElement>('[data-chat-reply-clear]')?.addEventListener('click', () => {
    const replyContext = root.querySelector<HTMLElement>('[data-chat-reply-context]');
    if (replyContext) replyContext.hidden = true;
  });
}

function scrollChatToUnread(root: HTMLElement): void {
  const target = root.querySelector<HTMLElement>('[data-chat-unread-anchor]');
  if (!target) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
  });
}

function decorateRenderedPage(root: HTMLElement, ctx: AppContext): void {
  if (ctx.match.route.path === '/chats/:chatId') {
    const chatRoom = root.querySelector<HTMLElement>('.bk-chat-room-card');
    if (chatRoom && !root.querySelector('.bk-chat-context-card')) {
      chatRoom.insertAdjacentHTML('beforebegin', chatRoomLogisticsContext(ctx));
    }
  }
  addDirectChatNavigation(root, ctx);
  decorateChatMessageHistory(root, ctx);
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

    if (ctx.match.route.path === '/chats/:chatId' && options.scrollMode !== 'restore') {
      scrollChatToUnread(root);
    } else if (options.scrollMode === 'top') {
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