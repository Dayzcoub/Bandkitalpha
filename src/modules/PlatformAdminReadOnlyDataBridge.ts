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

type AdminUser = {
  id?: string;
  display_name?: string | null;
  handle?: string | null;
  status?: string | null;
  created_at?: string | null;
  entity_count?: number;
  owned_entity_count?: number;
  audit_event_count?: number;
  verification?: { email_verified?: boolean; phone_verified?: boolean; source?: string };
  security?: { two_factor_enabled?: boolean; source?: string };
};

type AdminUsersResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  users?: AdminUser[];
  summary?: { total_returned?: number; by_status?: Array<{ key?: string; count?: number }> };
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

type AdminModerationItem = {
  id?: string;
  title?: string;
  queue?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  subject?: string;
};

type AdminModerationResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  moderation_items?: AdminModerationItem[];
  summary?: { total?: number; content?: number; messages?: number; profiles?: number; visibility?: number; source?: string };
  queues?: string[];
  decisions?: string[];
  guardrails?: Record<string, boolean>;
};

type AdminTrustSignal = {
  id?: string;
  title?: string;
  type?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  subject?: string;
};

type AdminTrustResponse = {
  ok?: boolean;
  mode?: string;
  generated_at?: string;
  trust_signals?: AdminTrustSignal[];
  summary?: { total?: number; link_risk?: number; spam?: number; suspicious_login?: number; rating_dispute?: number; source?: string };
  signal_types?: string[];
  policies?: string[];
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
let usersCache: AdminUsersResponse | null = null;
let entitiesCache: AdminEntitiesResponse | null = null;
let reportsCache: AdminReportsResponse | null = null;
let moderationCache: AdminModerationResponse | null = null;
let trustCache: AdminTrustResponse | null = null;
let auditCache: AdminAuditResponse | null = null;
let overviewLoading = false;
let usersLoading = false;
let entitiesLoading = false;
let reportsLoading = false;
let moderationLoading = false;
let trustLoading = false;
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

function statusTone(status?: string | null): 'neutral' | 'positive' | 'warning' | 'danger' {
  if (status === 'active' || status === 'resolved') return 'positive';
  if (status === 'suspended' || status === 'blocked' || status === 'rejected') return 'danger';
  if (status === 'pending' || status === 'review' || status === 'in_review' || status === 'new' || status === 'escalated') return 'warning';
  return 'neutral';
}

function statusLabel(status?: string | null): string {
  const map: Record<string, string> = {
    active: 'активен',
    inactive: 'неактивен',
    pending: 'ожидает',
    review: 'проверка',
    in_review: 'на проверке',
    new: 'новая',
    escalated: 'эскалация',
    resolved: 'решена',
    rejected: 'отклонена',
    suspended: 'заморожен',
    blocked: 'заблокирован'
  };
  return map[status || ''] || status || 'неизвестно';
}

function entityStatusLabel(status?: string): string {
  if (status === 'active') return 'активна';
  return statusLabel(status);
}

function priorityLabel(priority?: string): string {
  const map: Record<string, string> = {
    low: 'низкий',
    normal: 'обычный',
    medium: 'средний',
    high: 'высокий',
    critical: 'критичный'
  };
  return map[priority || ''] || priority || 'обычный';
}

function queueLabel(queue?: string): string {
  const map: Record<string, string> = {
    content: 'контент',
    reported_messages: 'сообщения по жалобе',
    profiles: 'профили',
    entity_visibility: 'видимость сущностей'
  };
  return map[queue || ''] || queue || 'очередь не указана';
}

function decisionLabel(decision?: string): string {
  const map: Record<string, string> = {
    hide: 'скрыть',
    unpublish: 'снять с публикации',
    restrict_messages: 'ограничить сообщения',
    leave_unchanged: 'оставить без изменений',
    escalate: 'эскалация'
  };
  return map[decision || ''] || decision || 'решение';
}

function trustSignalLabel(type?: string): string {
  const map: Record<string, string> = {
    link_risk: 'риск внешних ссылок',
    spam: 'спам-паттерн',
    suspicious_login: 'подозрительный вход',
    rating_dispute: 'спор по рейтингу'
  };
  return map[type || ''] || type || 'сигнал не указан';
}

function trustPolicyLabel(policy?: string): string {
  const map: Record<string, string> = {
    external_links: 'внешние ссылки',
    new_account_limits: 'лимиты новых аккаунтов',
    high_risk_actions: 'действия высокого риска'
  };
  return map[policy || ''] || policy || 'политика';
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

function actionBadgeLabel(action?: string): string {
  const map: Record<string, string> = {
    'entity.created': 'создание сущности'
  };
  return map[action || ''] || actionLabel(action).toLowerCase();
}

function formatDate(value?: string | null): string {
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

function updateUsers(root: HTMLElement, data: AdminUsersResponse): void {
  const users = data.users ?? [];
  const activeUsers = users.filter((user) => user.status === 'active').length;
  const totalEntities = users.reduce((sum, user) => sum + Number(user.entity_count || 0), 0);
  const totalAudit = users.reduce((sum, user) => sum + Number(user.audit_event_count || 0), 0);
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(users.length), 'пользователей из API'),
      kpi(String(activeUsers), 'активных'),
      kpi(String(totalEntities), 'связей с сущностями'),
      kpi(String(totalAudit), 'событий аудита')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const registryCard = cards.find((card) => card.textContent?.includes('Безопасные карточки поддержки'));
  const list = registryCard?.querySelector<HTMLElement>('.bk-list');
  if (list) {
    list.innerHTML = users.length
      ? users.slice(0, 30).map((user) => {
          const title = user.display_name || user.handle || 'Пользователь без имени';
          const handle = user.handle ? `@${user.handle}` : 'handle не указан';
          const meta = `${handle} · создан ${formatDate(user.created_at)}`;
          const details = [
            `${Number(user.entity_count || 0)} сущностей`,
            `${Number(user.owned_entity_count || 0)} владеет`,
            `${Number(user.audit_event_count || 0)} записей аудита`
          ];
          const badges = [
            { label: statusLabel(user.status), tone: statusTone(user.status) },
            { label: user.verification?.source === 'not_connected_yet' ? 'верификация позже' : 'верификация' },
            { label: user.security?.source === 'not_connected_yet' ? '2FA позже' : '2FA' }
          ];
          return listRow(title, meta, details, badges);
        }).join('')
      : listRow('Пользователи не найдены', 'API вернул пустой список пользователей.', [], [{ label: 'пусто' }]);
  }

  const boundaryCard = cards.find((card) => card.textContent?.includes('Операционная граница'));
  const boundaryList = boundaryCard?.querySelector<HTMLElement>('.bk-list');
  if (boundaryList) {
    boundaryList.innerHTML = [
      listRow('Только безопасный просмотр', 'Платформенная консоль показывает профильные статусы, связи и аудит без изменения пользовательских данных.', ['без write-actions', 'без приватных данных'], [{ label: 'OK', tone: 'positive' }]),
      listRow('Критичные действия отдельно', 'Блокировки, сброс 2FA, смена ролей и доступ к чувствительным данным требуют отдельного серверного действия с причиной.', ['2FA', 'причина', 'аудит'], [{ label: 'РИСК', tone: 'warning' }]),
      listRow('Граница аккаунта', 'Настройки пользователя остаются в настройках аккаунта; /admin не становится личным кабинетом пользователя.', ['настройки аккаунта отдельно'], [{ label: 'INFO' }])
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
      kpi('API', 'только чтение')
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
            [{ label: entityStatusLabel(entity.status), tone: statusTone(entity.status) }, { label: 'API только чтение' }]
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
          [{ label: statusLabel(report.status), tone: statusTone(report.status) }, { label: priorityLabel(report.priority) }]
        )).join('')
      : listRow('Жалобы пока не подключены', 'Контракт API готов, но источник жалоб ещё не подключён к базе.', ['источник не подключён'], [{ label: '0 открытых' }]);
  }
  updateHeaderBadge(root, 'данные из API', 'positive');
}

function updateModeration(root: HTMLElement, data: AdminModerationResponse): void {
  const items = data.moderation_items ?? [];
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.content ?? 0), 'контент'),
      kpi(String(summary.messages ?? 0), 'сообщения'),
      kpi(String(summary.profiles ?? 0), 'профили'),
      kpi(String(summary.visibility ?? 0), 'видимость')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const moderationCard = cards.find((card) => card.textContent?.includes('Очереди и допустимые решения'));
  const list = moderationCard?.querySelector<HTMLElement>('.bk-list');
  if (list) {
    list.innerHTML = items.length
      ? items.slice(0, 20).map((item) => listRow(
          item.title || item.id || 'Объект модерации без названия',
          `${queueLabel(item.queue)} · ${item.subject || 'объект не указан'} · ${formatDate(item.created_at)}`,
          ['только чтение', 'без решений модерации'],
          [{ label: statusLabel(item.status), tone: statusTone(item.status) }, { label: priorityLabel(item.priority) }]
        )).join('')
      : listRow('Очередь модерации пока не подключена', 'Контракт API готов, но источник moderation_items ещё не подключён к базе.', ['источник не подключён'], [{ label: '0 объектов' }]);
  }

  const matrixCard = cards.find((card) => card.textContent?.includes('Матрица решения'));
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    const decisions = data.decisions?.length ? data.decisions : ['hide', 'unpublish', 'restrict_messages', 'leave_unchanged', 'escalate'];
    matrixChips.innerHTML = decisions.map((item) => badge(decisionLabel(item))).join('');
  }

  updateHeaderBadge(root, 'данные из API', 'positive');
}

