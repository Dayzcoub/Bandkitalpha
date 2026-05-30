import { sendJson } from '../../shared/http.js';

export async function handleAdminStaffCatalog(req, res) {
  sendJson(res, 200, {
    ok: true,
    mode: 'read_only',
    generated_at: new Date().toISOString(),
    items: [],
    summary: {
      groups: 4,
      elevated: 1,
      scoped: 2,
      source: 'static_policy_seed'
    },
    operation_types: ['review_matrix', 'open_history', 'check_2fa_status', 'review_restrictions', 'export_matrix'],
    guardrails: {
      write_actions_enabled: false,
      changes_enabled: false
    }
  });
}
