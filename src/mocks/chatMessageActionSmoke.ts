import { mockChatPolicyForRoom } from './chatPolicy.js';
import { chatMessageActionsForPolicy, type MockChatMessageActionId } from './chatMessageActions.js';

type MockChatMessageActionSmokeCase = {
  id: string;
  chatId: string;
  label: string;
  expectedActionIds: MockChatMessageActionId[];
  actualActionIds: MockChatMessageActionId[];
};

function actionIdsFor(chatId: string, context: Parameters<typeof chatMessageActionsForPolicy>[1]): MockChatMessageActionId[] {
  return chatMessageActionsForPolicy(mockChatPolicyForRoom(chatId), context).map((item) => item.id);
}

export const mockChatMessageActionSmokeCases: MockChatMessageActionSmokeCase[] = [
  {
    id: 'direct-own-message',
    chatId: 'c2',
    label: 'Direct own message keeps private-dialog actions including delete for everyone.',
    expectedActionIds: ['reply', 'quote', 'edit', 'delete_for_me', 'delete_for_everyone', 'report'],
    actualActionIds: actionIdsFor('c2', { isOwnMessage: true }),
  },
  {
    id: 'project-own-message',
    chatId: 'c1',
    label: 'Project own message uses request-delete instead of delete for everyone.',
    expectedActionIds: ['reply', 'quote', 'edit', 'delete_for_me', 'request_delete', 'report'],
    actualActionIds: actionIdsFor('c1', { isOwnMessage: true }),
  },
  {
    id: 'safety-own-message',
    chatId: 'c3',
    label: 'Safety own message blocks normal edit/delete-for-everyone and keeps safety context/report actions.',
    expectedActionIds: ['reply', 'quote', 'edit', 'delete_for_me', 'add_safety_context', 'report'],
    actualActionIds: actionIdsFor('c3', { isOwnMessage: true }),
  },
  {
    id: 'archived-project-message',
    chatId: 'c1',
    label: 'Archived project message keeps local cleanup/report path and disables write-like actions in helper output.',
    expectedActionIds: ['reply', 'quote', 'edit', 'delete_for_me', 'request_delete', 'report'],
    actualActionIds: actionIdsFor('c1', { isOwnMessage: true, isArchived: true }),
  },
  {
    id: 'system-message',
    chatId: 'c1',
    label: 'System message does not get ordinary reply/edit/delete/report actions.',
    expectedActionIds: ['delete_for_me'],
    actualActionIds: actionIdsFor('c1', { isOwnMessage: false, isSystemMessage: true }),
  },
];
