type ServiceTone = 'neutral' | 'positive' | 'warning' | 'danger';

type ServiceRow = {
  title: string;
  meta: string;
  badges: Array<{ label: string; tone?: ServiceTone }>;
  details: string[];
};

const ROUTES = ['/admin/roles', '/admin/localization', '/admin/notifications', '/admin/audit', '/admin/settings'];
const DETAIL_MARKER = 'platform-admin-service-details';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}

function badge(label: string, tone: ServiceTone = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

function row(item: ServiceRow): string {
  const badges = item.badges.map((entry) => badge(entry.label, entry.tone)).join('');
  const details = item.details.map((entry) => badge(entry)).join('');
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">◇</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(item.title)}</div><div class="bk-meta">${escapeHtml(item.meta)}</div><div class="bk-chip-row">${details}</div></div><div class="bk-chip-row">${badges}</div></div>`;
}

function card(title: string, subtitle: string, badgeLabel: string, badgeTone: ServiceTone, rows: ServiceRow[]): string {
  return `<section class="bk-card" data-${DETAIL_MARKER}="${escapeHtml(title)}"><div class="bk-card-section-head"><div><div class="bk-eyebrow">${escapeHtml(title)}</div><h3 class="bk-card-title">${escapeHtml(subtitle)}</h3></div>${badge(badgeLabel, badgeTone)}</div><div class="bk-list">${rows.map(row).join('')}</div></section>`;
}

function chips(title: string, subtitle: string, badgeLabel: string, items: string[]): string {
  return `<section class="bk-card" data-${DETAIL_MARKER}="${escapeHtml(title)}"><div class="bk-card-section-head"><div><div class="bk-eyebrow">${escapeHtml(title)}</div><h3 class="bk-card-title">${escapeHtml(subtitle)}</h3></div>${badge(badgeLabel, 'warning')}</div><div class="bk-chip-row">${items.map((item) => badge(item)).join('')}</div></section>`;
}

function rolesDetails(): string {
  return `${card('Роли и доступы', 'Платформенная staff-матрица', 'read-only mock', 'positive', [
    { title: 'owner / super_admin', meta: 'Полный доступ к платформенной консоли, критичным настройкам, ролям и биллингу.', badges: [{ label: '2FA обязательно', tone: 'danger' }], details: ['settings', 'billing', 'roles', 'audit'] },
    { title: 'platform_admin', meta: 'Операционное управление пользователями, сущностями, модерацией и контентом без owner-only настроек.', badges: [{ label: 'staff', tone: 'warning' }], details: ['users', 'entities', 'content', 'trust'] },
    { title: 'moderator / trust_agent', meta: 'Работа с жалобами, контентом, рисками и ограниченными кейсами сообщений по жалобе.', badges: [{ label: 'case-limited', tone: 'positive' }], details: ['reports', 'moderation', 'trust', 'notes'] },
    { title: 'billing_manager / localization_manager', meta: 'Специализированные роли для коммерческого и языкового контуров.', badges: [{ label: 'scoped', tone: 'neutral' }], details: ['billing', 'localization', 'export', 'audit'] },
  ])}${chips('Матрица действий', 'Роли нельзя менять без причины и аудита', 'аудит обязателен', ['Назначить роль', 'Снять роль', 'Запросить 2FA', 'Ограничить staff-доступ', 'Открыть историю роли', 'Экспорт матрицы'])}`;
}

function localizationDetails(): string {
  return `${card('Локализация', 'Языковые пакеты и ключи переводов', 'read-only mock', 'positive', [
    { title: 'RU / базовый язык интерфейса', meta: 'Основная рабочая локаль для текущего продукта и операционной консоли.', badges: [{ label: 'активна', tone: 'positive' }], details: ['nav', 'admin', 'common', 'auth'] },
    { title: 'EN / fallback locale', meta: 'Резервная локаль и будущий внешний рынок. Нужна синхронизация missing keys.', badges: [{ label: 'fallback', tone: 'warning' }], details: ['missing keys', 'fallback', 'export'] },
    { title: 'Языковые пакеты будущего', meta: 'Добавление новых языков через namespace-пакеты без текста внутри картинок и ассетов.', badges: [{ label: 'future', tone: 'neutral' }], details: ['packages', 'import', 'review'] },
  ])}${chips('Операции локализации', 'Что будет доступно менеджеру переводов', 'без DB-write', ['Проверить missing keys', 'Экспорт JSON', 'Импорт пакета', 'Сравнить RU/EN', 'Проверить namespace', 'Открыть аудит переводов'])}`;
}

function notificationsDetails(): string {
  return `${card('Уведомления и рассылки', 'Шаблоны, сегменты и каналы', 'read-only mock', 'positive', [
    { title: 'In-app уведомления', meta: 'Системные уведомления внутри платформы: роли, события, жалобы, приглашения и статусы.', badges: [{ label: 'shell ready', tone: 'positive' }], details: ['центр уведомлений', 'шаблоны', 'роли'] },
    { title: 'Email / SMS', meta: 'Критичные каналы для подтверждений, безопасности и важных операционных сообщений.', badges: [{ label: 'provider later', tone: 'warning' }], details: ['email', 'sms', 'verification'] },
    { title: 'Push / emergency notices', meta: 'PWA push и экстренные объявления требуют отдельной политики подтверждения и аудита.', badges: [{ label: 'owner confirm', tone: 'danger' }], details: ['push', 'emergency', 'segments'] },
  ])}${chips('Матрица отправки', 'Массовая рассылка не должна уходить без предпросмотра', 'аудит обязателен', ['Создать черновик', 'Предпросмотр', 'Выбрать сегмент', 'Тестовая отправка', 'Запланировать', 'Остановить кампанию'])}`;
}

function auditDetails(): string {
  return `${card('Аудит действий', 'Неизменяемый журнал платформы', 'read-only mock', 'positive', [
    { title: 'Смена роли staff', meta: 'Фиксируются actor, target, старая роль, новая роль, причина и подтверждение 2FA.', badges: [{ label: 'critical', tone: 'danger' }], details: ['actor', 'target', 'old/new', 'reason'] },
    { title: 'Модерационное решение', meta: 'Скрытие, снятие с публикации, ограничение сообщений и эскалации пишутся в audit trail.', badges: [{ label: 'required', tone: 'warning' }], details: ['case id', 'decision', 'note'] },
    { title: 'Доступ к данным', meta: 'Просмотр complaint-gated сообщений, карточек риска и платежных данных должен иметь след.', badges: [{ label: 'data access', tone: 'warning' }], details: ['scope', 'time', 'operator'] },
  ])}${chips('Фильтры аудита', 'Быстрые срезы для расследований', 'только чтение', ['Actor', 'Target', 'Тип действия', 'Период', 'Роль', 'Risk actions', 'Billing', 'Moderation'])}`;
}

function settingsDetails(): string {
  return `${card('Настройки платформы', 'Глобальные политики и feature gates', 'read-only mock', 'positive', [
    { title: 'Регистрация и подтверждения', meta: 'OAuth, email, телефон, SMS-коды и обязательность проверок управляются на уровне платформы.', badges: [{ label: 'global', tone: 'warning' }], details: ['Google', 'Apple', 'email', 'phone'] },
    { title: 'Security policy', meta: '2FA для staff, лимиты входа, recovery-процедуры и защита elevated-доступа.', badges: [{ label: '2FA', tone: 'danger' }], details: ['staff', 'recovery', 'sessions'] },
    { title: 'Feature flags', meta: 'Постепенное включение модулей: feed, marketplace, chat, billing, push и moderation tools.', badges: [{ label: 'rollout', tone: 'neutral' }], details: ['flags', 'segments', 'rollback'] },
  ])}${chips('Критичные настройки', 'Изменения требуют подтверждения и аудита', 'super-admin', ['Включить регистрацию', 'Обязать телефон', 'Обязать 2FA', 'SMS provider', 'Email provider', 'Feature gates', 'Maintenance mode'])}`;
}

function detailsForRoute(pathname: string): string {
  if (pathname === '/admin/roles') return rolesDetails();
  if (pathname === '/admin/localization') return localizationDetails();
  if (pathname === '/admin/notifications') return notificationsDetails();
  if (pathname === '/admin/audit') return auditDetails();
  if (pathname === '/admin/settings') return settingsDetails();
  return '';
}

function removeDetails(root: HTMLElement): void {
  root.querySelectorAll(`[data-${DETAIL_MARKER}]`).forEach((item) => item.remove());
}

function injectDetails(root: HTMLElement): void {
  removeDetails(root);
  if (!ROUTES.includes(window.location.pathname)) return;
  const main = root.querySelector<HTMLElement>('.bk-main-column');
  const kpiCard = main?.querySelector<HTMLElement>('.bk-kpi-grid')?.closest<HTMLElement>('.bk-card');
  if (!main || !kpiCard) return;
  const html = detailsForRoute(window.location.pathname);
  if (!html) return;
  kpiCard.insertAdjacentHTML('afterend', html);
}

function scheduleDetails(root: HTMLElement): void {
  window.requestAnimationFrame(() => injectDetails(root));
}

export function initPlatformAdminServiceDetails(root: HTMLElement): void {
  scheduleDetails(root);
  window.addEventListener('popstate', () => scheduleDetails(root));
  window.addEventListener('bandkit:platform-admin-route', () => scheduleDetails(root));
}
