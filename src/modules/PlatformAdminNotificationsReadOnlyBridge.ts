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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}

function kpi(value: string, label: string): string {
  return `<div class="bk-kpi"><div class="bk-kpi-value">${escapeHtml(value)}</div><div class="bk-kpi-label">${escapeHtml(label)}</div></div>`;
}

function badge(label: string, tone: 'neutral' | 'positive' | 'warning' | 'danger' = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

function listRow(title: string, meta: string, details: string[], badges: Array<{ label: string; tone?: 'neutral' | 'positive' | 'warning' | 'danger' }>): string {
  const detailHtml = details.map((item) => badge(item)).join('');
  const badgeHtml = badges.map((item) => badge(item.label, item.tone)).join('');
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">◇</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(title)}</div><div class="bk-meta">${escapeHtml(meta)}</div>${detailHtml ? `<div class="bk-chip-row">${detailHtml}</div>` : ''}</div>${badgeHtml ? `<div class="bk-chip-row">${badgeHtml}</div>` : ''}</div>`;
}

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
  const chipRow = root.querySelector<HTMLElement>('.bk-main-column .bk-page-header .bk-chip-row');
  if (!chipRow || chipRow.dataset.adminNotificationsApiHydrated === 'true') return;
  chipRow.insertAdjacentHTML('beforeend', badge('данные из API', 'positive'));
  chipRow.dataset.adminNotificationsApiHydrated = 'true';
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
  const queueCard = cards.find((card) => card.textContent?.includes('Уведомления и рассылки'));
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

  const templatesCard = cards.find((card) => card.textContent?.includes('Шаблоны и каналы'));
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

  const matrixCard = cards.find((card) => card.textContent?.includes('Матрица отправки') || card.textContent?.includes('Что будет доступно из /admin/notifications'));
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    const operations = data.operation_types?.length ? data.operation_types : ['review_queue', 'preview_template', 'check_delivery_status', 'audit_subscriptions'];
    matrixChips.innerHTML = operations.map((item) => badge(operationLabel(item))).join('');
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
