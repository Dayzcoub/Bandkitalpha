// Plan resolution and usage accounting (Monetization policy). Limits are only
// worth having if they are actually enforced, so this is the single place that
// answers "what is this entity allowed to do right now" — callers ask before
// writing.
//
// There is no payment flow: a plan changes through a staff override only.

const FREE = 'free';

// The entity's effective plan and its limits. No entity_plans row = free, so a
// brand-new entity is usable without any billing write ever happening.
export async function getEntityPlan(client, entityId) {
  const result = await client.query(
    `select p.key, p.label, p.max_members, p.max_storage_bytes, p.max_file_versions, p.max_upload_bytes
       from plans p
       left join entity_plans ep on ep.plan_key = p.key and ep.entity_id = $1
      where p.key = coalesce((select plan_key from entity_plans where entity_id = $1), $2)
      limit 1`,
    [entityId, FREE]
  );
  return result.rows[0] || null;
}

// Bytes currently stored by an entity — every version counts, since every
// version occupies storage.
export async function getStorageUsed(client, entityId) {
  const result = await client.query(
    `select coalesce(sum(f.size_bytes), 0)::bigint as used
       from document_files f
       join documents d on d.id = f.document_id
      where d.entity_id = $1`,
    [entityId]
  );
  return Number(result.rows[0]?.used || 0);
}

export async function getMemberCount(client, entityId) {
  const result = await client.query(
    `select count(*)::int as count from entity_memberships
      where entity_id = $1 and status = 'active'`,
    [entityId]
  );
  return result.rows[0]?.count || 0;
}

export async function getVersionCount(client, documentId) {
  const result = await client.query(
    'select count(*)::int as count from document_files where document_id = $1',
    [documentId]
  );
  return result.rows[0]?.count || 0;
}

// Full plan + usage picture for the UI.
export async function getEntityPlanUsage(client, entityId) {
  const plan = await getEntityPlan(client, entityId);
  if (!plan) return null;
  const [storageUsed, members] = await Promise.all([
    getStorageUsed(client, entityId),
    getMemberCount(client, entityId)
  ]);
  return {
    plan: {
      key: plan.key,
      label: plan.label,
      max_members: plan.max_members,
      max_storage_bytes: Number(plan.max_storage_bytes),
      max_file_versions: plan.max_file_versions,
      max_upload_bytes: Number(plan.max_upload_bytes)
    },
    usage: {
      members,
      storage_bytes: storageUsed
    }
  };
}
