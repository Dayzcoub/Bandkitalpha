import { sendJson } from '../../shared/http.js';
import { nowIso } from './admin.shared.js';

const NOTIFICATION_SOURCE_NOT_CONNECTED = 'not_connected_yet';
const NOTIFICATION_CHANNELS = ['push', 'email', 'sms', 'in_app'];
const NOTIFICATION_TEMPLATE_SCOPES = ['system', 'security', 'moderation', 'billing', 'entity_activity'];
const NOTIFICATION_OPERATION_TYPES = ['review_queue', 'preview_template', 'check_delivery_status', 'audit_subscriptions'];

export async function handleAdminNotifications(req, res) {
  sendJson(res, 200, {
    ok: true,
    mode: 'read_only',
    generated_at: nowIso(),
    notification_items: [],
    summary: {
      total: 0,
      push: 0,
      email: 0,
      sms: 0,
      templates: 0,
      source: NOTIFICATION_SOURCE_NOT_CONNECTED
    },
    channels: NOTIFICATION_CHANNELS,
    template_scopes: NOTIFICATION_TEMPLATE_SCOPES,
    operation_types: NOTIFICATION_OPERATION_TYPES,
    guardrails: {
      write_actions_enabled: false,
      send_actions_enabled: false,
      bulk_send_enabled: false,
      subscription_mutations_enabled: false,
      template_mutations_enabled: false,
      private_message_content_enabled: false
    }
  });
}
