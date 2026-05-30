type PlatformFlag = {
  key?: string;
  title?: string;
  status?: string;
  scope?: string;
};

type AdminSettingsResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  settings_items?: Array<{ id?: string; title?: string; status?: string }>;
  summary?: {
    registration?: string;
    two_factor?: string;
    maintenance?: string;
    providers?: number;
    source?: string;
  };
  platform_flags?: PlatformFlag[];
  provider_scopes?: string[];
  operation_types?: string[];
  guardrails?: Record<string, boolean>;
};

const API_URL = '/api/v1/admin/settings';
let cache: AdminSettingsResponse | null = null;
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

function safeButton(label: string): string {
  return `<button class="bk-button bk-button-secondary" type="button" data-admin-route="/admin/settings">${escapeHtml(label)}</button>`;
}

function statusLabel(status?: string): string {
  const map: Record<string, string> = {
    preview_only: 'только просмотр',
    required_for_admins: 'обязательно для админов',
    off: 'выключено',
    on: 'включено',
    not_connected_yet: 'не подключено'
  };
  return map[status || ''] || status || 'не указано';
}

function statusTone(status?: string): 'neutral' | 'positive' | 'warning' | 'danger' {
  if (status === 'off' || status === 'preview_only') return 'positive';
  if (status === 'required_for_admins') return 'warning';
  if (status === 'not_connected_yet') return 'neutral';
  return 'neutral';
}

function providerLabel(provider?: string): string {
  const map: Record<string, string> = {
    google: 'Google login',
    apple: 'Apple ID',
    email: 'email-подтверждение',
    sms: 'SMS-подтверждение'
  };
  return map[provider || ''] || provider || 'провайдер';
}

function operationLabel(operation?: string): string {
  const map: Record<string, string> = {
    review_flags: 'Проверить флаги',
    check_2fa_policy: 'Проверить 2FA политику',
    review_maintenance: 'Проверить maintenance',
    review_providers: 'Проверить провайдеров',
    open_settings_audit: 'Открыть аудит настроек'
  };
  return map[operation || ''] || operation || 'Просмотр настроек';
}

async function fetchSettings(): Promise<AdminSettingsResponse | null> {
  const response = await fetch(API_URL, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<AdminSettingsResponse>;
}

function updateHeaderBadge(root: HTMLElement): void {
  const chipRow = root.querySelector<HTMLElement>('.bk-main-column .bk-page-header .bk-chip-row');
  if (!chipRow || chipRow.dataset.adminSettingsApiHydrated === 'true') return;
  chipRow.insertAdjacentHTML('beforeend', badge('данные из API', 'positive'));
  chipRow.dataset.adminSettingsApiHydrated = 'true';
}

function applySettings(root: HTMLElement, data: AdminSettingsResponse): void {
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(statusLabel(summary.registration), 'регистрация'),
      kpi('2FA', statusLabel(summary.two_factor)),
      kpi(statusLabel(summary.maintenance), 'maintenance'),
      kpi(String(summary.providers ?? 0), 'провайдеры')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const flagsCard = cards.find((card) => {
    const text = card.textContent || '';
    return text.includes('Глобальные флаги') || text.includes('Платформенные настройки') || text.includes('Настройки платформы') || text.includes('Глобальные политики');
  });
  const flagsList = flagsCard?.querySelector<HTMLElement>('.bk-list');
  if (flagsList) {
    const flags = data.platform_flags ?? [];
    flagsList.innerHTML = flags.length
      ? flags.map((flag) => listRow(
          flag.title || flag.key || 'Платформенный флаг',
          flag.scope || 'Описание настройки пока не подключено.',
          ['только чтение', 'без изменения конфигурации'],
          [{ label: statusLabel(flag.status), tone: statusTone(flag.status) }]
        )).join('')
      : listRow('Платформенные настройки пока не подключены', 'Контракт API готов, но источник settings_items ещё не подключён к базе.', ['источник не подключён'], [{ label: '0 настроек' }]);
  }

  const providersCard = cards.find((card) => {
    const text = card.textContent || '';
    return text.includes('Провайдеры') || text.includes('Авторизация') || text.includes('Регистрация и подтверждения');
  });
  const providersList = providersCard?.querySelector<HTMLElement>('.bk-list');
  if (providersList && providersCard !== flagsCard) {
    const providers = data.provider_scopes?.length ? data.provider_scopes : ['google', 'apple', 'email', 'sms'];
    providersList.innerHTML = providers.map((provider) => listRow(
      providerLabel(provider),
      'Провайдер отображается только как read-only элемент будущей конфигурации.',
      ['без переключения', 'без секретов', 'без изменения настроек'],
      [{ label: 'только чтение' }]
    )).join('');
  }

  const operations = data.operation_types?.length ? data.operation_types : ['review_flags', 'check_2fa_policy', 'review_maintenance', 'review_providers', 'open_settings_audit'];
  const operationLabels = operations.map(operationLabel);
  const matrixCard = cards.find((card) => {
    const text = card.textContent || '';
    return text.includes('Матрица') || text.includes('Критичные настройки') || text.includes('Что можно делать из /admin/settings');
  });
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    matrixChips.innerHTML = operationLabels.map((item) => badge(item)).join('');
  }

  const safeActionsCard = cards.find((card) => card.querySelector('.bk-card-title')?.textContent?.trim() === 'Безопасные действия');
  const safeActionsRow = safeActionsCard?.querySelector<HTMLElement>('.bk-action-row');
  if (safeActionsRow) {
    safeActionsRow.innerHTML = operationLabels.map(safeButton).join('');
  }

  updateHeaderBadge(root);
}

async function hydrate(root: HTMLElement): Promise<void> {
  if (window.location.pathname !== '/admin/settings') return;
  window.requestAnimationFrame(() => {
    if (cache?.ok) applySettings(root, cache);
  });
  if (cache || loading) return;
  loading = true;
  try {
    cache = await fetchSettings();
    if (cache?.ok && window.location.pathname === '/admin/settings') applySettings(root, cache);
  } catch {
    cache = null;
  } finally {
    loading = false;
  }
}

export function initPlatformAdminSettingsReadOnlyBridge(root: HTMLElement): void {
  void hydrate(root);
  window.addEventListener('popstate', () => void hydrate(root));
  window.addEventListener('bandkit:platform-admin-route', () => void hydrate(root));
}
