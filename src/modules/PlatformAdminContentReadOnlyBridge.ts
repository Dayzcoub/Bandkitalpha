import { badge, findCardByText, kpi, listRow, markHeaderApiHydrated } from './PlatformAdminReadOnlyBridgeUi.js';

type AdminContentResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  content_items?: Array<{ id?: string; title?: string; scope?: string; status?: string; priority?: string }>;
  summary?: {
    total?: number;
    feed?: number;
    media?: number;
    collections?: number;
    categories?: number;
    source?: string;
  };
  content_scopes?: string[];
  policy_scopes?: string[];
  operation_types?: string[];
  guardrails?: Record<string, boolean>;
};

const API_URL = '/api/v1/admin/content';
const FALLBACK_POLICY_SCOPES = ['categories', 'dictionaries', 'promo_surfaces'];
const FALLBACK_OPERATION_TYPES = ['review_feed', 'review_media', 'manage_collections', 'dictionary_review'];
let cache: AdminContentResponse | null = null;
let loading = false;

function scopeLabel(scope?: string): string {
  const map: Record<string, string> = {
    feed: 'лента',
    media: 'медиа',
    collections: 'подборки',
    categories: 'категории',
    dictionaries: 'словари',
    promo_surfaces: 'промо-поверхности'
  };
  return map[scope || ''] || scope || 'раздел не указан';
}

function operationLabel(operation?: string): string {
  const map: Record<string, string> = {
    review_feed: 'Проверить ленту',
    review_media: 'Проверить медиа',
    manage_collections: 'Проверить подборки',
    dictionary_review: 'Проверить словари'
  };
  return map[operation || ''] || operation || 'Контентная операция';
}

async function fetchContent(): Promise<AdminContentResponse | null> {
  const response = await fetch(API_URL, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<AdminContentResponse>;
}

function updateHeaderBadge(root: HTMLElement): void {
  markHeaderApiHydrated(root, 'adminContentApiHydrated');
}

function applyContent(root: HTMLElement, data: AdminContentResponse): void {
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.feed ?? 0), 'лента'),
      kpi(String(summary.media ?? 0), 'медиа'),
      kpi(String(summary.collections ?? 0), 'подборки'),
      kpi(String(summary.categories ?? 0), 'категории')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const contentCard = findCardByText(cards, ['Лента, медиа и подборки']);
  const contentList = contentCard?.querySelector<HTMLElement>('.bk-list');
  if (contentList) {
    const items = data.content_items ?? [];
    contentList.innerHTML = items.length
      ? items.slice(0, 20).map((item) => listRow(
          item.title || item.id || 'Контентный объект без названия',
          `${scopeLabel(item.scope)} · только просмотр`,
          ['без скрытия', 'без удаления', 'без изменения публикаций'],
          [{ label: item.status || 'ожидает подключения' }, { label: item.priority || 'обычный' }]
        )).join('')
      : listRow('Контентные очереди пока не подключены', 'Контракт API готов, но источник content_items ещё не подключён к базе.', ['источник не подключён'], [{ label: '0 объектов' }]);
  }

  const policyCard = findCardByText(cards, ['Правила и управляемые словари']);
  const policyList = policyCard?.querySelector<HTMLElement>('.bk-list');
  if (policyList) {
    const policies = data.policy_scopes?.length ? data.policy_scopes : FALLBACK_POLICY_SCOPES;
    policyList.innerHTML = policies.map((scope) => listRow(
      scopeLabel(scope),
      'Политика отображается только как read-only настройка будущего контентного контура.',
      ['без изменения словарей', 'без изменения категорий'],
      [{ label: 'только чтение' }]
    )).join('');
  }

  const matrixCard = findCardByText(cards, ['Что можно делать из /admin/content']);
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    const operations = data.operation_types?.length ? data.operation_types : FALLBACK_OPERATION_TYPES;
    matrixChips.innerHTML = operations.map((item) => badge(operationLabel(item))).join('');
  }

  updateHeaderBadge(root);
}

async function hydrate(root: HTMLElement): Promise<void> {
  if (window.location.pathname !== '/admin/content') return;
  window.requestAnimationFrame(() => {
    if (cache?.ok) applyContent(root, cache);
  });
  if (cache || loading) return;
  loading = true;
  try {
    cache = await fetchContent();
    if (cache?.ok && window.location.pathname === '/admin/content') applyContent(root, cache);
  } catch {
    cache = null;
  } finally {
    loading = false;
  }
}

export function initPlatformAdminContentReadOnlyBridge(root: HTMLElement): void {
  void hydrate(root);
  window.addEventListener('popstate', () => void hydrate(root));
  window.addEventListener('bandkit:platform-admin-route', () => void hydrate(root));
}