function updateTrust(root: HTMLElement, data: AdminTrustResponse): void {
  const signals = data.trust_signals ?? [];
  const summary = data.summary ?? {};
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (grid) {
    grid.innerHTML = [
      kpi(String(summary.link_risk ?? 0), 'риск ссылок'),
      kpi(String(summary.spam ?? 0), 'спам'),
      kpi(String(summary.rating_dispute ?? 0), 'споры рейтинга'),
      kpi(String(summary.suspicious_login ?? 0), 'подозрительные входы')
    ].join('');
  }

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const signalCard = cards.find((card) => card.textContent?.includes('Сигналы риска'));
  const signalList = signalCard?.querySelector<HTMLElement>('.bk-list');
  if (signalList) {
    signalList.innerHTML = signals.length
      ? signals.slice(0, 20).map((signal) => listRow(
          signal.title || signal.id || 'Сигнал доверия без названия',
          `${trustSignalLabel(signal.type)} · ${signal.subject || 'объект не указан'} · ${formatDate(signal.created_at)}`,
          ['только чтение', 'без санкций'],
          [{ label: statusLabel(signal.status), tone: statusTone(signal.status) }, { label: priorityLabel(signal.priority) }]
        )).join('')
      : listRow('Сигналы доверия пока не подключены', 'Контракт API готов, но источник trust_signals ещё не подключён к базе.', ['источник не подключён'], [{ label: '0 сигналов' }]);
  }

  const policyCard = cards.find((card) => card.textContent?.includes('Правила, лимиты и ручные проверки'));
  const policyList = policyCard?.querySelector<HTMLElement>('.bk-list');
  if (policyList) {
    const policies = data.policies?.length ? data.policies : ['external_links', 'new_account_limits', 'high_risk_actions'];
    policyList.innerHTML = policies.map((policy) => listRow(
      trustPolicyLabel(policy),
      'Политика отображается только как read-only настройка будущего safety-контура.',
      ['без автоматических санкций', 'без изменения рейтингов'],
      [{ label: 'только чтение' }]
    )).join('');
  }

  const matrixCard = cards.find((card) => card.textContent?.includes('Что можно будет делать из /admin/trust'));
  const matrixChips = matrixCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (matrixChips) {
    matrixChips.innerHTML = ['Проверить ссылки', 'Открыть риск-профиль', 'Ограничить сообщения', 'Запросить 2FA', 'Открыть спор рейтинга', 'Эскалация владельцу'].map((item) => badge(item)).join('');
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
      kpi('API', 'только чтение'),
      kpi('Защищено', 'без изменений')
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
          const details = [event.entity_id ? `сущность ${event.entity_id}` : 'без сущности', 'только чтение'];
          return listRow(actionLabel(event.action), meta, details, [{ label: actionBadgeLabel(event.action) }, { label: 'аудит', tone: 'warning' }]);
        }).join('')
      : listRow('Событий аудита пока нет', 'API вернул пустой список событий аудита.', ['только чтение'], [{ label: 'пусто' }]);
  }

  const filterCard = cards.find((card) => card.textContent?.includes('Фильтры аудита'));
  const filterChips = filterCard?.querySelector<HTMLElement>('.bk-chip-row');
  if (filterChips) {
    filterChips.innerHTML = ['Оператор', 'Объект', 'Тип действия', 'Период', 'Роль', 'Риск-действия', 'Платежи', 'Модерация'].map((item) => badge(item)).join('');
  }

  updateHeaderBadge(root, 'данные из API', 'positive');
}

