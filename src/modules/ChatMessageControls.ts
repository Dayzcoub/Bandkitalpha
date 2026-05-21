const LONG_PRESS_DELAY_MS = 520;

let longPressTimer: number | null = null;
let longPressTarget: HTMLElement | null = null;
let longPressPointerId: number | null = null;

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

function isTouchLikePointer(event: PointerEvent): boolean {
  return event.pointerType === 'touch' || event.pointerType === 'pen' || window.matchMedia('(pointer: coarse)').matches;
}

function clearLongPressTimer(): void {
  if (longPressTimer !== null) {
    window.clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  longPressPointerId = null;
}

function closeOpenActions(root: HTMLElement, except?: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.bk-chat-message-card.is-chat-actions-open').forEach((message) => {
    if (message !== except) message.classList.remove('is-chat-actions-open');
  });
}

function messageAuthor(message: HTMLElement): string {
  return message.dataset.replyAuthor || message.querySelector<HTMLElement>('.bk-card-title')?.textContent?.trim() || 'Сообщение';
}

function messageBody(message: HTMLElement): string {
  return message.dataset.replyBody || message.querySelector<HTMLElement>('.bk-card-body')?.textContent?.trim() || 'Сообщение';
}

function messageTime(message: HTMLElement): string {
  return message.querySelector<HTMLElement>('.bk-meta')?.textContent?.trim() || '';
}

function ensurePinnedStrip(thread: HTMLElement): HTMLButtonElement {
  const existing = thread.querySelector<HTMLButtonElement>('.bk-chat-pinned-strip');
  if (existing) return existing;

  const strip = document.createElement('button');
  strip.className = 'bk-chat-pinned-strip';
  strip.type = 'button';
  strip.dataset.chatAction = 'jump-pinned-message';
  strip.setAttribute('aria-label', 'Перейти к закреплённому сообщению');
  const loadOlder = thread.querySelector('.bk-chat-load-older');
  thread.insertBefore(strip, loadOlder ?? thread.firstChild);
  return strip;
}

function pinMessage(message: HTMLElement): void {
  const thread = message.closest<HTMLElement>('.bk-chat-thread');
  if (!thread || !message.id) return;

  const author = messageAuthor(message);
  const body = messageBody(message);
  const time = messageTime(message);
  const strip = ensurePinnedStrip(thread);

  strip.dataset.pinnedMessageId = message.id;
  strip.dataset.pinnedAuthor = author;
  strip.dataset.pinnedCreatedAt = time;
  strip.innerHTML = `<span>Закреплено</span><strong>${escapeHtml(author)}</strong><small>${escapeHtml(body)}</small>`;

  thread.querySelectorAll<HTMLElement>('.bk-chat-message-card.is-pinned-message').forEach((item) => item.classList.remove('is-pinned-message'));
  message.classList.add('is-pinned-message');

  thread.querySelectorAll<HTMLButtonElement>('[data-chat-control="pin-message"]').forEach((button) => {
    const isPinned = button.closest('.bk-chat-message-card') === message;
    button.textContent = isPinned ? 'Закреплено' : 'Закрепить';
    button.setAttribute('aria-pressed', String(isPinned));
  });
}

function deleteMessage(message: HTMLElement): void {
  const thread = message.closest<HTMLElement>('.bk-chat-thread');
  const body = message.querySelector<HTMLElement>('.bk-card-body');
  const actions = message.querySelector<HTMLElement>('.bk-chat-message-actions');
  const pinnedStrip = thread?.querySelector<HTMLButtonElement>('.bk-chat-pinned-strip');

  message.classList.add('bk-chat-message-deleted');
  message.classList.remove('is-chat-actions-open');
  message.dataset.chatDeleted = 'true';
  if (body) body.innerHTML = '<p>Сообщение удалено.</p>';
  actions?.remove();

  if (pinnedStrip?.dataset.pinnedMessageId === message.id) {
    pinnedStrip.querySelector('small')?.replaceChildren(document.createTextNode('Закреплённое сообщение удалено.'));
  }
}

function decorateChatMessages(root: HTMLElement): void {
  const messages = Array.from(root.querySelectorAll<HTMLElement>('.bk-chat-thread .bk-chat-message-card'));
  messages.forEach((message) => {
    if (message.dataset.chatDeleted === 'true') return;
    message.dataset.chatLongPressActions = 'true';
    const actions = message.querySelector<HTMLElement>('.bk-chat-message-actions');
    if (!actions || actions.dataset.chatControlsReady === 'true') return;

    actions.dataset.chatControlsReady = 'true';
    actions.insertAdjacentHTML(
      'beforeend',
      `<button class="bk-chat-pin-action" type="button" data-chat-control="pin-message" aria-pressed="false">Закрепить</button><button class="bk-chat-delete-action" type="button" data-chat-control="delete-message">Удалить</button>`,
    );
  });
}

function jumpToPinnedMessage(button: HTMLButtonElement): void {
  const thread = button.closest<HTMLElement>('.bk-chat-thread');
  const id = button.dataset.pinnedMessageId;
  const target = id ? thread?.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : null;
  if (!target) return;
  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  target.classList.add('bk-chat-pinned-jump-highlight');
  window.setTimeout(() => target.classList.remove('bk-chat-pinned-jump-highlight'), 1400);
}

function startLongPress(root: HTMLElement, event: PointerEvent): void {
  if (!isTouchLikePointer(event)) return;
  const target = event.target instanceof Element ? event.target : null;
  if (!target || target.closest('button, a, input, textarea, select')) return;

  const message = target.closest<HTMLElement>('.bk-chat-message-card[data-chat-long-press-actions="true"]');
  if (!message || message.dataset.chatDeleted === 'true') return;

  clearLongPressTimer();
  longPressTarget = message;
  longPressPointerId = event.pointerId;
  longPressTimer = window.setTimeout(() => {
    if (!longPressTarget) return;
    closeOpenActions(root, longPressTarget);
    longPressTarget.classList.add('is-chat-actions-open');
    longPressTimer = null;
  }, LONG_PRESS_DELAY_MS);
}

function cancelLongPress(event?: PointerEvent): void {
  if (event && longPressPointerId !== null && event.pointerId !== longPressPointerId) return;
  clearLongPressTimer();
  longPressTarget = null;
}

export function initChatMessageControls(root: HTMLElement): void {
  decorateChatMessages(root);

  const observer = new MutationObserver(() => decorateChatMessages(root));
  observer.observe(root, { childList: true, subtree: true });

  root.addEventListener('pointerdown', (event) => startLongPress(root, event));
  root.addEventListener('pointerup', cancelLongPress);
  root.addEventListener('pointercancel', cancelLongPress);
  root.addEventListener('pointermove', cancelLongPress);

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>('[data-chat-control], [data-chat-action="jump-pinned-message"]');
    if (!button) {
      if (!target?.closest('.bk-chat-message-card')) closeOpenActions(root);
      return;
    }

    if (button.dataset.chatAction === 'jump-pinned-message') {
      jumpToPinnedMessage(button);
      return;
    }

    const message = button.closest<HTMLElement>('.bk-chat-message-card');
    if (!message) return;

    if (button.dataset.chatControl === 'pin-message') {
      pinMessage(message);
      return;
    }

    if (button.dataset.chatControl === 'delete-message') {
      deleteMessage(message);
    }
  });
}
