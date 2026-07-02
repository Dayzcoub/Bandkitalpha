export type MockChatKind =
  | 'direct'
  | 'free_group'
  | 'project'
  | 'event'
  | 'organization'
  | 'document'
  | 'safety'
  | 'admin_role';

export type MockChatParentEntityType =
  | 'profile'
  | 'project'
  | 'event'
  | 'organization'
  | 'document'
  | 'case'
  | 'role';

export type MockChatStatus = 'active' | 'read_only' | 'archived' | 'restricted';
export type MockChatNotificationMode = 'normal' | 'muted' | 'digest' | 'critical_only';

export interface MockChatPolicyPreview {
  id: string;
  kind: MockChatKind;
  parentEntityType?: MockChatParentEntityType;
  parentEntityId?: string;
  status: MockChatStatus;
  canWrite: boolean;
  canAttach: boolean;
  canPin: boolean;
  canDeleteForEveryone: boolean;
  canRequestDelete: boolean;
  canReport: boolean;
  notificationMode: MockChatNotificationMode;
  policyNote: string;
}

const entityChatBase = {
  status: 'active',
  canWrite: true,
  canAttach: true,
  canPin: false,
  canDeleteForEveryone: false,
  canRequestDelete: true,
  canReport: true,
  notificationMode: 'critical_only',
} as const;

const directChatBase = {
  status: 'active',
  canWrite: true,
  canAttach: true,
  canPin: false,
  canDeleteForEveryone: true,
  canRequestDelete: false,
  canReport: true,
  notificationMode: 'normal',
} as const;

const safetyChatBase = {
  status: 'active',
  canWrite: true,
  canAttach: false,
  canPin: false,
  canDeleteForEveryone: false,
  canRequestDelete: false,
  canReport: true,
  notificationMode: 'critical_only',
} as const;

export const mockChatPolicyById: Record<string, MockChatPolicyPreview> = {
  c1: {
    ...entityChatBase,
    id: 'c1',
    kind: 'project',
    parentEntityType: 'project',
    parentEntityId: 'b1',
    policyNote: 'Project chat: access follows project membership; normal users cannot delete shared working history.',
  },
  c2: {
    ...directChatBase,
    id: 'c2',
    kind: 'direct',
    parentEntityType: 'profile',
    parentEntityId: 'p2',
    policyNote: 'Direct chat: local hide/delete/block/report rules are allowed; project documents are not unlocked by the dialog.',
  },
  c3: {
    ...safetyChatBase,
    id: 'c3',
    kind: 'safety',
    parentEntityType: 'case',
    parentEntityId: 'q1',
    policyNote: 'Safety chat: evidence and anchors must be preserved; normal delete-for-everyone is blocked.',
  },
  c4: {
    ...entityChatBase,
    id: 'c4',
    kind: 'project',
    parentEntityType: 'project',
    parentEntityId: 'b1',
    policyNote: 'Stage crew project chat: operational decisions stay in project history.',
  },
  c5: {
    ...entityChatBase,
    id: 'c5',
    kind: 'event',
    parentEntityType: 'event',
    parentEntityId: 'e2',
    policyNote: 'Event chat: users leave through event participation, not by leaving the chat separately.',
  },
  c6: {
    ...directChatBase,
    id: 'c6',
    kind: 'direct',
    parentEntityType: 'profile',
    parentEntityId: 'p2',
    policyNote: 'Direct file exchange: personal dialog does not grant workspace or entity-document access.',
  },
  c7: {
    ...entityChatBase,
    id: 'c7',
    kind: 'document',
    parentEntityType: 'document',
    parentEntityId: 'd1',
    policyNote: 'Document/rider chat: access and attachments follow document and entity permissions.',
  },
  c8: {
    ...entityChatBase,
    id: 'c8',
    kind: 'project',
    parentEntityType: 'project',
    parentEntityId: 'b1',
    notificationMode: 'digest',
    policyNote: 'Technical project chat: softer notification controls are allowed, but critical entity updates still bypass silence.',
  },
  c9: {
    ...safetyChatBase,
    id: 'c9',
    kind: 'safety',
    parentEntityType: 'case',
    parentEntityId: 'q2',
    policyNote: 'Moderation watch: normal users cannot destroy safety context by deleting or leaving the room.',
  },
  c10: {
    status: 'active',
    canWrite: true,
    canAttach: true,
    canPin: false,
    canDeleteForEveryone: true,
    canRequestDelete: false,
    canReport: true,
    notificationMode: 'normal',
    id: 'c10',
    kind: 'free_group',
    policyNote: 'Free group chat: generic leave chat is allowed; shared delete can be allowed only inside the free-group window.',
  },
  c11: {
    ...entityChatBase,
    id: 'c11',
    kind: 'organization',
    parentEntityType: 'organization',
    parentEntityId: 'org-studio-a',
    policyNote: 'Organization chat: role and organization membership drive access; no silent leave while role remains active.',
  },
  c12: {
    ...entityChatBase,
    id: 'c12',
    kind: 'event',
    parentEntityType: 'event',
    parentEntityId: 'e2',
    policyNote: 'Setlist event chat: updates should become system or important messages when operationally relevant.',
  },
  c13: {
    ...safetyChatBase,
    id: 'c13',
    kind: 'safety',
    parentEntityType: 'case',
    parentEntityId: 'payment-safety-check',
    policyNote: 'Payment safety chat: off-platform payment context must be preserved for moderation/audit.',
  },
  c14: {
    ...entityChatBase,
    id: 'c14',
    kind: 'admin_role',
    parentEntityType: 'role',
    parentEntityId: 'orchestra-admin',
    canPin: true,
    policyNote: 'Admin role chat: access follows role membership; exit requires role transfer/removal policy.',
  },
  c15: {
    ...directChatBase,
    id: 'c15',
    kind: 'direct',
    parentEntityType: 'profile',
    parentEntityId: 'new-guitarist-trial',
    policyNote: 'Direct trial chat: personal interaction rules apply until it is attached to a project/event workflow.',
  },
};

export function mockChatPolicyForRoom(chatId: string): MockChatPolicyPreview {
  return mockChatPolicyById[chatId] ?? {
    ...entityChatBase,
    id: chatId,
    kind: 'project',
    parentEntityType: 'project',
    status: 'restricted',
    canWrite: false,
    canAttach: false,
    canPin: false,
    canRequestDelete: false,
    notificationMode: 'critical_only',
    policyNote: 'Fallback restricted policy until the backend resolves the room context.',
  };
}
