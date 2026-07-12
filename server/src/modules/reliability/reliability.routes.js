import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';

// Resolves the engagement, asserts it belongs to the given event, and asserts the
// actor manages the event's owning entity. Returns { actor, event, engagement }
// on success, or null after sending an error. Reliability records live in the
// engagement's working context, so they follow the same entity-scoped authz as
// engagements themselves (Security Standard §2 — IDOR is the primary risk).
async function requireEngagementManager(client, req, res, eventId, engagementId) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return null;
  }
  const result = await client.query(
    `select e.id as engagement_id, e.counterparty_party_id, e.status_key,
            ev.id as event_id, ev.entity_id
       from engagements e
       join events ev on ev.id = e.event_id
      where e.id = $1 and e.event_id = $2
      limit 1`,
    [engagementId, eventId]
  );
  const row = result.rows[0];
  if (!row) {
    sendError(res, 404, 'ENGAGEMENT_NOT_FOUND', 'Engagement not found for this event');
    return null;
  }
  if (!row.entity_id) {
    sendError(res, 409, 'EVENT_NOT_SCOPED', 'Event is not attached to an entity');
    return null;
  }
  const membershipResult = await client.query(
    'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
    [row.entity_id, actor.id]
  );
  const membership = membershipResult.rows[0] || null;
  if (!permissionService.canRecordReliabilityEvent(actor, membership)) {
    sendError(res, 403, 'RELIABILITY_FORBIDDEN', 'You do not have permission to manage this engagement');
    return null;
  }
  return {
    actor,
    event: { id: row.event_id, entity_id: row.entity_id },
    engagement: { id: row.engagement_id, counterparty_party_id: row.counterparty_party_id, status_key: row.status_key }
  };
}

// GET /reliability/event-types — public reference catalogue (types + valid
// reasons) so the UI can render structured pickers instead of free text.
export async function handleListReliabilityCatalogue(req, res) {
  try {
    const pool = getPool();
    const [types, reasons] = await Promise.all([
      pool.query('select key, label, polarity, sort_order from reliability_event_types order by sort_order, key'),
      pool.query('select key, label, sort_order from reliability_reasons order by sort_order, key')
    ]);
    sendJson(res, 200, { ok: true, types: types.rows, reasons: reasons.rows });
  } catch (error) {
    sendError(res, 500, 'RELIABILITY_CATALOGUE_FAILED', 'Failed to load reliability catalogue', { message: error?.message || String(error) });
  }
}

