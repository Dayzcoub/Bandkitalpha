type AdminStaffCatalogResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  items?: Array<{ id?: string; title?: string; status?: string }>;
  summary?: { groups?: number; elevated?: number; scoped?: number; source?: string };
  operation_types?: string[];
  guardrails?: Record<string, boolean>;
};

const API_URL = '/api/v1/admin/roles';
let cache: AdminStaffCatalogResponse | null = null;
let loading = false;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}

function badge(label: string, tone: 'neutral' | 'positive' | 'warning' | 'danger' = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

function kpi(value: string, label: string): string {
  return `<div class="bk-kpi"><div class="bk-kpi-value">${escapeHtml(value)}</div><div class="bk-kpi-label">${escapeHtml(label)}</div></div>`;
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
  const chipRow = root.querySelector<HTMLElement>('.bk-main-column .bk-page-header .bk-chip-row');
  if (!chipRow || chipRow.dataset.adminRolesApiHydrated === 'true') return;
  chipRow.insertAdjacentHTML('beforeend', badge('данные из API', 'positive'));
  chipRow.dataset.adminRolesApiHydrated = 'true';
}

function applyRoles(root: HTMLElement, data: AdminStaffCatalogResponse): void {
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.groups ?? 4), 'группы ролей команды'),
      kpi('2FA', 'обязательно для elevated'),
      kpi('Аудит', 'изменения логируются'),
      kpi(String(summary.scoped ?? 2), 'ограниченные области')
    ].join('');
  }

  const operations = data.operation_types?.length ? data.operation_types : ['review_matrix', 'open_history', 'check_2fa_status', 'review_restrictions', 'export_matrix'];
  const operationLabels = operations.map(operationLabel);
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const matrixCard = cards.find((card) => card.textContent?.includes('Матрица действий'));
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    matrixChips.innerHTML = operationLabels.map((item) => badge(item)).join('');
  }

  const safeActionsCard = cards.find((card) => card.querySelector('.bk-card-title')?.textContent?.trim() === 'Безопасные действия');
  const safeActionsRow = safeActionsCard?.querySelector<HTMLElement>('.bk-action-row');
  if (safeActionsRow) {
    safeActionsRow.innerHTML = operationLabels.map((label) => `<button class="bk-button bk-button-secondary" type="button" data-admin-route="/admin/roles">${escapeHtml(label)}</button>`).join('');
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
