import { sendJson } from '../../shared/http.js';
import { nowIso } from './admin.shared.js';

const SETTINGS_PLATFORM_FLAGS = [
  {
    key: 'registration_policy',
    title: 'Регистрация и онбординг',
    status: 'preview_only',
    scope: 'Политика будущей регистрации через Google/Apple, подтверждение email и телефона.'
  },
  {
    key: 'admin_2fa_policy',
    title: '2FA для платформенной команды',
    status: 'required_for_admins',
    scope: 'Повышенные роли должны проходить 2FA; экран только показывает политику.'
  },
  {
    key: 'maintenance_mode',
    title: 'Режим обслуживания',
    status: 'off',
    scope: 'Будущий глобальный maintenance-флаг. Сейчас только просмотр.'
  },
  {
    key: 'auth_providers',
    title: 'Провайдеры авторизации',
    status: 'not_connected_yet',
    scope: 'Google, Apple, SMS и email-подтверждения будут подключаться отдельно.'
  }
];

const SETTINGS_PROVIDER_SCOPES = ['google', 'apple', 'email', 'sms'];
const SETTINGS_OPERATION_TYPES = ['review_flags', 'check_2fa_policy', 'review_maintenance', 'review_providers', 'open_settings_audit'];

export async function handleAdminSettings(req, res) {
  sendJson(res, 200, {
    ok: true,
    mode: 'read_only',
    generated_at: nowIso(),
    settings_items: [],
    summary: {
      registration: 'preview_only',
      two_factor: 'required_for_admins',
      maintenance: 'off',
      providers: 0,
      source: 'static_policy_seed'
    },
    platform_flags: SETTINGS_PLATFORM_FLAGS,
    provider_scopes: SETTINGS_PROVIDER_SCOPES,
    operation_types: SETTINGS_OPERATION_TYPES,
    guardrails: {
      write_actions_enabled: false,
      config_mutations_enabled: false,
      registration_policy_mutations_enabled: false,
      maintenance_toggle_enabled: false,
      provider_mutations_enabled: false,
      two_factor_policy_mutations_enabled: false
    }
  });
}
