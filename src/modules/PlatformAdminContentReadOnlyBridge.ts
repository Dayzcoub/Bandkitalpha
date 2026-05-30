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
let cache: AdminContentResponse | null = null;
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
  const chipRow = root.querySelector<HTMLElement>('.bk-main-column .bk-page-header .bk-chip-row');
  if (!chipRow || chipRow.dataset.adminContentApiHydrated === 'true') return;
  chipRow.insertAdjacentHTML('beforeend', badge('данные из API', 'positive'));
  chipRow.dataset.adminContentApiHydrated = 'true';
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
  const contentCard = cards.find((card) => card.textContent?.includes('Лента, медиа и подборки'));
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

  const policyCard = cards.find((card) => card.textContent?.includes('Правила и управляемые словари'));
  const policyList = policyCard?.querySelector<HTMLElement>('.bk-list');
  if (policyList) {
    const policies = data.policy_scopes?.length ? data.policy_scopes : ['categories', 'dictionaries', 'promo_surfaces'];
    policyList.innerHTML = policies.map((scope) => listRow(
      scopeLabel(scope),
      'Политика отображается только как read-only настройка будущего контентного контура.',
      ['без изменения словарей', 'без изменения категорий'],
      [{ label: 'только чтение' }]
    )).join('');
  }

  const matrixCard = cards.find((card) => card.textContent?.includes('Что можно делать из /admin/content'));
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    const operations = data.operation_types?.length ? data.operation_types : ['review_feed', 'review_media', 'manage_collections', 'dictionary_review'];
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
