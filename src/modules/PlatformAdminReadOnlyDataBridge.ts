type AdminOverviewResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  summary?: {
    users?: { total?: number; active?: number };
    entities?: { total?: number; active?: number };
    events?: { total?: number };
    reports?: { open?: number; source?: string };
    audit?: { total?: number; recent?: Array<AdminAuditEvent> };
  };
  guardrails?: Record<string, boolean>;
};

type AdminEntity = {
  id?: string;
  name?: string;
  slug?: string;
  type?: string;
  status?: string;
  visibility?: string;
  created_at?: string;
  owner?: { display_name?: string | null; handle?: string | null } | null;
  member_count?: number;
  event_count?: number;
  audit_event_count?: number;
};

type AdminEntitiesResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  entities?: AdminEntity[];
  guardrails?: Record<string, boolean>;
};

type AdminReport = {
  id?: string;
  title?: string;
  type?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  subject?: string;
};

type AdminReportsResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  reports?: AdminReport[];
  summary?: { total?: number; open?: number; high_priority?: number; escalated?: number; appeals?: number; source?: string };
  workflow?: string[];
  guardrails?: Record<string, boolean>;
};

type AdminAuditEvent = {
  id?: string;
  action?: string;
  entity_id?: string | null;
  created_at?: string;
  actor?: { display_name?: string | null; handle?: string | null } | null;
  metadata?: Record<string, unknown>;
};

type AdminAuditResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  audit_events?: AdminAuditEvent[];
  summary?: { total_returned?: number; by_action?: Array<{ key?: string; count?: number }> };
  guardrails?: Record<string, boolean>;
};

const ADMIN_ROOT = '/admin';
const API_BASE = '/api/v1/admin';

let overviewCache: AdminOverviewResponse | null = null;
let entitiesCache: AdminEntitiesResponse | null = null;
let reportsCache: AdminReportsResponse | null = null;
let auditCache: AdminAuditResponse | null = null;
let overviewLoading = false;
let entitiesLoading = false;
let reportsLoading = false;
let auditLoading = false;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
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

function statusTone(status?: string): 'neutral' | 'positive' | 'warning' | 'danger' {
  if (status === 'active' || status === 'resolved') return 'positive';
  if (status === 'suspended' || status === 'blocked' || status === 'rejected') return 'danger';
  if (status === 'pending' || status === 'review' || status === 'in_review' || status === 'new' || status === 'escalated') return 'warning';
  return 'neutral';
}

function entityTypeLabel(type?: string): string {
  const map: Record<string, string> = {
    band: 'группа',
    solo_artist: 'соло-артист',
    orchestra: 'оркестр',
    project: 'проект',
    organization: 'организация',
    studio: 'студия',
    venue: 'площадка',
    agency: 'агентство',
    other: 'другое'
  };
  return map[type || ''] || type || 'сущность';
}

function entityVisibilityLabel(visibility?: string): string {
  const map: Record<string, string> = {
    private: 'приватная',
    members: 'для участников',
    registered: 'для зарегистрированных',
    public: 'публичная'
  };
  return map[visibility || ''] || visibility || 'видимость не указана';
}

function actionLabel(action?: string): string {
  const map: Record<string, string> = {
    'entity.created': 'Создана сущность'
  };
  return map[action || ''] || action || 'Событие аудита';
}

function formatDate(value?: string): string {
  if (!value) return 'дата не указана';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

function updateHeaderBadge(root: HTMLElement, text: string, tone: 'neutral' | 'positive' | 'warning' | 'danger' = 'positive'): void {
  const chipRow = root.querySelector<HTMLElement>('.bk-main-column .bk-page-header .bk-chip-row');
  if (!chipRow || chipRow.dataset.adminApiHydrated === 'true') return;
  chipRow.insertAdjacentHTML('beforeend', badge(text, tone));
  chipRow.dataset.adminApiHydrated = 'true';
}

function updateOverview(root: HTMLElement, data: AdminOverviewResponse): void {
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.users?.total ?? 0), 'пользователей всего'),
      kpi(String(summary.entities?.total ?? 0), 'сущностей всего'),
      kpi(String(summary.events?.total ?? 0), 'событий всего'),
      kpi(String(summary.audit?.total ?? 0), 'событий аудита')
    ].join('');
  }
  updateHeaderBadge(root, 'данные из API', 'positive');
}

function updateEntities(root: HTMLElement, data: AdminEntitiesResponse): void {
  const entities = data.entities ?? [];
  const totalMembers = entities.reduce((sum, item) => sum + Number(item.member_count || 0), 0);
  const totalEvents = entities.reduce((sum, item) => sum + Number(item.event_count || 0), 0);
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(entities.length), 'сущностей из API'),
      kpi(String(totalMembers), 'участников всего'),
      kpi(String(totalEvents), 'событий всего'),
      kpi('Read API', 'только чтение')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const registryCard = cards.find((card) => card.textContent?.includes('Платформенный обзор без входа в админку сущности'));
  const list = registryCard?.querySelector<HTMLElement>('.bk-list');
  if (list) {
    const rows = entities.length
      ? entities.slice(0, 20).map((entity) => {
          const owner = entity.owner?.display_name || entity.owner?.handle || 'владелец не указан';
          const meta = `${entityTypeLabel(entity.type)} · владелец ${owner} · ${entityVisibilityLabel(entity.visibility)}`;
          return listRow(
            entity.name || entity.slug || 'Без названия',
            meta,
            [
              `${Number(entity.member_count || 0)} участников`,
              `${Number(entity.event_count || 0)} событий`,
              `${Number(entity.audit_event_count || 0)} записей аудита`
            ],
            [{ label: entity.status || 'unknown', tone: statusTone(entity.status) }, { label: 'API только чтение' }]
          );
        }).join('')
      : listRow('Сущности не найдены', 'API вернул пустой список сущностей.', [], [{ label: 'пусто', tone: 'neutral' }]);
    list.innerHTML = rows;
  }
  updateHeaderBadge(root, 'данные из API', 'positive');
}

