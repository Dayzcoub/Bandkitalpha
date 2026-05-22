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

const PANEL_ID = 'bk-real-entities-preview';
const API_URL = '/api/v1/entities';

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

function renderLoading(): string {
  return `<section class="bk-card bk-real-entities-card" id="${PANEL_ID}" data-real-entities-preview="loading"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Real API</div><h3 class="bk-card-title">Сущности из PostgreSQL</h3></div><span class="bk-badge">read-only</span></div><p class="bk-state-copy">Загружаем реальные сущности через /api/v1/entities.</p></section>`;
}

function renderError(): string {
  return `<section class="bk-card bk-real-entities-card" id="${PANEL_ID}" data-real-entities-preview="error"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Real API</div><h3 class="bk-card-title">Сущности из PostgreSQL</h3></div><span class="bk-badge bk-badge-warning">offline</span></div><p class="bk-state-copy">Real API сейчас недоступен для этого окружения. Mock-интерфейс ниже продолжает работать.</p></section>`;
}

function renderEntities(entities: RealEntity[]): string {
  const rows = entities.length
    ? entities
      .map((entity) => `<a class="bk-list-row bk-real-entity-row" href="/bands/${escapeHtml(entity.slug)}" data-route="/bands/${escapeHtml(entity.slug)}"><span class="bk-nav-icon" aria-hidden="true">♬</span><span><span class="bk-list-row-title">${escapeHtml(entity.name)}</span><span class="bk-meta">${escapeHtml(formatEntityMeta(entity))}</span></span><span class="bk-badge bk-badge-positive">DB</span></a>`)
      .join('')
    : `<div class="bk-list-row"><span class="bk-nav-icon" aria-hidden="true">∅</span><span><span class="bk-list-row-title">Нет сущностей в БД</span><span class="bk-meta">Создай тестовую сущность через staging API smoke.</span></span></div>`;

  return `<section class="bk-card bk-real-entities-card" id="${PANEL_ID}" data-real-entities-preview="ready"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Real API</div><h3 class="bk-card-title">Сущности из PostgreSQL</h3></div><span class="bk-badge bk-badge-positive">read-only</span></div><p class="bk-state-copy">Первое безопасное подключение интерфейса к реальному backend. Запись из UI пока отключена.</p><div class="bk-list">${rows}</div></section>`;
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

function mount(root: HTMLElement): void {
  if (window.location.pathname !== '/bands') return;
  if (root.querySelector(`#${PANEL_ID}`)) return;

  const anchor = root.querySelector<HTMLElement>('.bk-grid-card');
  if (!anchor) return;

  anchor.insertAdjacentHTML('beforebegin', renderLoading());
  const panel = root.querySelector<HTMLElement>(`#${PANEL_ID}`);
  if (panel) void hydratePanel(panel);
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
