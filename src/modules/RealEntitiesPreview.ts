type RealEntity = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  visibility: string;
  created_at: string;
  member_count: number;
};

type EntitiesResponse = {
  ok: boolean;
  entities?: RealEntity[];
  error?: unknown;
};

type EntityResponse = {
  ok: boolean;
  entity?: RealEntity;
  error?: unknown;
};

const PANEL_ID = 'bk-real-entities-preview';
const DETAIL_PANEL_ID = 'bk-real-entity-detail';
const API_URL = '/api/v1/entities';
const MOCK_BAND_IDS = new Set(['b1', 'b2', 'b3']);

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEntityMeta(entity: RealEntity): string {
  const parts = [entity.type, entity.status, entity.visibility, `${entity.member_count} members`];
  return parts.filter(Boolean).join(' · ');
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function currentRealEntitySlug(): string | null {
  const match = window.location.pathname.match(/^\/bands\/([^/]+)$/);
  const slug = match?.[1] ? decodeURIComponent(match[1]) : '';

  if (!slug || slug === 'new' || MOCK_BAND_IDS.has(slug)) return null;
  return slug;
}

function renderLoading(): string {
  return `<section class="bk-card bk-real-entities-card" id="${PANEL_ID}" data-real-entities-preview="loading"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Real API</div><h3 class="bk-card-title">Сущности из PostgreSQL</h3></div><span class="bk-badge">read-only</span></div><p class="bk-state-copy">Загружаем реальные сущности через /api/v1/entities.</p></section>`;
}

function renderError(): string {
  return `<section class="bk-card bk-real-entities-card" id="${PANEL_ID}" data-real-entities-preview="error"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Real API</div><h3 class="bk-card-title">Сущности из PostgreSQL</h3></div><span class="bk-badge bk-badge-warning">offline</span></div><p class="bk-state-copy">Real API сейчас недоступен для этого окружения. Mock-интерфейс ниже продолжает работать.</p></section>`;
}

function renderEntities(entities: RealEntity[]): string {
  const rows = entities.length
    ? entities
      .map((entity) => `<a class="bk-list-row bk-real-entity-row" href="/bands/${escapeHtml(entity.slug)}" data-route="/bands/${escapeHtml(entity.slug)}"><span class="bk-nav-icon" aria-hidden="true">♬</span><span class="bk-real-entity-main"><span class="bk-list-row-title">${escapeHtml(entity.name)}</span><span class="bk-meta bk-real-entity-meta">${escapeHtml(formatEntityMeta(entity))}</span></span><span class="bk-badge bk-badge-positive">DB</span></a>`)
      .join('')
    : `<div class="bk-list-row"><span class="bk-nav-icon" aria-hidden="true">∅</span><span class="bk-real-entity-main"><span class="bk-list-row-title">Нет сущностей в БД</span><span class="bk-meta bk-real-entity-meta">Создай тестовую сущность через staging API smoke.</span></span></div>`;

  return `<section class="bk-card bk-real-entities-card" id="${PANEL_ID}" data-real-entities-preview="ready"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Real API</div><h3 class="bk-card-title">Сущности из PostgreSQL</h3></div><span class="bk-badge bk-badge-positive">read-only</span></div><p class="bk-state-copy">Первое безопасное подключение интерфейса к реальному backend. Запись из UI пока отключена.</p><div class="bk-list">${rows}</div></section>`;
}

function renderDetailLoading(slug: string): string {
  return `<section class="bk-card bk-real-entity-detail-card" id="${DETAIL_PANEL_ID}" data-real-entity-detail="loading" data-real-entity-slug="${escapeHtml(slug)}"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Real API detail</div><h3 class="bk-card-title">Загружаем реальную сущность</h3></div><span class="bk-badge">read-only</span></div><p class="bk-state-copy">Читаем /api/v1/entities/${escapeHtml(slug)}. Запись, редактирование и права пока не подключаем.</p></section>`;
}

function renderDetailError(slug: string): string {
  return `<section class="bk-card bk-real-entity-detail-card" id="${DETAIL_PANEL_ID}" data-real-entity-detail="error" data-real-entity-slug="${escapeHtml(slug)}"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Real API detail</div><h3 class="bk-card-title">Реальная сущность недоступна</h3></div><span class="bk-badge bk-badge-warning">offline</span></div><p class="bk-state-copy">Не удалось прочитать /api/v1/entities/${escapeHtml(slug)}. Mock-detail ниже сохранён как fallback для shell.</p><div class="bk-action-row"><a class="bk-button bk-button-secondary" href="/bands" data-route="/bands">Назад к списку</a></div></section>`;
}

function renderEntityDetail(entity: RealEntity): string {
  return `<section class="bk-card bk-real-entity-detail-card" id="${DETAIL_PANEL_ID}" data-real-entity-detail="ready" data-real-entity-slug="${escapeHtml(entity.slug)}"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Real API detail</div><h3 class="bk-card-title">${escapeHtml(entity.name)}</h3></div><span class="bk-badge bk-badge-positive">DB read-only</span></div><p class="bk-state-copy">Карточка открыта из PostgreSQL через GET /api/v1/entities/${escapeHtml(entity.slug)}. UI-запись отключена до auth/permissions.</p><div class="bk-kpi-grid bk-entity-kpi-grid"><article class="bk-kpi"><strong>${escapeHtml(entity.type)}</strong><span>Тип</span></article><article class="bk-kpi"><strong>${escapeHtml(entity.status)}</strong><span>Статус</span></article><article class="bk-kpi"><strong>${escapeHtml(entity.visibility)}</strong><span>Видимость</span></article><article class="bk-kpi"><strong>${escapeHtml(entity.member_count)}</strong><span>Участники</span></article></div><div class="bk-list"><div class="bk-list-row"><span class="bk-nav-icon" aria-hidden="true">#</span><span><span class="bk-list-row-title">${escapeHtml(entity.slug)}</span><span class="bk-meta">Slug реальной сущности</span></span></div><div class="bk-list-row"><span class="bk-nav-icon" aria-hidden="true">◎</span><span><span class="bk-list-row-title">${escapeHtml(entity.id)}</span><span class="bk-meta">UUID из PostgreSQL</span></span></div><div class="bk-list-row"><span class="bk-nav-icon" aria-hidden="true">◷</span><span><span class="bk-list-row-title">${escapeHtml(formatDate(entity.created_at))}</span><span class="bk-meta">Дата создания</span></span></div></div><section class="bk-profile-feed-policy"><div><strong>Read-only integration checkpoint</strong><span>Ниже остаётся mock-контекст shell, чтобы не подключать create/update/delete до полноценной модели авторизации.</span></div><div class="bk-chip-row"><span class="bk-badge bk-badge-positive">GET only</span><span class="bk-badge">No auth writes</span><span class="bk-badge">Mock fallback preserved</span></div></section><div class="bk-action-row"><a class="bk-button bk-button-secondary" href="/bands" data-route="/bands">Назад к списку</a></div></section>`;
}

async function hydratePanel(panel: HTMLElement): Promise<void> {
  if (panel.dataset.realEntitiesLoading === 'true') return;
  panel.dataset.realEntitiesLoading = 'true';

  try {
    const response = await fetch(API_URL, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = (await response.json()) as EntitiesResponse;
    if (!payload.ok || !Array.isArray(payload.entities)) throw new Error('Invalid entities response');

    panel.outerHTML = renderEntities(payload.entities);
  } catch {
    panel.outerHTML = renderError();
  }
}

async function hydrateDetailPanel(panel: HTMLElement, slug: string): Promise<void> {
  if (panel.dataset.realEntityLoading === 'true') return;
  panel.dataset.realEntityLoading = 'true';

  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(slug)}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = (await response.json()) as EntityResponse;
    if (!payload.ok || !payload.entity) throw new Error('Invalid entity response');

    panel.outerHTML = renderEntityDetail(payload.entity);
  } catch {
    panel.outerHTML = renderDetailError(slug);
  }
}