function updateReports(root: HTMLElement, data: AdminReportsResponse): void {
  const reports = data.reports ?? [];
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.open ?? 0), 'открытые жалобы'),
      kpi(String(summary.high_priority ?? 0), 'высокий приоритет'),
      kpi(String(summary.escalated ?? 0), 'эскалации'),
      kpi(String(summary.appeals ?? 0), 'апелляции')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const queueCard = cards.find((card) => card.textContent?.includes('Операционные кейсы модерации'));
  const list = queueCard?.querySelector<HTMLElement>('.bk-list');
  if (list) {
    list.innerHTML = reports.length
      ? reports.slice(0, 20).map((report) => listRow(
          report.title || report.id || 'Жалоба без названия',
          `${report.type || 'тип не указан'} · ${report.subject || 'объект не указан'} · ${formatDate(report.created_at)}`,
          ['только чтение', 'без решений модерации'],
          [{ label: report.status || 'new', tone: statusTone(report.status) }, { label: report.priority || 'обычный' }]
        )).join('')
      : listRow('Жалобы пока не подключены', 'Контракт API готов, но источник жалоб ещё не подключён к базе.', ['source: not_connected_yet'], [{ label: '0 открытых' }]);
  }
  updateHeaderBadge(root, 'данные из API', 'positive');
}

function updateAudit(root: HTMLElement, data: AdminAuditResponse): void {
  const events = data.audit_events ?? [];
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(events.length), 'записей получено'),
      kpi(String(data.summary?.by_action?.length ?? 0), 'типов действий'),
      kpi('Read API', 'только чтение'),
      kpi('Guarded', 'без изменений')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const auditCard = cards.find((card) => card.textContent?.includes('Неизменяемый журнал платформы'));
  const list = auditCard?.querySelector<HTMLElement>('.bk-list');
  if (list) {
    list.innerHTML = events.length
      ? events.slice(0, 30).map((event) => {
          const actor = event.actor?.display_name || event.actor?.handle || 'системное действие';
          const meta = `${actor} · ${formatDate(event.created_at)}`;
          const details = [event.entity_id ? `entity ${event.entity_id}` : 'без сущности', 'только чтение'];
          return listRow(actionLabel(event.action), meta, details, [{ label: event.action || 'audit' }, { label: 'аудит', tone: 'warning' }]);
        }).join('')
      : listRow('Событий аудита пока нет', 'API вернул пустой список audit_events.', ['только чтение'], [{ label: 'пусто' }]);
  }
  updateHeaderBadge(root, 'данные из API', 'positive');
}

function applyCachedData(root: HTMLElement): void {
  const path = window.location.pathname;
  if (path === '/admin' && overviewCache?.ok) updateOverview(root, overviewCache);
  if (path === '/admin/entities' && entitiesCache?.ok) updateEntities(root, entitiesCache);
  if (path === '/admin/reports' && reportsCache?.ok) updateReports(root, reportsCache);
  if (path === '/admin/audit' && auditCache?.ok) updateAudit(root, auditCache);
}

async function loadOverview(root: HTMLElement): Promise<void> {
  if (overviewCache || overviewLoading) return;
  overviewLoading = true;
  try {
    overviewCache = await fetchJson<AdminOverviewResponse>(`${API_BASE}/overview`);
    applyCachedData(root);
  } catch {
    overviewCache = null;
  } finally {
    overviewLoading = false;
  }
}

async function loadEntities(root: HTMLElement): Promise<void> {
  if (entitiesCache || entitiesLoading) return;
  entitiesLoading = true;
  try {
    entitiesCache = await fetchJson<AdminEntitiesResponse>(`${API_BASE}/entities`);
    applyCachedData(root);
  } catch {
    entitiesCache = null;
  } finally {
    entitiesLoading = false;
  }
}

async function loadReports(root: HTMLElement): Promise<void> {
  if (reportsCache || reportsLoading) return;
  reportsLoading = true;
  try {
    reportsCache = await fetchJson<AdminReportsResponse>(`${API_BASE}/reports`);
    applyCachedData(root);
  } catch {
    reportsCache = null;
  } finally {
    reportsLoading = false;
  }
}

async function loadAudit(root: HTMLElement): Promise<void> {
  if (auditCache || auditLoading) return;
  auditLoading = true;
  try {
    auditCache = await fetchJson<AdminAuditResponse>(`${API_BASE}/audit`);
    applyCachedData(root);
  } catch {
    auditCache = null;
  } finally {
    auditLoading = false;
  }
}

function hydrate(root: HTMLElement): void {
  if (!window.location.pathname.startsWith(ADMIN_ROOT)) return;
  window.requestAnimationFrame(() => {
    applyCachedData(root);
    if (window.location.pathname === '/admin') void loadOverview(root);
    if (window.location.pathname === '/admin/entities') void loadEntities(root);
    if (window.location.pathname === '/admin/reports') void loadReports(root);
    if (window.location.pathname === '/admin/audit') void loadAudit(root);
  });
}

export function initPlatformAdminReadOnlyDataBridge(root: HTMLElement): void {
  hydrate(root);
  window.addEventListener('popstate', () => hydrate(root));
  window.addEventListener('bandkit:platform-admin-route', () => hydrate(root));
}
