import { sendJson } from '../../shared/http.js';
import { nowIso } from './admin.shared.js';

const BILLING_PLAN_CATALOG = [
  {
    key: 'basic',
    title: 'Базовый доступ',
    status: 'active',
    price_label: '0 ₽',
    scope: 'Профиль, лента, участие в сущностях и базовые ограничения.'
  },
  {
    key: 'pro_profile',
    title: 'Про / расширенный профиль',
    status: 'planned',
    price_label: 'позже',
    scope: 'Расширенное портфолио, продвижение, документы и будущие премиум-функции.'
  },
  {
    key: 'entity_plan',
    title: 'Тариф сущности',
    status: 'planned',
    price_label: 'будущий модуль',
    scope: 'Группы, студии, оркестры и организации: роли, участники, события, документы и управление.'
  }
];

const BILLING_OPERATION_TYPES = ['manual_access', 'refunds', 'promocodes'];

export async function handleAdminBilling(req, res) {
  sendJson(res, 200, {
    ok: true,
    mode: 'read_only',
    generated_at: nowIso(),
    billing_items: [],
    summary: {
      total: 0,
      tariffs: 0,
      subscriptions: 0,
      refunds: 0,
      manual_access: 0,
      source: 'not_connected_yet'
    },
    plan_catalog: BILLING_PLAN_CATALOG,
    operation_types: BILLING_OPERATION_TYPES,
    guardrails: {
      write_actions_enabled: false,
      payment_mutations_enabled: false,
      refund_actions_enabled: false,
      entitlement_mutations_enabled: false,
      tariff_mutations_enabled: false,
      manual_access_grants_enabled: false
    }
  });
}
