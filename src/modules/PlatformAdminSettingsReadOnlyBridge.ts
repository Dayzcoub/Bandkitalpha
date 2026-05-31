import { badge, findCardByText, kpi, listRow, markHeaderApiHydrated, safeButton, type AdminBridgeTone } from './PlatformAdminReadOnlyBridgeUi.js';

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
const FALLBACK_PROVIDER_SCOPES = ['google', 'apple', 'email', 'sms'];
const FALLBACK_OPERATION_TYPES = ['review_flags', 'check_2fa_policy', 'review_maintenance', 'review_providers', 'open_settings_audit'];
let cache: AdminSettingsResponse | null = null;
let loading = false;

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

function statusTone(status?: string): AdminBridgeTone {
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
  markHeaderApiHydrated(root, 'adminSettingsApiHydrated');
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
  const flagsCard = findCardByText(cards, ['Глобальные флаги', 'Платформенные настройки', 'Настройки платформы', 'Глобальные политики']);
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

  const providersCard = findCardByText(cards, ['Провайдеры', 'Авторизация', 'Регистрация и подтверждения']);
  const providersList = providersCard?.querySelector<HTMLElement>('.bk-list');
  if (providersList && providersCard !== flagsCard) {
    const providers = data.provider_scopes?.length ? data.provider_scopes : FALLBACK_PROVIDER_SCOPES;
    providersList.innerHTML = providers.map((provider) => listRow(
      providerLabel(provider),
      'Провайдер отображается только как read-only элемент будущей конфигурации.',
      ['без переключения', 'без секретов', 'без изменения настроек'],
      [{ label: 'только чтение' }]
    )).join('');
  }

  const operations = data.operation_types?.length ? data.operation_types : FALLBACK_OPERATION_TYPES;
  const operationLabels = operations.map(operationLabel);
  const matrixCard = findCardByText(cards, ['Матрица', 'Критичные настройки', 'Что можно делать из /admin/settings']);
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    matrixChips.innerHTML = operationLabels.map((item) => badge(item)).join('');
  }

  const safeActionsCard = cards.find((card) => card.querySelector('.bk-card-title')?.textContent?.trim() === 'Безопасные действия');
  const safeActionsRow = safeActionsCard?.querySelector<HTMLElement>('.bk-action-row');
  if (safeActionsRow) {
    safeActionsRow.innerHTML = operationLabels.map((label) => safeButton(label, '/admin/settings')).join('');
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
