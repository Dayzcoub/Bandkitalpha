import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';
import { resolveSessionUser } from '../auth/session.js';

const MIN_QUERY = 2;
const MAX_RESULTS = 20;

// Escape the ILIKE wildcards so a query of "50%" searches for the literal text,
// not "starts with 50". Backslash is the default ESCAPE char in Postgres LIKE.
function escapeLike(value) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// GET /users/search?q=... — find registered people by display name or handle so
// one user can start a conversation with another. This is the ONLY people-discovery
// surface; before it, friending and DMs required knowing a raw user id out of band.
//
// Scope and safety:
//   - authed only: discovery is not open to anonymous scraping;
//   - never returns email or any contact detail — only what's needed to then act
//     (id + display name + handle). Finding someone does not let you contact them:
//     friend requests and DMs are separately gated by their own privacy axes;
//   - excludes the caller, and anyone not `active` or `blocked` — a gone or banned
//     account is not a person you can reach;
//   - a short query returns an empty list rather than the whole table.
//
// Deliberately NOT built yet: a "discoverability" privacy axis (hide me from
// search). The privacy model only adds an axis once a surface applies it — this is
// that surface, so the axis is now justified, but contact is already gated, so
// search revealing a profile grants nothing on its own. Tracked as follow-up.
// ponytail: discoverability axis deferred — contact stays gated by dm/friend_request.
export async function handleSearchUsers(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const q = (url.searchParams.get('q') || '').trim();
    if (q.length < MIN_QUERY) {
      // Not an error: the UI calls this on every keystroke.
      sendJson(res, 200, { ok: true, users: [] });
      return;
    }

    const pattern = `%${escapeLike(q)}%`;
    const result = await getPool().query(
      `select id, display_name, handle
         from users
        where status = 'active'
          and coalesce(sanction, '') <> 'blocked'
          and id <> $1
          and (display_name ilike $2 escape '\\' or handle ilike $2 escape '\\')
        order by (handle is not null) desc, display_name
        limit ${MAX_RESULTS}`,
      [actor.id, pattern]
    );

    sendJson(res, 200, { ok: true, users: result.rows });
  } catch (error) {
    sendError(res, 500, 'USER_SEARCH_FAILED', 'User search failed', { message: error?.message || String(error) });
  }
}