function applyCachedData(root: HTMLElement): void {
  const path = window.location.pathname;
  if (path === '/admin' && overviewCache?.ok) updateOverview(root, overviewCache);
  if (path === '/admin/users' && usersCache?.ok) updateUsers(root, usersCache);
  if (path === '/admin/entities' && entitiesCache?.ok) updateEntities(root, entitiesCache);
  if (path === '/admin/reports' && reportsCache?.ok) updateReports(root, reportsCache);
  if (path === '/admin/moderation' && moderationCache?.ok) updateModeration(root, moderationCache);
  if (path === '/admin/trust' && trustCache?.ok) updateTrust(root, trustCache);
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

async function loadUsers(root: HTMLElement): Promise<void> {
  if (usersCache || usersLoading) return;
  usersLoading = true;
  try {
    usersCache = await fetchJson<AdminUsersResponse>(`${API_BASE}/users`);
    applyCachedData(root);
  } catch {
    usersCache = null;
  } finally {
    usersLoading = false;
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

async function loadModeration(root: HTMLElement): Promise<void> {
  if (moderationCache || moderationLoading) return;
  moderationLoading = true;
  try {
    moderationCache = await fetchJson<AdminModerationResponse>(`${API_BASE}/moderation`);
    applyCachedData(root);
  } catch {
    moderationCache = null;
  } finally {
    moderationLoading = false;
  }
}

async function loadTrust(root: HTMLElement): Promise<void> {
  if (trustCache || trustLoading) return;
  trustLoading = true;
  try {
    trustCache = await fetchJson<AdminTrustResponse>(`${API_BASE}/trust`);
    applyCachedData(root);
  } catch {
    trustCache = null;
  } finally {
    trustLoading = false;
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
    if (window.location.pathname === '/admin/users') void loadUsers(root);
    if (window.location.pathname === '/admin/entities') void loadEntities(root);
    if (window.location.pathname === '/admin/reports') void loadReports(root);
    if (window.location.pathname === '/admin/moderation') void loadModeration(root);
    if (window.location.pathname === '/admin/trust') void loadTrust(root);
    if (window.location.pathname === '/admin/audit') void loadAudit(root);
  });
}

export function initPlatformAdminReadOnlyDataBridge(root: HTMLElement): void {
  hydrate(root);
  window.addEventListener('popstate', () => hydrate(root));
  window.addEventListener('bandkit:platform-admin-route', () => hydrate(root));
}
