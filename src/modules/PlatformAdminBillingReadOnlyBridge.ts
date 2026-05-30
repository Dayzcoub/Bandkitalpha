type BillingPlan = {
  key?: string;
  title?: string;
  status?: string;
  price_label?: string;
  scope?: string;
};

type AdminBillingResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  billing_items?: Array<{ id?: string; title?: string; type?: string; status?: string }>;
  summary?: {
    total?: number;
    tariffs?: number;
    subscriptions?: number;
    refunds?: number;
    manual_access?: number;
    source?: string;
  };
  plan_catalog?: BillingPlan[];
  operation_types?: string[];
  guardrails?: Record<string, boolean>;
};

const API_URL = '/api/v1/admin/billing';
let cache: AdminBillingResponse | null = null;
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

function planStatusLabel(status?: string): string {
  const map: Record<string, string> = {
    active: 'активен',
    planned: 'запланирован',
    paused: 'пауза',
    archived: 'архив'
  };
  return map[status || ''] || status || 'статус не указан';
}

function planStatusTone(status?: string): 'neutral' | 'positive' | 'warning' | 'danger' {
  if (status === 'active') return 'positive';
  if (status === 'planned') return 'warning';
  if (status === 'archived') return 'danger';
  return 'neutral';
}

function operationLabel(operation?: string): string {
  const map: Record<string, string> = {
    manual_access: 'Ручная выдача доступа',
    refunds: 'Возвраты и спорные платежи',
    promocodes: 'Промокоды и тестовый доступ'
  };
  return map[operation || ''] || operation || 'Операция биллинга';
}

async function fetchBilling(): Promise<AdminBillingResponse | null> {
  const response = await fetch(API_URL, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<AdminBillingResponse>;
}

function updateHeaderBadge(root: HTMLElement): void {
  const chipRow = root.querySelector<HTMLElement>('.bk-main-column .bk-page-header .bk-chip-row');
  if (!chipRow || chipRow.dataset.adminBillingApiHydrated === 'true') return;
  chipRow.insertAdjacentHTML('beforeend', badge('данные из API', 'positive'));
  chipRow.dataset.adminBillingApiHydrated = 'true';
}

function applyBilling(root: HTMLElement, data: AdminBillingResponse): void {
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.tariffs ?? 0), 'тарифы'),
      kpi(String(summary.subscriptions ?? 0), 'подписки'),
      kpi(String(summary.refunds ?? 0), 'возвраты'),
      kpi(String(summary.manual_access ?? 0), 'ручной доступ')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const catalogCard = cards.find((card) => card.textContent?.includes('Коммерческий контур платформы'));
  const catalogList = catalogCard?.querySelector<HTMLElement>('.bk-list');
  if (catalogList) {
    const plans = data.plan_catalog ?? [];
    catalogList.innerHTML = plans.length
      ? plans.map((plan) => listRow(
          plan.title || plan.key || 'Тариф без названия',
          plan.scope || 'Описание тарифа ещё не подключено.',
          [plan.price_label || 'цена позже', 'только чтение'],
          [{ label: planStatusLabel(plan.status), tone: planStatusTone(plan.status) }]
        )).join('')
      : listRow('Каталог тарифов пока не подключён', 'Контракт API готов, но источник тарифов ещё не подключён к базе.', ['источник не подключён'], [{ label: '0 тарифов' }]);
  }

  const operationsCard = cards.find((card) => card.textContent?.includes('Только через аудит и причину'));
  const operationsList = operationsCard?.querySelector<HTMLElement>('.bk-list');
  if (operationsList) {
    const operations = data.operation_types?.length ? data.operation_types : ['manual_access', 'refunds', 'promocodes'];
    operationsList.innerHTML = operations.map((operation) => listRow(
      operationLabel(operation),
      'Операция пока доступна только как read-only описание будущего коммерческого контура.',
      ['без списаний', 'без возвратов', 'без изменения доступа'],
      [{ label: 'требуется аудит', tone: 'warning' }]
    )).join('');
  }

  const matrixCard = cards.find((card) => card.textContent?.includes('Что будет доступно владельцу'));
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    matrixChips.innerHTML = ['Просмотреть тарифы', 'Открыть подписки', 'Проверить возврат', 'Открыть аудит', 'Промокоды позже'].map((item) => badge(item)).join('');
  }

  updateHeaderBadge(root);
}

async function hydrate(root: HTMLElement): Promise<void> {
  if (window.location.pathname !== '/admin/billing') return;
  window.requestAnimationFrame(() => {
    if (cache?.ok) applyBilling(root, cache);
  });
  if (cache || loading) return;
  loading = true;
  try {
    cache = await fetchBilling();
    if (cache?.ok && window.location.pathname === '/admin/billing') applyBilling(root, cache);
  } catch {
    cache = null;
  } finally {
    loading = false;
  }
}

export function initPlatformAdminBillingReadOnlyBridge(root: HTMLElement): void {
  void hydrate(root);
  window.addEventListener('popstate', () => void hydrate(root));
  window.addEventListener('bandkit:platform-admin-route', () => void hydrate(root));
}
