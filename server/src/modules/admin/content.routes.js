import { sendJson } from '../../shared/http.js';

function nowIso() {
  return new Date().toISOString();
}

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
    content_scopes: ['feed', 'media', 'collections', 'categories'],
    policy_scopes: ['categories', 'dictionaries', 'promo_surfaces'],
    operation_types: ['review_feed', 'review_media', 'manage_collections', 'dictionary_review'],
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
