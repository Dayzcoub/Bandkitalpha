// Dev/staging-only auth seed: login-capable test accounts with known passwords.
// Idempotent. NEVER runs in production. Super_admin alone is not representative
// for QA — a regular and an unverified account cover the real user experience.
//   node --env-file=.env scripts/seed-auth.mjs
//
// These passwords live in the repository, so seeding an account here puts a known
// password on whatever host runs it. Pick accounts deliberately:
//   node --env-file=.env scripts/seed-auth.mjs --only=user@bandkit.local
// The staging deploy uses --only for exactly that reason: it needs the smoke's
// unprivileged account and must not (re-)create a super_admin on a public host.
// Note that this RESETS the password of every account it touches.
import { getPool } from '../src/db/client.js';
import { hashPassword } from '../src/shared/auth.js';

const accounts = [
  { email: 'owner@bandkit.local', display_name: 'BandKit Owner', password: 'OwnerPass123', platform_role: 'super_admin', email_verified: true, status: 'active' },
  { email: 'user@bandkit.local', display_name: 'Regular User', password: 'UserPass123', platform_role: null, email_verified: true, status: 'active' },
  { email: 'newbie@bandkit.local', display_name: 'New Signup', password: 'NewbiePass123', platform_role: null, email_verified: false, status: 'active' }
];

function selectAccounts() {
  const arg = process.argv.find((value) => value.startsWith('--only='));
  if (!arg) return accounts;

  const wanted = arg.slice('--only='.length).split(',').map((value) => value.trim()).filter(Boolean);
  const selected = accounts.filter((account) => wanted.includes(account.email));
  const unknown = wanted.filter((email) => !accounts.some((account) => account.email === email));

  // A typo must not silently seed nothing (deploy would then fail later, in the
  // smoke, with a confusing login error).
  if (unknown.length > 0) {
    throw new Error(`--only lists unknown accounts: ${unknown.join(', ')}`);
  }
  return selected;
}

async function run() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'staging') {
    console.error(`seed-auth is disabled outside development/staging (NODE_ENV=${nodeEnv})`);
    process.exitCode = 1;
    return;
  }

  let selected;
  try {
    selected = selectAccounts();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    for (const acc of selected) {
      await client.query('begin');
      const userResult = await client.query(
        `insert into users (display_name, email, status, email_verified, platform_role)
         values ($1, $2, $3, $4, $5)
         on conflict (email) do update set
           display_name = excluded.display_name,
           status = excluded.status,
           email_verified = excluded.email_verified,
           platform_role = excluded.platform_role,
           updated_at = now()
         returning id, email, status, platform_role, email_verified`,
        [acc.display_name, acc.email, acc.status, acc.email_verified, acc.platform_role]
      );
      const user = userResult.rows[0];

      const passwordHash = await hashPassword(acc.password);
      await client.query(
        `insert into auth_credentials (user_id, password_hash, algo)
         values ($1, $2, 'scrypt')
         on conflict (user_id) do update set password_hash = excluded.password_hash, algo = 'scrypt', updated_at = now()`,
        [user.id, passwordHash]
      );

      await client.query('commit');
      console.log(`seeded ${user.email}  role=${user.platform_role || 'user'}  verified=${user.email_verified}  password=${acc.password}`);
    }
    console.log('\nDone. These credentials are for local/staging testing only.');
  } catch (error) {
    await client.query('rollback').catch(() => {});
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
