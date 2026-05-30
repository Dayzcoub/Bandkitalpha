const ROLES_ROUTE = '/admin/roles';

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

function rolesKpiCard(): string {
  return `<section class="bk-card" data-platform-admin-roles-kpis="true"><div class="bk-kpi-grid">${[
    kpi('4', 'группы staff-ролей'),
    kpi('2FA', 'обязательно для elevated'),
    kpi('Audit', 'смена роли логируется'),
    kpi('Scope', 'доступ ограничен'),
  ].join('')}</div></section>`;
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
  const main = root.querySelector<HTMLElement>('.bk-main-column');
  if (!main) return;
  const existingPatched = main.querySelector<HTMLElement>('[data-platform-admin-roles-kpis="true"]');
  if (existingPatched) {
    existingPatched.outerHTML = rolesKpiCard();
    return;
  }
  const grid = main.querySelector<HTMLElement>('.bk-kpi-grid');
  const card = grid?.closest<HTMLElement>('.bk-card');
  if (!card) return;
  card.outerHTML = rolesKpiCard();
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

function patchActiveNavigation(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.bk-nav-item').forEach((item) => {
    const active = item.getAttribute('href') === ROLES_ROUTE;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

function patchRightRail(root: HTMLElement): void {
  const rail = root.querySelector<HTMLElement>('.bk-right-rail');
  const modeTitle = rail?.querySelector<HTMLElement>('.bk-card strong');
  if (modeTitle) modeTitle.textContent = 'Роли и доступы';
}

function patchRolesPage(root: HTMLElement): void {
  if (window.location.pathname !== ROLES_ROUTE) return;
  patchHeader(root);
  patchKpis(root);
  patchBoundary(root);
  patchSafeActions(root);
  patchActiveNavigation(root);
  patchRightRail(root);
}

function schedule(root: HTMLElement): void {
  window.requestAnimationFrame(() => patchRolesPage(root));
  window.setTimeout(() => patchRolesPage(root), 50);
  window.setTimeout(() => patchRolesPage(root), 150);
}

export function initPlatformAdminRolesPageFix(root: HTMLElement): void {
  schedule(root);
  window.addEventListener('popstate', () => schedule(root));
  window.addEventListener('bandkit:platform-admin-route', () => schedule(root));
}
