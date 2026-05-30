const ROLES_ROUTE = '/admin/roles';
const MARKER = 'platform-admin-roles-page-fix';

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

function row(title: string, meta: string, tone: 'neutral' | 'positive' | 'warning' | 'danger'): string {
  const toneLabel = tone === 'positive' ? 'OK' : tone === 'warning' ? 'РИСК' : tone === 'danger' ? 'ВАЖНО' : 'INFO';
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">◇</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(title)}</div><div class="bk-meta">${escapeHtml(meta)}</div></div>${badge(toneLabel, tone)}</div>`;
}

function patchHeader(root: HTMLElement): void {
  const header = root.querySelector<HTMLElement>('.bk-main-column .bk-page-header');
  if (!header) return;
  const title = header.querySelector<HTMLElement>('.bk-title');
  const subtitle = header.querySelector<HTMLElement>('.bk-subtitle');
  if (title) title.textContent = 'Роли и доступы';
  if (subtitle) subtitle.textContent = 'Платформенная staff-матрица: owner, super-admin, администраторы, модераторы и специализированные операторы.';
}

function patchKpis(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>('.bk-main-column .bk-kpi-grid');
  if (!grid) return;
  grid.dataset[MARKER] = 'true';
  grid.innerHTML = [
    kpi('4', 'группы staff-ролей'),
    kpi('2FA', 'обязательно для elevated'),
    kpi('Audit', 'смена роли логируется'),
    kpi('Scope', 'доступ ограничен'),
  ].join('');
}

function patchBoundary(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const boundary = cards.find((card) => card.textContent?.includes('Операционная граница'));
  if (!boundary) return;
  const list = boundary.querySelector<HTMLElement>('.bk-list');
  if (!list) return;
  list.innerHTML = [
    row('Граница staff-доступа', 'Платформенные роли управляют только операциями платформы; роли внутри групп и студий остаются в админках сущностей.', 'positive'),
    row('Критичные изменения', 'Назначение owner/super-admin, снятие роли и ограничение staff-доступа требуют 2FA, причины и аудита.', 'warning'),
    row('Текущий режим', 'Матрица ролей сейчас является UI-заглушкой. Реальные изменения ролей не подключены.', 'neutral'),
  ].join('');
}

function patchSafeActions(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.bk-main-column .bk-card'));
  const safe = cards.find((card) => card.textContent?.includes('Безопасные действия'));
  const actions = safe?.querySelector<HTMLElement>('.bk-action-row');
  if (!actions) return;
  actions.innerHTML = ['Проверить матрицу', 'Открыть историю роли', 'Экспорт ролей'].map((label) => `<button class="bk-button bk-button-secondary" type="button">${escapeHtml(label)}</button>`).join('');
}

function patchRolesPage(root: HTMLElement): void {
  if (window.location.pathname !== ROLES_ROUTE) return;
  patchHeader(root);
  patchKpis(root);
  patchBoundary(root);
  patchSafeActions(root);
}

function schedule(root: HTMLElement): void {
  window.requestAnimationFrame(() => patchRolesPage(root));
}

export function initPlatformAdminRolesPageFix(root: HTMLElement): void {
  schedule(root);
  window.addEventListener('popstate', () => schedule(root));
  window.addEventListener('bandkit:platform-admin-route', () => schedule(root));
}
