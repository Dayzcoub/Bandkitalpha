import { badge, findCardByText, kpi, listRow, markHeaderApiHydrated, type AdminBridgeTone } from './PlatformAdminReadOnlyBridgeUi.js';

type LanguagePack = {
  code?: string;
  title?: string;
  status?: string;
  fallback?: boolean;
  scope?: string;
};

type AdminLocalizationResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  locale_items?: Array<{ id?: string; title?: string; namespace?: string; status?: string }>;
  summary?: {
    ru?: string;
    fallback?: string;
    namespaces?: number;
    missing_keys?: number;
    source?: string;
  };
  language_packs?: LanguagePack[];
  namespaces?: string[];
  operation_types?: string[];
  guardrails?: Record<string, boolean>;
};

const API_URL = '/api/v1/admin/localization';
const FALLBACK_NAMESPACES = ['nav', 'admin', 'common', 'auth'];
const FALLBACK_OPERATION_TYPES = ['check_missing_keys', 'export_json', 'import_pack', 'compare_ru_en'];
let cache: AdminLocalizationResponse | null = null;
let loading = false;

function statusLabel(status?: string): string {
  const map: Record<string, string> = {
    active: 'активна',
    fallback: 'fallback',
    planned: 'запланирована',
    draft: 'черновик'
  };
  return map[status || ''] || status || 'статус не указан';
}

function statusTone(status?: string): AdminBridgeTone {
  if (status === 'active') return 'positive';
  if (status === 'fallback' || status === 'planned') return 'warning';
  return 'neutral';
}

function namespaceLabel(namespace?: string): string {
  const map: Record<string, string> = {
    nav: 'навигация',
    admin: 'админка',
    common: 'общие строки',
    auth: 'авторизация'
  };
  return map[namespace || ''] || namespace || 'namespace';
}

function operationLabel(operation?: string): string {
  const map: Record<string, string> = {
    check_missing_keys: 'Проверить missing keys',
    export_json: 'Экспорт JSON',
    import_pack: 'Импорт пакета',
    compare_ru_en: 'Сравнить RU/EN'
  };
  return map[operation || ''] || operation || 'Операция локализации';
}

async function fetchLocalization(): Promise<AdminLocalizationResponse | null> {
  const response = await fetch(API_URL, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<AdminLocalizationResponse>;
}

function updateHeaderBadge(root: HTMLElement): void {
  markHeaderApiHydrated(root, 'adminLocalizationApiHydrated');
}

function applyLocalization(root: HTMLElement, data: AdminLocalizationResponse): void {
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.ru || 'active').toUpperCase(), 'RU / базовый язык'),
      kpi(String(summary.fallback || 'en').toUpperCase(), 'fallback locale'),
      kpi(String(summary.namespaces ?? 0), 'namespace'),
      kpi(String(summary.missing_keys ?? 0), 'missing keys')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const localeCard = findCardByText(cards, ['Языковые пакеты и ключи переводов']);
  const localeList = localeCard?.querySelector<HTMLElement>('.bk-list');
  if (localeList) {
    const packs = data.language_packs ?? [];
    localeList.innerHTML = packs.length
      ? packs.map((pack) => listRow(
          pack.title || pack.code || 'Языковой пакет',
          pack.scope || 'Описание пакета ещё не подключено.',
          [pack.fallback ? 'fallback' : 'основной', 'только чтение'],
          [{ label: statusLabel(pack.status), tone: statusTone(pack.status) }]
        )).join('')
      : listRow('Языковые пакеты пока не подключены', 'Контракт API готов, но источник language_packs ещё не подключён к базе.', ['источник не подключён'], [{ label: '0 пакетов' }]);
  }

  const boundaryCard = findCardByText(cards, ['Строки остаются в i18n JSON']);
  const boundaryList = boundaryCard?.querySelector<HTMLElement>('.bk-list');
  if (boundaryList) {
    const namespaces = data.namespaces?.length ? data.namespaces : FALLBACK_NAMESPACES;
    boundaryList.innerHTML = namespaces.map((namespace) => listRow(
      namespaceLabel(namespace),
      'Namespace отображается только как read-only область будущего i18n tooling.',
      ['без DB-write', 'без изменения строк'],
      [{ label: 'только чтение' }]
    )).join('');
  }

  const operationsCard = findCardByText(cards, ['Что будет доступно менеджеру переводов']);
  const operationChips = operationsCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (operationChips) {
    const operations = data.operation_types?.length ? data.operation_types : FALLBACK_OPERATION_TYPES;
    operationChips.innerHTML = operations.map((item) => badge(operationLabel(item))).join('');
  }

  updateHeaderBadge(root);
}

async function hydrate(root: HTMLElement): Promise<void> {
  if (window.location.pathname !== '/admin/localization') return;
  window.requestAnimationFrame(() => {
    if (cache?.ok) applyLocalization(root, cache);
  });
  if (cache || loading) return;
  loading = true;
  try {
    cache = await fetchLocalization();
    if (cache?.ok && window.location.pathname === '/admin/localization') applyLocalization(root, cache);
  } catch {
    cache = null;
  } finally {
    loading = false;
  }
}

export function initPlatformAdminLocalizationReadOnlyBridge(root: HTMLElement): void {
  void hydrate(root);
  window.addEventListener('popstate', () => void hydrate(root));
  window.addEventListener('bandkit:platform-admin-route', () => void hydrate(root));
}