// POST /events/:eventId/engagements/:engagementId/reliability — record a
// structured reliability event about the engagement's counterparty. The subject
// party and event are derived from the engagement, never taken from the body, so
// a record can only ever be attached to a verified collaboration context.
export async function handleRecordReliabilityEvent(req, res, eventId, engagementId) {
  const client = await getPool().connect();
  try {
    const guard = await requireEngagementManager(client, req, res, eventId, engagementId);
    if (!guard) return;

    const body = await readJsonBody(req);
    const typeKey = String(body.type_key || '').trim();
    const reasonKey = body.reason_key ? String(body.reason_key).trim() : null;
    const note = body.note ? String(body.note).trim().slice(0, 2000) : null;
    const disputed = body.disputed === true;
    const allowedVisibility = ['organizers', 'collaborators', 'moderation', 'hidden'];
    const visibility = allowedVisibility.includes(body.visibility) ? body.visibility : 'organizers';
    const metadata = body.metadata && typeof body.metadata === 'object' ? JSON.stringify(body.metadata) : null;

    if (!typeKey) {
      sendError(res, 400, 'RELIABILITY_TYPE_REQUIRED', 'type_key is required');
      return;
    }

    const result = await client.query(
      `insert into reliability_events
         (engagement_id, subject_party_id, event_id, type_key, reason_key, visibility, disputed, note, metadata, created_by_user_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
       returning id, engagement_id, subject_party_id, event_id, type_key, reason_key, visibility, disputed, note, metadata, created_at`,
      [guard.engagement.id, guard.engagement.counterparty_party_id, guard.event.id, typeKey, reasonKey,
        visibility, disputed, note, metadata, guard.actor.id]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, event_id, metadata)
       values ($1, 'reliability.event.recorded', $2, $3,
               jsonb_build_object('reliability_id', $4::text, 'engagement_id', $5::text, 'type', $6::text))`,
      [guard.actor.id, guard.event.entity_id, guard.event.id, result.rows[0].id, guard.engagement.id, typeKey]
    );
    sendJson(res, 201, { ok: true, reliability_event: result.rows[0] });
  } catch (error) {
    if (error?.code === '23503') {
      sendError(res, 400, 'REFERENCE_UNKNOWN', 'Referenced reliability type or reason does not exist');
      return;
    }
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'RELIABILITY_RECORD_FAILED', 'Failed to record reliability event', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// Platform staff roles that may see moderation-only reliability records and any
// party's summary (Reputation Rules: moderation-only visibility layer).
const STAFF_ROLES = new Set(['super_admin', 'platform_admin', 'platform_moderator', 'read_only_auditor']);

// GET /parties/:partyId/reliability-summary — a structured, layered reliability
// summary for one party. Deliberately NOT a public rating number (Reputation
// Rules MVP): it returns counts by polarity and by type over records the viewer
// is allowed to see. Disputed records are held out of the polarity totals
// ("not final public negative reputation until reviewed") and surfaced separately.
//
// Who may view (verified-context rule, not arbitrary visitors):
//   - platform staff (also sees moderation-only records);
//   - the party's own owner (individual party's user, or an entity they manage);
//   - a manager of an entity that has actually engaged this party.
export async function handlePartyReliabilitySummary(req, res, partyId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }

    const partyResult = await client.query('select id, user_id, entity_id from parties where id = $1 limit 1', [partyId]);
    const party = partyResult.rows[0];
    if (!party) {
      sendError(res, 404, 'PARTY_NOT_FOUND', 'Party not found');
      return;
    }

    const isStaff = STAFF_ROLES.has(actor.platform_role);
    let allowed = isStaff || party.user_id === actor.id;
    if (!allowed && party.entity_id) {
      const ownEntity = await client.query(
        `select 1 from entity_memberships
          where entity_id = $1 and user_id = $2 and status = 'active' and role in ('owner','admin','manager') limit 1`,
        [party.entity_id, actor.id]
      );
      allowed = ownEntity.rowCount > 0;
    }
    if (!allowed) {
      // Has the viewer actually collaborated with this party (managed an entity
      // that engaged them)? That is the only other doorway to the summary.
      const collab = await client.query(
        `select 1
           from engagements e
           join events ev on ev.id = e.event_id
           join entity_memberships m on m.entity_id = ev.entity_id and m.user_id = $2
          where e.counterparty_party_id = $1
            and m.status = 'active' and m.role in ('owner','admin','manager')
          limit 1`,
        [partyId, actor.id]
      );
      allowed = collab.rowCount > 0;
    }
    if (!allowed) {
      sendError(res, 403, 'RELIABILITY_SUMMARY_FORBIDDEN', 'You cannot view this party\'s reliability summary');
      return;
    }

    // Staff see moderation-only records too; everyone else sees the organizer /
    // collaborator layers. `hidden` records are never aggregated here.
    const visibilities = isStaff
      ? ['organizers', 'collaborators', 'moderation']
      : ['organizers', 'collaborators'];

    const rows = await client.query(
      `select t.polarity, r.type_key, t.label as type_label, r.disputed, count(*)::int as count
         from reliability_events r
         join reliability_event_types t on t.key = r.type_key
        where r.subject_party_id = $1
          and r.visibility = any($2)
          and (r.dispute_state is null or r.dispute_state <> 'retracted')
        group by t.polarity, r.type_key, t.label, r.disputed
        order by t.label`,
      [partyId, visibilities]
    );

    const totals = { positive: 0, neutral: 0, negative: 0, disputed: 0 };
    const byTypeMap = new Map();
    for (const row of rows.rows) {
      if (row.disputed) {
        totals.disputed += row.count;
      } else {
        totals[row.polarity] += row.count;
      }
      const existing = byTypeMap.get(row.type_key)
        || { type_key: row.type_key, label: row.type_label, polarity: row.polarity, count: 0, disputed: 0 };
      existing.count += row.count;
      if (row.disputed) existing.disputed += row.count;
      byTypeMap.set(row.type_key, existing);
    }

    sendJson(res, 200, {
      ok: true,
      summary: {
        party_id: partyId,
        totals,
        by_type: Array.from(byTypeMap.values())
      }
    });
  } catch (error) {
    sendError(res, 500, 'RELIABILITY_SUMMARY_FAILED', 'Failed to load reliability summary', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// GET /events/:eventId/engagements/:engagementId/reliability — manager-scoped
// list of reliability records for one engagement (the working roster view, not a
// public reputation summary).
export async function handleListReliabilityEvents(req, res, eventId, engagementId) {
  const client = await getPool().connect();
  try {
    const guard = await requireEngagementManager(client, req, res, eventId, engagementId);
    if (!guard) return;
    const result = await client.query(
      `select r.id, r.type_key, t.label as type_label, t.polarity,
              r.reason_key, rs.label as reason_label,
              r.subject_party_id, r.visibility, r.disputed, r.note, r.created_at,
              r.dispute_state, ds.label as dispute_state_label
         from reliability_events r
         join reliability_event_types t on t.key = r.type_key
         left join reliability_reasons rs on rs.key = r.reason_key
         left join reliability_dispute_states ds on ds.key = r.dispute_state
        where r.engagement_id = $1
        order by r.created_at`,
      [guard.engagement.id]
    );
    sendJson(res, 200, { ok: true, reliability_events: result.rows });
  } catch (error) {
    sendError(res, 500, 'RELIABILITY_LIST_FAILED', 'Failed to list reliability events', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// GET /me/reliability — the subject-facing view: reliability records about the
// authenticated user's own party, so they can see what has been recorded and open
// a dispute. Moderation-only and hidden records are not surfaced to the subject
// (those are the internal layer); they see the organizer/collaborator layer that
// actually affects their reputation.
export async function handleListMyReliability(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const result = await getPool().query(
      `select r.id, r.type_key, t.label as type_label, t.polarity,
              r.reason_key, rs.label as reason_label, r.note, r.created_at,
              r.disputed, r.dispute_state, ds.label as dispute_state_label,
              ev.title as event_title
         from reliability_events r
         join reliability_event_types t on t.key = r.type_key
         join parties p on p.id = r.subject_party_id
         left join reliability_reasons rs on rs.key = r.reason_key
         left join reliability_dispute_states ds on ds.key = r.dispute_state
         left join events ev on ev.id = r.event_id
        where p.user_id = $1 and r.visibility in ('organizers', 'collaborators')
        order by r.created_at desc
        limit 200`,
      [actor.id]
    );
    sendJson(res, 200, { ok: true, reliability_events: result.rows });
  } catch (error) {
    sendError(res, 500, 'MY_RELIABILITY_FAILED', 'Failed to load your reliability records', { message: error?.message || String(error) });
  }
}

// Platform staff who may resolve a dispute (a read-only auditor may see, but not
// act — so it is deliberately excluded here).
const DISPUTE_RESOLVER_ROLES = new Set(['super_admin', 'platform_admin', 'platform_moderator']);

// POST /reliability-events/:id/dispute — the subject of a record contests it.
// Only the party the record is about (its user owner, or a manager of its owning
// entity) may open a dispute, and only once. Opening a dispute marks the record
// disputed so it drops out of reputation totals until resolved.
export async function handleOpenDispute(req, res, reliabilityId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const found = await client.query(
      `select r.id, r.dispute_state, p.user_id as subject_user_id, p.entity_id as subject_entity_id
         from reliability_events r
         join parties p on p.id = r.subject_party_id
        where r.id = $1 limit 1`,
      [reliabilityId]
    );
    const row = found.rows[0];
    if (!row) {
      sendError(res, 404, 'RELIABILITY_NOT_FOUND', 'Reliability event not found');
      return;
    }
    // Only the subject may dispute a record about themselves.
    let isSubject = row.subject_user_id === actor.id;
    if (!isSubject && row.subject_entity_id) {
      const m = await client.query(
        `select 1 from entity_memberships
          where entity_id = $1 and user_id = $2 and status = 'active' and role in ('owner','admin','manager') limit 1`,
        [row.subject_entity_id, actor.id]
      );
      isSubject = m.rowCount > 0;
    }
    if (!isSubject) {
      sendError(res, 403, 'DISPUTE_FORBIDDEN', 'Only the subject of a reliability record can dispute it');
      return;
    }
    if (row.dispute_state) {
      sendError(res, 409, 'DISPUTE_EXISTS', 'This record already has a dispute');
      return;
    }

    const body = await readJsonBody(req);
    const reasonKey = body.reason_key ? String(body.reason_key).trim() : null;
    const note = body.note ? String(body.note).trim().slice(0, 2000) : null;

    const updated = await client.query(
      `update reliability_events
          set dispute_state = 'open', disputed = true, dispute_opened_by = $2,
              dispute_reason_key = $3, dispute_note = $4, dispute_opened_at = now()
        where id = $1
        returning id, dispute_state, dispute_reason_key, dispute_note, dispute_opened_at`,
      [reliabilityId, actor.id, reasonKey, note]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'reliability.dispute.opened', jsonb_build_object('reliability_id', $2::text))`,
      [actor.id, reliabilityId]
    );
    sendJson(res, 201, { ok: true, reliability_event: updated.rows[0] });
  } catch (error) {
    if (error?.code === '23503') {
      sendError(res, 400, 'REFERENCE_UNKNOWN', 'Referenced dispute reason does not exist');
      return;
    }
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'DISPUTE_OPEN_FAILED', 'Failed to open dispute', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}

