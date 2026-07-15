import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';

const DOCUMENT_TYPES = new Set([
  'rider', 'setlist', 'offer', 'contract_draft', 'receipt',
  'schedule', 'technical_plan', 'booking_file', 'other'
]);

// Resolves actor + the actor's membership in the entity. Returns
// { actor, membership } or null after sending an error.
async function resolveEntityActor(client, req, res, entityId) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return null;
  }
  const entity = await client.query('select id from entities where id = $1 limit 1', [entityId]);
  if (!entity.rows[0]) {
    sendError(res, 404, 'ENTITY_NOT_FOUND', 'Entity not found');
    return null;
  }
  const membership = await client.query(
    'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
    [entityId, actor.id]
  );
  return { actor, membership: membership.rows[0] || null };
}

export async function handleListDocuments(req, res) {
  try {
    // Documents are workspace data: the list is scoped to the caller's active
    // memberships (plus their own personal documents). Previously this endpoint
    // was unauthenticated and returned every document on the platform, which
    // broke the Security DoD (§16.1 auth, §16.2 membership scoping) — and became
    // untenable once documents carry real files.
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const result = await getPool().query(
      `select
         d.id,
         d.title,
         d.document_type,
         d.status,
         d.version_number,
         d.mime_type,
         d.size_bytes,
         (d.storage_key is not null) as has_file,
         d.created_at,
         e.name as entity_name,
         ev.title as event_title
       from documents d
       left join entities e on e.id = d.entity_id
       left join events ev on ev.id = d.event_id
       where d.status <> 'deleted'
         and (
           exists (
             select 1 from entity_memberships m
              where m.entity_id = d.entity_id and m.user_id = $1 and m.status = 'active'
           )
           or d.owner_user_id = $1
         )
       order by d.created_at desc
       limit 50`,
      [actor.id]
    );

    sendJson(res, 200, {
      ok: true,
      documents: result.rows
    });
  } catch (error) {
    sendError(res, 500, 'DOCUMENTS_LIST_FAILED', 'Failed to list documents', {
      message: error?.message || String(error)
    });
  }
}

// GET /entities/:id/documents — documents under an entity, for its members.
export async function handleListEntityDocuments(req, res, entityId) {
  const client = await getPool().connect();
  try {
    const access = await resolveEntityActor(client, req, res, entityId);
    if (!access) return;
    if (!permissionService.canViewEntityDocuments(access.actor, access.membership)) {
      // Non-members don't learn whether the entity has documents.
      sendError(res, 404, 'ENTITY_NOT_FOUND', 'Entity not found');
      return;
    }
    const result = await client.query(
      `select d.id, d.title, d.document_type, d.status, d.version_number, d.created_at,
              u.display_name as owner_name
         from documents d
         left join users u on u.id = d.owner_user_id
        where d.entity_id = $1 and d.status <> 'deleted'
        order by d.created_at desc
        limit 100`,
      [entityId]
    );
    sendJson(res, 200, { ok: true, documents: result.rows });
  } catch (error) {
    sendError(res, 500, 'ENTITY_DOCUMENTS_LIST_FAILED', 'Failed to list documents', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// POST /entities/:id/documents — an entity manager creates a document record.
// Metadata only for now; file storage (storage_key/mime/size) is a later slice.
export async function handleCreateEntityDocument(req, res, entityId) {
  const client = await getPool().connect();
  try {
    const access = await resolveEntityActor(client, req, res, entityId);
    if (!access) return;
    if (!permissionService.canCreateDocument(access.actor, access.membership)) {
      sendError(res, 403, 'DOCUMENT_CREATE_FORBIDDEN', 'You do not have permission to add documents to this entity');
      return;
    }

    const body = await readJsonBody(req);
    const title = String(body.title || '').trim();
    const documentType = String(body.document_type || 'other').trim();

    if (title.length < 2) {
      sendError(res, 400, 'DOCUMENT_TITLE_INVALID', 'Document title must contain at least 2 characters');
      return;
    }
    if (!DOCUMENT_TYPES.has(documentType)) {
      sendError(res, 400, 'DOCUMENT_TYPE_INVALID', 'Unknown document type');
      return;
    }

    await client.query('begin');
    const inserted = await client.query(
      `insert into documents (parent_type, entity_id, owner_user_id, title, document_type, status, created_by_user_id)
       values ('entity', $1, $2, $3, $4, 'draft', $2)
       returning id, title, document_type, status, version_number, created_at`,
      [entityId, access.actor.id, title, documentType]
    );
    const doc = inserted.rows[0];
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, document_id, metadata)
       values ($1, 'document.created', $2, $3, '{}'::jsonb)`,
      [access.actor.id, entityId, doc.id]
    );
    await client.query('commit');

    sendJson(res, 201, { ok: true, document: { ...doc, owner_name: access.actor.display_name } });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'DOCUMENT_CREATE_FAILED', 'Failed to create document', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}
