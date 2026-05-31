import { sendJson } from '../../shared/http.js';
import { nowIso } from './admin.shared.js';

const CONTENT_SCOPES = ['feed', 'media', 'collections', 'categories'];
const CONTENT_POLICY_SCOPES = ['categories', 'dictionaries', 'promo_surfaces'];
const CONTENT_OPERATION_TYPES = ['review_feed', 'review_media', 'manage_collections', 'dictionary_review'];

export async function handleAdminContent(req, res) {
  sendJson(res, 200, {
    ok: true,
    mode: 'read_only',
    generated_at: nowIso(),
    content_items: [],
    summary: {
      total: 0,
      feed: 0,
      media: 0,
      collections: 0,
      categories: 0,
      source: 'not_connected_yet'
    },
    content_scopes: CONTENT_SCOPES,
    policy_scopes: CONTENT_POLICY_SCOPES,
    operation_types: CONTENT_OPERATION_TYPES,
    guardrails: {
      write_actions_enabled: false,
      post_mutations_enabled: false,
      media_mutations_enabled: false,
      category_mutations_enabled: false,
      publication_mutations_enabled: false,
      deletion_enabled: false
    }
  });
}
