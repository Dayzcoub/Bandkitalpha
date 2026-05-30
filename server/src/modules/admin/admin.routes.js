import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';

function nowIso() {
  return new Date().toISOString();
}

async function countQuery(client, sql, params = []) {
  const result = await client.query(sql, params);
  return Number(result.rows[0]?.count || 0);
}

async function groupedCountQuery(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows.map((row) => ({
    key: row.key,
    count: Number(row.count || 0)
  }));
}

function mapActor(row) {
  if (!row.actor_user_id) return null;
  return {
    id: row.actor_user_id,
    display_name: row.actor_display_name || null,
    handle: row.actor_handle || null
  };
}

function mapUser(row) {
  return {
    id: row.id,
    display_name: row.display_name || null,
    handle: row.handle || null,
    status: row.status || null,
    created_at: row.created_at || null,
    entity_count: Number(row.entity_count || 0),
    owned_entity_count: Number(row.owned_entity_count || 0),
    audit_event_count: Number(row.audit_event_count || 0),
    verification: {
      email_verified: false,
      phone_verified: false,
      source: 'not_connected_yet'
    },
    security: {
      two_factor_enabled: false,
      source: 'not_connected_yet'
    },
    platform_flags: []
  };
}

function mapEntity(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    status: row.status,
    visibility: row.visibility,
    created_at: row.created_at,
    updated_at: row.updated_at || null,
    owner: row.owner_user_id
      ? {
          id: row.owner_user_id,
          display_name: row.owner_display_name || null,
          handle: row.owner_handle || null
        }
      : null,
    member_count: Number(row.member_count || 0),
    event_count: Number(row.event_count || 0),
    audit_event_count: Number(row.audit_event_count || 0),
    platform_flags: []
  };
}

function mapAuditEvent(row) {
  return {
    id: row.id,
    action: row.action,
    entity_id: row.entity_id || null,
    created_at: row.created_at,
    actor: mapActor(row),
    metadata: row.metadata || {}
  };
}

export async function handleAdminOverview(req, res) {
  const client = await getPool().connect();

  try {
    const [
      usersTotal,
      usersActive,
      entitiesTotal,
      entitiesActive,
      eventsTotal,
      reportsOpen,
      auditEventsTotal,
      recentAuditResult,
      userStatusCounts,
      entityStatusCounts,
      entityTypeCounts
    ] = await Promise.all([
      countQuery(client, 'select count(*) from users'),
      countQuery(client, "select count(*) from users where status = 'active'"),
      countQuery(client, 'select count(*) from entities'),
      countQuery(client, "select count(*) from entities where status = 'active'"),
      countQuery(client, 'select count(*) from events'),
      Promise.resolve(0),
      countQuery(client, 'select count(*) from audit_events'),
      client.query(
        `select
           ae.id,
           ae.action,
           ae.entity_id,
           ae.metadata,
           ae.created_at,
           u.id as actor_user_id,
           u.display_name as actor_display_name,
           u.handle as actor_handle
         from audit_events ae
         left join users u on u.id = ae.actor_user_id
         order by ae.created_at desc
         limit 5`
      ),
      groupedCountQuery(client, 'select coalesce(status, $$unknown$$) as key, count(*) from users group by key order by count desc'),
      groupedCountQuery(client, 'select coalesce(status, $$unknown$$) as key, count(*) from entities group by key order by count desc'),
      groupedCountQuery(client, 'select coalesce(type, $$unknown$$) as key, count(*) from entities group by key order by count desc')
    ]);

    sendJson(res, 200, {
      ok: true,
      mode: 'read_only',
      generated_at: nowIso(),
      summary: {
        users: {
          total: usersTotal,
          active: usersActive,
          by_status: userStatusCounts
        },
        entities: {
          total: entitiesTotal,
          active: entitiesActive,
          by_status: entityStatusCounts,
          by_type: entityTypeCounts
        },
        events: {
          total: eventsTotal
        },
        reports: {
          open: reportsOpen,
          source: 'not_connected_yet'
        },
        audit: {
          total: auditEventsTotal,
          recent: recentAuditResult.rows.map(mapAuditEvent)
        }
      },
      guardrails: {
        write_actions_enabled: false,
        sensitive_actions_enabled: false,
        private_message_access_enabled: false,
        billing_mutations_enabled: false,
        role_mutations_enabled: false
      }
    });
  } catch (error) {
    sendError(res, 500, 'ADMIN_OVERVIEW_FAILED', 'Failed to load admin overview', {
      message: error?.message || String(error)
    });
  } finally {
    client.release();
  }
}

