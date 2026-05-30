import { badge, findCardByText, kpi, listRow, markHeaderApiHydrated, safeButton, type AdminBridgeTone } from './PlatformAdminReadOnlyBridgeUi.js';

type AdminStaffCatalogItem = {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  tags?: string[];
};

type AdminStaffCatalogResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  items?: AdminStaffCatalogItem[];
  summary?: { groups?: number; elevated?: number; scoped?: number; source?: string };
  operation_types?: string[];
  guardrails?: Record<string, boolean>;
};

const API_URL = '/api/v1/admin/roles';
let cache: AdminStaffCatalogResponse | null = null;
let loading = false;

function statusLabel(status?: string): string {
  const map: Record<string, string> = {
    elevated: 'повышенный доступ',
    staff: 'команда',
    case_limited: 'только по кейсу',
    scoped: 'ограничено областью'
  };
  return map[status || ''] || status || 'только чтение';
}

function statusTone(status?: string): AdminBridgeTone {
  if (status === 'elevated') return 'danger';
  if (status === 'staff') return 'warning';
  if (status === 'case_limited') return 'positive';
  return 'neutral';
}

function operationLabel(operation?: string): string {
  const map: Record<string, string> = {
    review_matrix: 'Проверить матрицу',
    open_history: 'Открыть историю',
    check_2fa_status: 'Проверить 2FA статус',
    review_restrictions: 'Просмотреть ограничения',
    export_matrix: 'Экспорт матрицы'
  };
  return map[operation || ''] || operation || 'Просмотр';
}

async function fetchRoles(): Promise<AdminStaffCatalogResponse | null> {
  const response = await fetch(API_URL, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<AdminStaffCatalogResponse>;
}

function updateHeaderBadge(root: HTMLElement): void {
  markHeaderApiHydrated(root, 'adminRolesApiHydrated');
}

function applyRoles(root: HTMLElement, data: AdminStaffCatalogResponse): void {
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.groups ?? 4), 'группы ролей команды'),
      kpi('2FA', 'обязательно для повышенного доступа'),
      kpi('Аудит', 'изменения логируются'),
      kpi(String(summary.scoped ?? 2), 'ограниченные области')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const catalogCard = findCardByText(cards, ['Платформенная матрица команды']);
  const catalogList = catalogCard?.querySelector<HTMLElement>('.bk-list');
  if (catalogList) {
    const items = data.items ?? [];
    catalogList.innerHTML = items.length
      ? items.map((item) => listRow(
          item.title || item.id || 'Позиция матрицы',
          item.description || 'Описание области ответственности пока не подключено.',
          item.tags?.length ? item.tags : ['только чтение'],
          [{ label: statusLabel(item.status), tone: statusTone(item.status) }]
        )).join('')
      : listRow('Каталог ролей пока не подключён', 'Контракт API готов, но источник staff catalog ещё не подключён к базе.', ['источник не подключён'], [{ label: '0 записей' }]);
  }

  const operations = data.operation_types?.length ? data.operation_types : ['review_matrix', 'open_history', 'check_2fa_status', 'review_restrictions', 'export_matrix'];
  const operationLabels = operations.map(operationLabel);
  const matrixCard = findCardByText(cards, ['Матрица действий']);
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    matrixChips.innerHTML = operationLabels.map((item) => badge(item)).join('');
  }

  const safeActionsCard = cards.find((card) => card.querySelector('.bk-card-title')?.textContent?.trim() === 'Безопасные действия');
  const safeActionsRow = safeActionsCard?.querySelector<HTMLElement>('.bk-action-row');
  if (safeActionsRow) {
    safeActionsRow.innerHTML = operationLabels.map((label) => safeButton(label, '/admin/roles')).join('');
  }

  updateHeaderBadge(root);
}

async function hydrate(root: HTMLElement): Promise<void> {
  if (window.location.pathname !== '/admin/roles') return;
  window.requestAnimationFrame(() => {
    if (cache?.ok) applyRoles(root, cache);
  });
  if (cache || loading) return;
  loading = true;
  try {
    cache = await fetchRoles();
    if (cache?.ok && window.location.pathname === '/admin/roles') applyRoles(root, cache);
  } catch {
    cache = null;
  } finally {
    loading = false;
  }
}

export function initPlatformAdminRolesReadOnlyBridge(root: HTMLElement): void {
  void hydrate(root);
  window.addEventListener('popstate', () => void hydrate(root));
  window.addEventListener('bandkit:platform-admin-route', () => void hydrate(root));
}
