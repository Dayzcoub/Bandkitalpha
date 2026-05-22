export class PermissionService {
  canCreateEntity(actor) {
    return Boolean(actor && actor.id && actor.status !== 'blocked' && actor.status !== 'deleted');
  }

  canViewEntity(actor, entity) {
    if (!entity || entity.status === 'deleted' || entity.status === 'anonymized') {
      return false;
    }

    if (entity.visibility === 'public' || entity.visibility === 'registered') {
      return true;
    }

    return Boolean(actor && actor.id);
  }

  canManageEntity(actor, membership) {
    if (!actor || !actor.id || !membership || membership.status !== 'active') {
      return false;
    }

    return ['owner', 'admin', 'manager'].includes(membership.role);
  }

  canViewRoom() {
    return false;
  }

  canWriteMessage() {
    return false;
  }

  canViewDocument() {
    return false;
  }

  canExportDocument() {
    return false;
  }
}

export const permissionService = new PermissionService();