// PATCH /reliability-events/:id/dispute — resolve an open dispute. The organizer
// side (a manager of the event's owning entity) or platform staff decides. An
// `upheld` record stands and resumes counting; a `retracted` record is excluded
// from reputation entirely.
export async function handleResolveDispute(req, res, reliabilityId) {
  const client = await getPool().connect();
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const found = await client.query(
      `select r.id, r.dispute_state, ev.entity_id
         from reliability_events r
         join events ev on ev.id = r.event_id
        where r.id = $1 limit 1`,
      [reliabilityId]
    );
    const row = found.rows[0];
    if (!row) {
      sendError(res, 404, 'RELIABILITY_NOT_FOUND', 'Reliability event not found');
      return;
    }
    let canResolve = DISPUTE_RESOLVER_ROLES.has(actor.platform_role);
    if (!canResolve && row.entity_id) {
      const m = await client.query(
        'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
        [row.entity_id, actor.id]
      );
      canResolve = permissionService.canManageEntity(actor, m.rows[0] || null);
    }
    if (!canResolve) {
      sendError(res, 403, 'DISPUTE_RESOLVE_FORBIDDEN', 'You cannot resolve this dispute');
      return;
    }
    if (row.dispute_state !== 'open') {
      sendError(res, 409, 'DISPUTE_NOT_OPEN', 'There is no open dispute to resolve');
      return;
    }

    const body = await readJsonBody(req);
    const resolution = String(body.resolution || '').trim();
    if (resolution !== 'upheld' && resolution !== 'retracted') {
      sendError(res, 400, 'DISPUTE_RESOLUTION_INVALID', 'resolution must be "upheld" or "retracted"');
      return;
    }
    const note = body.note ? String(body.note).trim().slice(0, 2000) : null;

    // Both outcomes are terminal and clear the "contested" flag: an upheld record
    // resumes counting; a retracted one is filtered out of the summary by state.
    const updated = await client.query(
      `update reliability_events
          set dispute_state = $2, disputed = false, dispute_resolved_by = $3,
              dispute_resolution = $4, dispute_resolved_at = now()
        where id = $1
        returning id, dispute_state, dispute_resolution, dispute_resolved_at`,
      [reliabilityId, resolution, actor.id, note]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, metadata)
       values ($1, 'reliability.dispute.resolved',
               jsonb_build_object('reliability_id', $2::text, 'resolution', $3::text))`,
      [actor.id, reliabilityId, resolution]
    );
    sendJson(res, 200, { ok: true, reliability_event: updated.rows[0] });
  } catch (error) {
    if (error?.code === 'BODY_TOO_LARGE') {
      sendError(res, 413, 'BODY_TOO_LARGE', 'Request body is too large');
      return;
    }
    sendError(res, 500, 'DISPUTE_RESOLVE_FAILED', 'Failed to resolve dispute', { message: error?.message || String(error) });
  } finally {
    client.release();
  }
}
