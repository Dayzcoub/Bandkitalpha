import { getPool } from '../../db/client.js';
import { getSessionToken, hashToken } from '../../shared/auth.js';

// Resolves the authenticated user from the session cookie, or null.
// Server-side source of truth for "who is acting" (Security Standard §2).
export async function resolveSessionUser(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const result = await getPool().query(
    `select u.id, u.display_name, u.handle, u.email, u.status, u.email_verified, u.platform_role
     from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()
     limit 1`,
    [hashToken(token)]
  );
  return result.rows[0] || null;
}
