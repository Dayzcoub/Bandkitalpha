import { mockChatPolicyForRoom } from '../mocks/chatPolicy.js';
import { chatMessageActionsForPolicy, type MockChatMessageAction } from '../mocks/chatMessageActions.js';

const LONG_PRESS_DELAY_MS = 520;
const CHAT_ROUTE_PATTERN = /^\/chats(?:\/([^/]+))?$/;
const MOCK_CURRENT_AUTHOR = 'Alex Rhythm';

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

function currentChatId(): string {
  const match = window.location.pathname.match(CHAT_ROUTE_PATTERN);
  return match?.[1] ? decodeURIComponent(match[1]) : 'c1';
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

function messageChatId(message: HTMLElement): string {
  return message.closest<HTMLElement>('.bk-chat-thread')?.dataset.chatId || currentChatId();
}

function messageIsOwn(message: HTMLElement): boolean {
  return messageAuthor(message) === MOCK_CURRENT_AUTHOR;
}

function messagePolicyActions(message: HTMLElement): MockChatMessageAction[] {
  const thread = message.closest<HTMLElement>('.bk-chat-thread');
  const policy = mockChatPolicyForRoom(messageChatId(message));
  const status = thread?.dataset.chatStatus || policy.status;

  const actions = chatMessageActionsForPolicy(policy, {
    isOwnMessage: messageIsOwn(message),
    isReadOnly: status === 'read_only' || status === 'restricted',
    isArchived: status === 'archived',
    isReported: message.dataset.chatReported === 'true',
    isPinned: message.classList.contains('is-pinned-message'),
    isSystemMessage: message.dataset.chatMessageType === 'system',
  });

  const visibleActions: MockChatMessageAction[] = [];
  const pinAction = actions.find((item) => item.id === 'pin' && item.enabled);
  if (pinAction) visibleActions.push(pinAction);

  const deleteForMeAction = actions.find((item) => item.id === 'delete_for_me');
  if (deleteForMeAction) visibleActions.push(deleteForMeAction);

  const contextAction =
    actions.find((item) => item.id === 'delete_for_everyone')
    ?? actions.find((item) => item.id === 'request_delete')
    ?? actions.find((item) => item.id === 'add_safety_context');
  if (contextAction) visibleActions.push(contextAction);

  const reportAction = actions.find((item) => item.id === 'report');
  if (reportAction) visibleActions.push(reportAction);

  return visibleActions;
}

function actionButtonClass(action: MockChatMessageAction): string {
  if (action.id === 'pin') return 'bk-chat-pin-action';
  if (action.id === 'delete_for_me' || action.id === 'delete_for_everyone') return 'bk-chat-delete-action';
  return 'bk-chat-reply-action';
}

function actionButtonLabel(action: MockChatMessageAction): string {
  if (action.id === 'request_delete') return 'Удалить?';
  if (action.id === 'add_safety_context') return 'Контекст';
  if (action.id === 'report') return 'Жалоба';
  return action.label;
}

function policyActionHtml(action: MockChatMessageAction): string {
  const control = action.id.replaceAll('_', '-');
  const disabled = action.enabled ? '' : ' disabled';
  const reason = action.reason ? ` title="${escapeHtml(action.reason)}"` : '';
  const pressed = action.id === 'pin' ? ' aria-pressed="false"' : '';
  return `<button class="${actionButtonClass(action)}" type="button" data-chat-control="${control}" data-chat-action-id="${action.id}"${pressed}${disabled}${reason}>${escapeHtml(actionButtonLabel(action))}</button>`;
}

function policyActionsHtml(message: HTMLElement): string {
  return messagePolicyActions(message).map(policyActionHtml).join('');
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

  thread.querySelectorAll<HTMLButtonElement>('[data-chat-control="pin"]').forEach((button) => {
    const isPinned = button.closest('.bk-chat-message-card') === message;
    button.textContent = isPinned ? 'Закреплено' : 'Закрепить';
    button.setAttribute('aria-pressed', String(isPinned));
  });
}

function deleteMessage(message: HTMLElement, placeholder = 'Сообщение скрыто у вас.'): void {
  const thread = message.closest<HTMLElement>('.bk-chat-thread');
  const body = message.querySelector<HTMLElement>('.bk-card-body');
  const actions = message.querySelector<HTMLElement>('.bk-chat-message-actions');
  const pinnedStrip = thread?.querySelector<HTMLButtonElement>('.bk-chat-pinned-strip');

  message.classList.add('bk-chat-message-deleted');
  message.classList.remove('is-chat-actions-open');
  message.dataset.chatDeleted = 'true';
  if (body) body.innerHTML = `<p>${escapeHtml(placeholder)}</p>`;
  actions?.remove();

  if (pinnedStrip?.dataset.pinnedMessageId === message.id) {
    pinnedStrip.querySelector('small')?.replaceChildren(document.createTextNode('Закреплённое сообщение удалено.'));
  }
}

function markMessageAction(message: HTMLElement, button: HTMLButtonElement, text: string): void {
  message.classList.remove('is-chat-actions-open');
  button.textContent = text;
  button.disabled = true;
}

function decorateChatMessages(root: HTMLElement): void {
  const messages = Array.from(root.querySelectorAll<HTMLElement>('.bk-chat-thread .bk-chat-message-card'));
  messages.forEach((message) => {
    if (message.dataset.chatDeleted === 'true') return;
    message.dataset.chatLongPressActions = 'true';
    const actions = message.querySelector<HTMLElement>('.bk-chat-message-actions');
    if (!actions || actions.dataset.chatControlsReady === 'true') return;

    actions.dataset.chatControlsReady = 'true';
    actions.insertAdjacentHTML('beforeend', policyActionsHtml(message));
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

    if (button.dataset.chatControl === 'pin') {
      pinMessage(message);
      return;
    }

    if (button.dataset.chatControl === 'delete-for-me') {
      deleteMessage(message, 'Сообщение скрыто у вас.');
      return;
    }

    if (button.dataset.chatControl === 'delete-for-everyone') {
      deleteMessage(message, 'Сообщение удалено автором.');
      return;
    }

    if (button.dataset.chatControl === 'request-delete') {
      markMessageAction(message, button, 'Запрос отправлен');
      return;
    }

    if (button.dataset.chatControl === 'add-safety-context') {
      markMessageAction(message, button, 'Контекст добавлен');
      return;
    }

    if (button.dataset.chatControl === 'report') {
      message.dataset.chatReported = 'true';
      markMessageAction(message, button, 'Жалоба отправлена');
    }
  });
}
