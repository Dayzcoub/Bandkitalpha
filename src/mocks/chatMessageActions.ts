import type { MockChatPolicyPreview } from './chatPolicy.js';

export type MockChatMessageActionId =
  | 'reply'
  | 'quote'
  | 'pin'
  | 'edit'
  | 'delete_for_me'
  | 'delete_for_everyone'
  | 'request_delete'
  | 'report'
  | 'add_safety_context';

export interface MockChatMessageAction {
  id: MockChatMessageActionId;
  label: string;
  tone: 'neutral' | 'warning' | 'danger';
  enabled: boolean;
  reason?: string;
}

export interface MockChatMessageActionContext {
  isOwnMessage: boolean;
  isReadOnly?: boolean;
  isArchived?: boolean;
  isReported?: boolean;
  isPinned?: boolean;
  isSystemMessage?: boolean;
}

function action(
  id: MockChatMessageActionId,
  label: string,
  options: Partial<Pick<MockChatMessageAction, 'tone' | 'enabled' | 'reason'>> = {},
): MockChatMessageAction {
  return {
    id,
    label,
    tone: options.tone ?? 'neutral',
    enabled: options.enabled ?? true,
    reason: options.reason,
  };
}

function roomBlocksWriting(policy: MockChatPolicyPreview, context: MockChatMessageActionContext): boolean {
  return !policy.canWrite || context.isReadOnly === true || context.isArchived === true || policy.status !== 'active';
}

function disabledWriteReason(policy: MockChatPolicyPreview, context: MockChatMessageActionContext): string {
  if (context.isArchived === true || policy.status === 'archived') return 'Чат в архиве: новые действия записи недоступны.';
  if (context.isReadOnly === true || policy.status === 'read_only') return 'Чат доступен только для чтения.';
  if (policy.status === 'restricted') return 'Доступ к действиям ограничен политикой чата.';
  return 'Нет права писать в этот чат.';
}

function canEditOwnMessage(policy: MockChatPolicyPreview, context: MockChatMessageActionContext): boolean {
  if (!context.isOwnMessage || context.isSystemMessage === true || context.isReported === true || context.isPinned === true) return false;
  if (roomBlocksWriting(policy, context)) return false;
  return policy.kind !== 'safety';
}

function editReason(policy: MockChatPolicyPreview, context: MockChatMessageActionContext): string | undefined {
  if (!context.isOwnMessage) return 'Редактировать может только автор сообщения.';
  if (context.isSystemMessage === true) return 'Системные сообщения нельзя редактировать обычным действием.';
  if (context.isReported === true) return 'Сообщение с жалобой сохраняет оригинал для проверки.';
  if (context.isPinned === true) return 'Закреплённое сообщение нельзя тихо переписать.';
  if (roomBlocksWriting(policy, context)) return disabledWriteReason(policy, context);
  if (policy.kind === 'safety') return 'Safety-контекст нельзя переписывать обычным редактированием.';
  return undefined;
}

export function chatMessageActionsForPolicy(
  policy: MockChatPolicyPreview,
  context: MockChatMessageActionContext,
): MockChatMessageAction[] {
  const writeBlocked = roomBlocksWriting(policy, context);
  const writeReason = writeBlocked ? disabledWriteReason(policy, context) : undefined;
  const actions: MockChatMessageAction[] = [];

  if (!context.isSystemMessage) {
    actions.push(action('reply', 'Ответить', { enabled: !writeBlocked, reason: writeReason }));
    actions.push(action('quote', 'Цитировать', { enabled: !writeBlocked, reason: writeReason }));
  }

  if (policy.canPin && !context.isSystemMessage) {
    actions.push(action('pin', context.isPinned ? 'Закреплено' : 'Закрепить', { enabled: !writeBlocked, reason: writeReason }));
  }

  const editEnabled = canEditOwnMessage(policy, context);
  if (context.isOwnMessage && !context.isSystemMessage) {
    actions.push(action('edit', 'Редактировать', { enabled: editEnabled, reason: editEnabled ? undefined : editReason(policy, context) }));
  }

  actions.push(action('delete_for_me', 'Удалить у себя'));

  if (policy.canDeleteForEveryone && context.isOwnMessage && !context.isSystemMessage && !context.isReported) {
    actions.push(action('delete_for_everyone', 'Удалить для всех', { tone: 'danger' }));
  } else if (policy.canRequestDelete && !context.isSystemMessage) {
    actions.push(action('request_delete', 'Запросить удаление', { tone: 'warning' }));
  }

  if (policy.kind === 'safety') {
    actions.push(action('add_safety_context', 'Добавить контекст', { tone: 'warning', enabled: !writeBlocked, reason: writeReason }));
  }

  if (policy.canReport && !context.isSystemMessage) {
    actions.push(action('report', 'Пожаловаться', { tone: 'warning' }));
  }

  return actions;
}