function mountList(root: HTMLElement): void {
  if (window.location.pathname !== '/bands') return;
  if (root.querySelector(`#${PANEL_ID}`)) return;

  const anchor = root.querySelector<HTMLElement>('.bk-grid-card');
  if (!anchor) return;

  anchor.insertAdjacentHTML('beforebegin', renderLoading());
  const panel = root.querySelector<HTMLElement>(`#${PANEL_ID}`);
  if (panel) void hydratePanel(panel);
}

function mountDetail(root: HTMLElement): void {
  const slug = currentRealEntitySlug();
  if (!slug) return;

  const existing = root.querySelector<HTMLElement>(`#${DETAIL_PANEL_ID}`);
  if (existing?.dataset.realEntitySlug === slug) return;
  existing?.remove();

  const anchor = root.querySelector<HTMLElement>('.bk-main-column > .bk-card')
    ?? root.querySelector<HTMLElement>('.bk-band-logistics-card')
    ?? root.querySelector<HTMLElement>('.bk-card');
  if (!anchor) return;

  anchor.insertAdjacentHTML('beforebegin', renderDetailLoading(slug));
  const panel = root.querySelector<HTMLElement>(`#${DETAIL_PANEL_ID}`);
  if (panel) void hydrateDetailPanel(panel, slug);
}

function mount(root: HTMLElement): void {
  mountList(root);
  mountDetail(root);
}

export function initRealEntitiesPreview(root: HTMLElement): void {
  mount(root);

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(() => mount(root));
  });

  observer.observe(root, {
    childList: true,
    subtree: true
  });
}
