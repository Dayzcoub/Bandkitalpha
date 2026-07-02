type ChatStateKind = 'empty-list' | 'empty-thread' | 'loading' | 'error' | 'not-selected';

type ChatStateConfig = {
  icon: string;
  title: string;
  copy: string;
  actionLabel?: string;
  tone?: 'neutral' | 'danger';
};

const CHAT_ROUTE_PATTERN = /^\/chats(?:\/[^/]+)?$/;
const CHAT_STATE_SURFACE_SELECTOR = '[data-chat-state-surface="true"]';

const CHAT_STATE_CONFIG: Record<ChatStateKind, ChatStateConfig> = {
  'empty-list': {
    icon: '◇',
    title: 'Чатов пока нет',
    copy: 'Когда появятся рабочие, личные или safety-диалоги, они будут показаны здесь.',
  },
  'empty-thread': {
    icon: '💬',
    title: 'В этом чате пока пусто',
    copy: 'Первое сообщение, вложение или системное событие появится в этой области.',
  },
  loading: {
    icon: '…',
    title: 'Загружаем чат',
    copy: 'Получаем список диалогов и историю сообщений.',
  },
  error: {
    icon: '!',
    title: 'Чат не загрузился',
    copy: 'Не удалось получить данные. Когда backend будет подключён, здесь сработает повторная загрузка.',
    actionLabel: 'Повторить позже',
    tone: 'danger',
  },
  'not-selected': {
    icon: '↗',
    title: 'Выберите чат',
    copy: 'Откройте диалог из списка слева. На мобильном это остаётся схемой “список чатов → окно чата → назад”.',
  },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[char] ?? char;
  });
}

function explicitStateFor(surface: HTMLElement, fallbackEmptyKind: ChatStateKind): ChatStateKind | null {
  const state = surface.dataset.chatState;
  if (state === 'loading' || state === 'error' || state === 'not-selected') return state;
  if (state === 'empty') return fallbackEmptyKind;
  return null;
}

function stateHtml(kind: ChatStateKind): string {
  const config = CHAT_STATE_CONFIG[kind];
  const toneClass = config.tone === 'danger' ? ' is-danger' : '';
  const actionHtml = config.actionLabel
    ? `<button class="bk-button bk-button-secondary bk-chat-state-action" type="button" disabled>${escapeHtml(config.actionLabel)}</button>`
    : '';

  return `<section class="bk-chat-state-card${toneClass}" data-chat-state-surface="true" data-chat-state-kind="${kind}" aria-live="polite"><span class="bk-chat-state-icon" aria-hidden="true">${escapeHtml(config.icon)}</span><h3 class="bk-chat-state-title">${escapeHtml(config.title)}</h3><p class="bk-chat-state-copy">${escapeHtml(config.copy)}</p>${actionHtml}</section>`;
}

function directStateSurface(surface: HTMLElement): HTMLElement | null {
  return Array.from(surface.children).find((child): child is HTMLElement => child instanceof HTMLElement && child.matches(CHAT_STATE_SURFACE_SELECTOR)) ?? null;
}

function setRenderedState(surface: HTMLElement, kind: ChatStateKind | null): void {
  const existing = directStateSurface(surface);
  if (!kind) {
    existing?.remove();
    surface.classList.remove('is-chat-state-active');
    delete surface.dataset.chatRenderedState;
    return;
  }

  if (existing?.dataset.chatStateKind === kind) {
    surface.classList.add('is-chat-state-active');
    surface.dataset.chatRenderedState = kind;
    return;
  }

  existing?.remove();
  surface.insertAdjacentHTML('beforeend', stateHtml(kind));
  surface.classList.add('is-chat-state-active');
  surface.dataset.chatRenderedState = kind;
}

function hasVisibleChatRows(list: HTMLElement): boolean {
  return Array.from(list.children).some((child) => {
    if (!(child instanceof HTMLElement)) return false;
    if (child.hidden || child.matches(CHAT_STATE_SURFACE_SELECTOR)) return false;
    return child.classList.contains('bk-list-row') || child.dataset.route?.startsWith('/chats/') === true;
  });
}

function hasVisibleMessages(thread: HTMLElement): boolean {
  return Array.from(thread.children).some((child) => {
    if (!(child instanceof HTMLElement)) return false;
    if (child.hidden || child.matches(CHAT_STATE_SURFACE_SELECTOR)) return false;
    return child.classList.contains('bk-social-card') || child.classList.contains('bk-chat-message-card') || child.classList.contains('bk-chat-stress-message');
  });
}

function decorateChatList(list: HTMLElement): void {
  const explicitState = explicitStateFor(list, 'empty-list');
  if (explicitState) {
    setRenderedState(list, explicitState);
    return;
  }

  setRenderedState(list, hasVisibleChatRows(list) ? null : 'empty-list');
}

function decorateChatThread(thread: HTMLElement): void {
  const explicitState = explicitStateFor(thread, 'empty-thread');
  if (explicitState) {
    setRenderedState(thread, explicitState);
    return;
  }

  setRenderedState(thread, hasVisibleMessages(thread) ? null : 'empty-thread');
}

function decorateMissingThread(layout: HTMLElement): void {
  if (layout.querySelector('.bk-chat-thread, [data-chat-state-surface="true"]')) return;
  const placeholder = document.createElement('div');
  placeholder.className = 'bk-chat-thread bk-chat-thread-placeholder';
  placeholder.dataset.chatState = 'not-selected';
  layout.appendChild(placeholder);
  decorateChatThread(placeholder);
}

function decorateChatStates(root: HTMLElement): void {
  if (!CHAT_ROUTE_PATTERN.test(window.location.pathname)) return;

  root.querySelectorAll<HTMLElement>('.bk-chat-policy-card + .bk-card .bk-list, .bk-chat-room-card .bk-chat-layout > .bk-list').forEach(decorateChatList);
  root.querySelectorAll<HTMLElement>('.bk-chat-thread').forEach(decorateChatThread);
  root.querySelectorAll<HTMLElement>('.bk-chat-layout[data-chat-state="not-selected"]').forEach(decorateMissingThread);
}

export function initChatEmptyStates(root: HTMLElement): void {
  decorateChatStates(root);

  const observer = new MutationObserver(() => decorateChatStates(root));
  observer.observe(root, { attributes: true, attributeFilter: ['data-chat-state', 'hidden'], childList: true, subtree: true });
}
