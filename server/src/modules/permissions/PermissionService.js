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

  // Managing your own individual party (e.g. your professions) only requires an
  // active account; the party is always derived from the session, never input.
  canManageOwnParty(actor) {
    return Boolean(actor && actor.id && actor.status !== 'blocked' && actor.status !== 'deleted');
  }

  canManageEntity(actor, membership) {
    if (!actor || !actor.id || !membership || membership.status !== 'active') {
      return false;
    }

    return ['owner', 'admin', 'manager'].includes(membership.role);
  }

  // Creating events for an entity requires a managing membership in that entity.
  canCreateEvent(actor, membership) {
    return this.canManageEntity(actor, membership);
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