export async function handleAdminUsers(req, res) {
  try {
    const result = await getPool().query(
      `select
         u.id,
         u.display_name,
         u.handle,
         u.status,
         u.created_at,
         coalesce(count(distinct em.entity_id), 0)::int as entity_count,
         coalesce(count(distinct owned.id), 0)::int as owned_entity_count,
         coalesce(count(distinct ae.id), 0)::int as audit_event_count
       from users u
       left join entity_memberships em on em.user_id = u.id and em.status = 'active'
       left join entities owned on owned.owner_user_id = u.id
       left join audit_events ae on ae.actor_user_id = u.id
       group by u.id
       order by u.created_at desc
       limit 100`
    );

    const statusCounts = await getPool().query(
      `select coalesce(status, $$unknown$$) as key, count(*)
       from users
       group by key
       order by count desc`
    );

    sendJson(res, 200, {
      ok: true,
      mode: 'read_only',
      generated_at: nowIso(),
      users: result.rows.map(mapUser),
      summary: {
        total_returned: result.rowCount,
        by_status: statusCounts.rows.map((row) => ({
          key: row.key,
          count: Number(row.count || 0)
        }))
      },
      guardrails: {
        write_actions_enabled: false,
        user_restrictions_enabled: false,
        role_mutations_enabled: false,
        two_factor_reset_enabled: false,
        private_data_access_enabled: false
      }
    });
  } catch (error) {
    sendError(res, 500, 'ADMIN_USERS_FAILED', 'Failed to load admin users', {
      message: error?.message || String(error)
    });
  }
}

export async function handleAdminEntities(req, res) {
  try {
    const result = await getPool().query(
      `select
         e.id,
         e.name,
         e.slug,
         e.type,
         e.status,
         e.visibility,
         e.owner_user_id,
         e.created_at,
         e.updated_at,
         u.display_name as owner_display_name,
         u.handle as owner_handle,
         coalesce(count(distinct em.user_id), 0)::int as member_count,
         coalesce(count(distinct ev.id), 0)::int as event_count,
         coalesce(count(distinct ae.id), 0)::int as audit_event_count
       from entities e
       left join users u on u.id = e.owner_user_id
       left join entity_memberships em on em.entity_id = e.id and em.status = 'active'
       left join events ev on ev.entity_id = e.id
       left join audit_events ae on ae.entity_id = e.id
       group by e.id, u.id
       order by e.created_at desc
       limit 100`
    );

    sendJson(res, 200, {
      ok: true,
      mode: 'read_only',
      generated_at: nowIso(),
      entities: result.rows.map(mapEntity),
      guardrails: {
        write_actions_enabled: false,
        entity_internal_settings_editable: false,
        ownership_mutations_enabled: false
      }
    });
  } catch (error) {
    sendError(res, 500, 'ADMIN_ENTITIES_FAILED', 'Failed to load admin entities', {
      message: error?.message || String(error)
    });
  }
}

export async function handleAdminReports(req, res) {
  sendJson(res, 200, {
    ok: true,
    mode: 'read_only',
    generated_at: nowIso(),
    reports: [],
    summary: {
      total: 0,
      open: 0,
      high_priority: 0,
      escalated: 0,
      appeals: 0,
      source: 'not_connected_yet'
    },
    workflow: ['new', 'in_review', 'needs_more_data', 'escalated', 'resolved', 'rejected', 'appealed'],
    guardrails: {
      write_actions_enabled: false,
      moderation_decisions_enabled: false,
      private_message_access_enabled: false,
      user_restrictions_enabled: false
    }
  });
}

export async function handleAdminModeration(req, res) {
  sendJson(res, 200, {
    ok: true,
    mode: 'read_only',
    generated_at: nowIso(),
    moderation_items: [],
    summary: {
      total: 0,
      content: 0,
      messages: 0,
      profiles: 0,
      visibility: 0,
      source: 'not_connected_yet'
    },
    queues: ['content', 'reported_messages', 'profiles', 'entity_visibility'],
    decisions: ['hide', 'unpublish', 'restrict_messages', 'leave_unchanged', 'escalate'],
    guardrails: {
      write_actions_enabled: false,
      moderation_decisions_enabled: false,
      content_mutation_enabled: false,
      private_message_bulk_access_enabled: false,
      user_restrictions_enabled: false,
      entity_visibility_mutations_enabled: false
    }
  });
}

export async function handleAdminAudit(req, res) {
  try {
    const result = await getPool().query(
      `select
         ae.id,
         ae.action,
         ae.entity_id,
         ae.metadata,
         ae.created_at,
         u.id as actor_user_id,
         u.display_name as actor_display_name,
         u.handle as actor_handle
       from audit_events ae
       left join users u on u.id = ae.actor_user_id
       order by ae.created_at desc
       limit 100`
    );

    const actionCounts = await getPool().query(
      `select action as key, count(*)
       from audit_events
       group by action
       order by count desc
       limit 20`
    );

    sendJson(res, 200, {
      ok: true,
      mode: 'read_only',
      generated_at: nowIso(),
      audit_events: result.rows.map(mapAuditEvent),
      summary: {
        total_returned: result.rowCount,
        by_action: actionCounts.rows.map((row) => ({
          key: row.key,
          count: Number(row.count || 0)
        }))
      },
      guardrails: {
        write_actions_enabled: false,
        audit_mutation_enabled: false,
        raw_sensitive_metadata_enabled: false
      }
    });
  } catch (error) {
    sendError(res, 500, 'ADMIN_AUDIT_FAILED', 'Failed to load admin audit', {
      message: error?.message || String(error)
    });
  }
}
