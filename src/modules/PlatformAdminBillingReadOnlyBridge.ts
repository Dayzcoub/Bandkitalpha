import { badge, findCardByText, kpi, listRow, markHeaderApiHydrated, type AdminBridgeTone } from './PlatformAdminReadOnlyBridgeUi.js';

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

function planStatusLabel(status?: string): string {
  const map: Record<string, string> = {
    active: 'активен',
    planned: 'запланирован',
    paused: 'пауза',
    archived: 'архив'
  };
  return map[status || ''] || status || 'статус не указан';
}

function planStatusTone(status?: string): AdminBridgeTone {
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
  markHeaderApiHydrated(root, 'adminBillingApiHydrated');
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
  const catalogCard = findCardByText(cards, ['Коммерческий контур платформы']);
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

  const operationsCard = findCardByText(cards, ['Только через аудит и причину']);
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

  const matrixCard = findCardByText(cards, ['Что будет доступно владельцу']);
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
