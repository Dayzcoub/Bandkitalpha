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

  // Reading a room requires an active/read-only membership in it, and the room
  // must not be hidden. Room membership is the tenant boundary here (IDOR is the
  // primary risk — Security Standard §2).
  canViewRoom(actor, membership, room) {
    if (!actor || !actor.id || !room || room.status === 'hidden') {
      return false;
    }
    return Boolean(membership && ['active', 'read_only'].includes(membership.status));
  }

  // Posting requires an active membership (read_only members cannot write) and
  // an active room (read_only/archived/hidden rooms reject writes).
  canWriteMessage(actor, membership, room) {
    if (!actor || !actor.id || !room || room.status !== 'active') {
      return false;
    }
    return Boolean(membership && membership.status === 'active');
  }

  // Moderating a room (e.g. pinning messages) requires an active managing
  // membership (owner/admin/manager) in an active room.
  canModerateRoom(actor, membership, room) {
    if (!actor || !actor.id || !room || room.status !== 'active') {
      return false;
    }
    return Boolean(membership && membership.status === 'active'
      && ['owner', 'admin', 'manager'].includes(membership.role));
  }

  // Creating a document under an entity requires a managing membership.
  canCreateDocument(actor, membership) {
    return this.canManageEntity(actor, membership);
  }

  // Viewing an entity's documents requires an active membership in that entity.
  // Fine-grained per-document ACLs (document_permissions) are a later slice.
  canViewEntityDocuments(actor, membership) {
    return Boolean(actor && actor.id && membership && membership.status === 'active');
  }

  canExportDocument() {
    return false;
  }
}

export const permissionService = new PermissionService();
