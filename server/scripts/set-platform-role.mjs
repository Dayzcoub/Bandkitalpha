// Controlled platform-role assignment (Auth spec §1). Super_admin and other
// platform roles are NOT self-service — grant them here, deliberately.
//   node --env-file=.env scripts/set-platform-role.mjs <email> <role>
//   role: super_admin | platform_admin | platform_moderator | support_agent | read_only_auditor | none
import { getPool } from '../src/db/client.js';

const VALID_ROLES = ['super_admin', 'platform_admin', 'platform_moderator', 'support_agent', 'read_only_auditor', 'none'];

async function run() {
  const [rawEmail, role] = process.argv.slice(2);
  if (!rawEmail || !role) {
    console.error('Usage: node --env-file=.env scripts/set-platform-role.mjs <email> <role>');
    console.error('  role: ' + VALID_ROLES.join(' | '));
    process.exitCode = 1;
    return;
  }
  if (!VALID_ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Allowed: ${VALID_ROLES.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const email = rawEmail.trim().toLowerCase();
  const platformRole = role === 'none' ? null : role;
  const pool = getPool();
  try {
    const result = await pool.query(
      `update users set platform_role = $1, updated_at = now() where email = $2
       returning id, email, platform_role, status`,
      [platformRole, email]
    );
    if (result.rowCount === 0) {
      console.error(`No user found with email ${email}`);
      process.exitCode = 1;
      return;
    }
    console.log('Updated:', result.rows[0]);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
