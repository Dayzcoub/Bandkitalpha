import { badge, findCardByText, kpi, listRow, markHeaderApiHydrated, safeButton } from './PlatformAdminReadOnlyBridgeUi.js';

type AdminNotificationsResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  notification_items?: Array<{ id?: string; title?: string; channel?: string; status?: string; scope?: string }>;
  summary?: {
    total?: number;
    push?: number;
    email?: number;
    sms?: number;
    templates?: number;
    source?: string;
  };
  channels?: string[];
  template_scopes?: string[];
  operation_types?: string[];
  guardrails?: Record<string, boolean>;
};

const API_URL = '/api/v1/admin/notifications';
let cache: AdminNotificationsResponse | null = null;
let loading = false;

function channelLabel(channel?: string): string {
  const map: Record<string, string> = {
    push: 'push',
    email: 'email',
    sms: 'SMS',
    in_app: 'внутри приложения'
  };
  return map[channel || ''] || channel || 'канал не указан';
}

function templateScopeLabel(scope?: string): string {
  const map: Record<string, string> = {
    system: 'системные уведомления',
    security: 'безопасность',
    moderation: 'модерация',
    billing: 'платежи',
    entity_activity: 'активность сущностей'
  };
  return map[scope || ''] || scope || 'шаблон';
}

function operationLabel(operation?: string): string {
  const map: Record<string, string> = {
    review_queue: 'Проверить очередь',
    preview_template: 'Предпросмотр шаблона',
    check_delivery_status: 'Проверить доставку',
    audit_subscriptions: 'Аудит подписок'
  };
  return map[operation || ''] || operation || 'Операция уведомлений';
}

async function fetchNotifications(): Promise<AdminNotificationsResponse | null> {
  const response = await fetch(API_URL, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<AdminNotificationsResponse>;
}

function updateHeaderBadge(root: HTMLElement): void {
  markHeaderApiHydrated(root, 'adminNotificationsApiHydrated');
}

function applyNotifications(root: HTMLElement, data: AdminNotificationsResponse): void {
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.push ?? 0), 'push'),
      kpi(String(summary.email ?? 0), 'email'),
      kpi(String(summary.sms ?? 0), 'SMS'),
      kpi(String(summary.templates ?? 0), 'шаблоны')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const queueCard = findCardByText(cards, ['Уведомления и рассылки']);
  const queueList = queueCard?.querySelector<HTMLElement>('.bk-list');
  if (queueList) {
    const items = data.notification_items ?? [];
    queueList.innerHTML = items.length
      ? items.slice(0, 20).map((item) => listRow(
          item.title || item.id || 'Уведомление без названия',
          `${channelLabel(item.channel)} · ${templateScopeLabel(item.scope)}`,
          ['только чтение', 'без отправки'],
          [{ label: item.status || 'ожидает подключения' }]
        )).join('')
      : listRow('Очередь уведомлений пока не подключена', 'Контракт API готов, но источник notification_items ещё не подключён к базе.', ['источник не подключён'], [{ label: '0 уведомлений' }]);
  }

  const templatesCard = findCardByText(cards, ['Шаблоны и каналы']);
  const templatesList = templatesCard?.querySelector<HTMLElement>('.bk-list');
  if (templatesList) {
    const scopes = data.template_scopes?.length ? data.template_scopes : ['system', 'security', 'moderation', 'billing', 'entity_activity'];
    templatesList.innerHTML = scopes.map((scope) => listRow(
      templateScopeLabel(scope),
      'Шаблон отображается только как read-only описание будущего notification-контура.',
      ['без изменения шаблонов', 'без реальной отправки'],
      [{ label: 'только чтение' }]
    )).join('');
  }

  const operations = data.operation_types?.length ? data.operation_types : ['review_queue', 'preview_template', 'check_delivery_status', 'audit_subscriptions'];
  const operationLabels = operations.map(operationLabel);
  const matrixCard = findCardByText(cards, ['Матрица отправки', 'Что будет доступно из /admin/notifications']);
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    matrixChips.innerHTML = operationLabels.map((item) => badge(item)).join('');
  }

  const safeActionsCard = cards.find((card) => card.querySelector('.bk-card-title')?.textContent?.trim() === 'Безопасные действия');
  const safeActionsRow = safeActionsCard?.querySelector<HTMLElement>('.bk-action-row');
  if (safeActionsRow) {
    safeActionsRow.innerHTML = operationLabels.map((item) => safeButton(item, '/admin/notifications')).join('');
  }

  updateHeaderBadge(root);
}

async function hydrate(root: HTMLElement): Promise<void> {
  if (window.location.pathname !== '/admin/notifications') return;
  window.requestAnimationFrame(() => {
    if (cache?.ok) applyNotifications(root, cache);
  });
  if (cache || loading) return;
  loading = true;
  try {
    cache = await fetchNotifications();
    if (cache?.ok && window.location.pathname === '/admin/notifications') applyNotifications(root, cache);
  } catch {
    cache = null;
  } finally {
    loading = false;
  }
}

export function initPlatformAdminNotificationsReadOnlyBridge(root: HTMLElement): void {
  void hydrate(root);
  window.addEventListener('popstate', () => void hydrate(root));
  window.addEventListener('bandkit:platform-admin-route', () => void hydrate(root));
}
