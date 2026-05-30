import { sendJson } from '../../shared/http.js';

export async function handleAdminStaffCatalog(req, res) {
  sendJson(res, 200, {
    ok: true,
    mode: 'read_only',
    generated_at: new Date().toISOString(),
    items: [
      {
        id: 'platform-owner',
        title: 'Владелец платформы',
        description: 'Верхний уровень платформенной операционной консоли.',
        status: 'elevated',
        tags: ['настройки', 'платежи', 'роли', 'аудит']
      },
      {
        id: 'platform-operator',
        title: 'Оператор платформы',
        description: 'Операционный просмотр пользователей, сущностей, модерации и контента.',
        status: 'staff',
        tags: ['пользователи', 'сущности', 'контент', 'доверие']
      },
      {
        id: 'moderation-trust-operator',
        title: 'Оператор модерации и доверия',
        description: 'Очереди жалоб, контентные сигналы и risk-review без действий записи.',
        status: 'case_limited',
        tags: ['жалобы', 'модерация', 'доверие', 'заметки']
      },
      {
        id: 'billing-locale-operator',
        title: 'Оператор платежей и локализации',
        description: 'Read-only просмотр коммерческого и языкового контуров.',
        status: 'scoped',
        tags: ['платежи', 'локализация', 'экспорт', 'аудит']
      }
    ],
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
