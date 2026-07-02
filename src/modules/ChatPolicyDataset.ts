import { mockChatPolicyForRoom } from '../mocks/chatPolicy.js';

const CHAT_ROUTE_PATTERN = /^\/chats(?:\/([^/]+))?$/;

function currentChatId(): string | null {
  const match = window.location.pathname.match(CHAT_ROUTE_PATTERN);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function applyPolicyDataset(target: HTMLElement, chatId: string): void {
  const policy = mockChatPolicyForRoom(chatId);

  target.dataset.chatId = chatId;
  target.dataset.chatKind = policy.kind;
  target.dataset.chatStatus = policy.status;
  target.dataset.chatNotificationMode = policy.notificationMode;
  target.dataset.chatCanWrite = String(policy.canWrite);
  target.dataset.chatCanAttach = String(policy.canAttach);
  target.dataset.chatCanPin = String(policy.canPin);
  target.dataset.chatCanDeleteForEveryone = String(policy.canDeleteForEveryone);
  target.dataset.chatCanRequestDelete = String(policy.canRequestDelete);
  target.dataset.chatCanReport = String(policy.canReport);

  if (policy.parentEntityType) target.dataset.chatParentEntityType = policy.parentEntityType;
  else delete target.dataset.chatParentEntityType;

  if (policy.parentEntityId) target.dataset.chatParentEntityId = policy.parentEntityId;
  else delete target.dataset.chatParentEntityId;
}

function decorateChatPolicyDataset(root: HTMLElement): void {
  const chatId = currentChatId();
  if (!chatId) return;

  root.querySelectorAll<HTMLElement>('.bk-chat-room-card, .bk-chat-thread').forEach((target) => {
    applyPolicyDataset(target, chatId);
  });
}

export function initChatPolicyDataset(root: HTMLElement): void {
  decorateChatPolicyDataset(root);

  const observer = new MutationObserver(() => decorateChatPolicyDataset(root));
  observer.observe(root, { childList: true, subtree: true });
}
