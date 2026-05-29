type DetailTone = 'neutral' | 'positive' | 'warning' | 'danger';

type DetailRow = {
  title: string;
  meta: string;
  badges: Array<{ label: string; tone?: DetailTone }>;
  details: string[];
};

const ROUTES = ['/admin/billing', '/admin/content'];
const DETAIL_MARKER = 'platform-admin-commercial-content-details';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}

function badge(label: string, tone: DetailTone = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

function row(item: DetailRow): string {
  const badges = item.badges.map((entry) => badge(entry.label, entry.tone)).join('');
  const details = item.details.map((entry) => badge(entry)).join('');
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">◇</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(item.title)}</div><div class="bk-meta">${escapeHtml(item.meta)}</div><div class="bk-chip-row">${details}</div></div><div class="bk-chip-row">${badges}</div></div>`;
}

function billingRows(): DetailRow[] {
  return [
    {
      title: 'Free / базовый доступ',
      meta: 'Стартовый тариф для музыкантов, просмотра, профиля, базовой ленты и участия в сущностях.',
      badges: [{ label: 'активен', tone: 'positive' }, { label: '0 ₽', tone: 'neutral' }],
      details: ['профиль', 'лента', 'участие', 'ограничения'],
    },
    {
      title: 'Pro / расширенный профиль',
      meta: 'Платный пользовательский слой: расширенное портфолио, продвижение, документы и будущие premium-функции.',
      badges: [{ label: 'future', tone: 'warning' }, { label: 'аудит выдачи', tone: 'warning' }],
      details: ['портфолио', 'публикации', 'документы', 'промо'],
    },
    {
      title: 'Entity plan / группа или организация',
      meta: 'Тарифы для групп, студий, оркестров и организаций: роли, участники, события, документы и управление.',
      badges: [{ label: 'будущий модуль', tone: 'neutral' }, { label: 'owner-managed', tone: 'warning' }],
      details: ['участники', 'роли', 'события', 'админка сущности'],
    },
  ];
}

function billingOpsRows(): DetailRow[] {
  return [
    {
      title: 'Ручная выдача доступа',
      meta: 'Любая ручная выдача тарифа или продление доступа требует причины, роли оператора и события аудита.',
      badges: [{ label: '2FA', tone: 'warning' }, { label: 'причина обязательна', tone: 'danger' }],
      details: ['actor', 'reason code', 'old/new value'],
    },
    {
      title: 'Возвраты и спорные платежи',
      meta: 'Возврат нельзя делать из UI-заглушки. Нужен отдельный backend action и журнал изменений.',
      badges: [{ label: 'нет реального списания', tone: 'positive' }, { label: 'audit', tone: 'warning' }],
      details: ['invoice', 'payment provider', 'refund trail'],
    },
    {
      title: 'Промокоды и trial-доступ',
      meta: 'Будущие коммерческие инструменты с лимитами, сроками действия и защитой от повторного использования.',
      badges: [{ label: 'future', tone: 'neutral' }],
      details: ['promo', 'trial', 'лимиты'],
    },
  ];
}

function contentRows(): DetailRow[] {
  return [
    {
      title: 'Лента и публикации',
      meta: 'Посты, репосты, комментарии и публичные материалы, которые могут попасть в модерацию или подборки.',
      badges: [{ label: 'очередь', tone: 'warning' }],
      details: ['посты', 'комментарии', 'репосты', 'скрытие'],
    },
    {
      title: 'Медиа и вложения',
      meta: 'Аватары, баннеры, фото, видео и документы. Проверка MIME/размера/безопасности остаётся backend-задачей.',
      badges: [{ label: 'сканирование позже', tone: 'warning' }],
      details: ['аватары', 'баннеры', 'фото', 'документы'],
    },
    {
      title: 'Рекомендованные подборки',
      meta: 'Будущие curated-поверхности платформы: featured bands, события, студии, исполнители и материалы.',
      badges: [{ label: 'curated', tone: 'positive' }],
      details: ['featured', 'категории', 'города', 'жанры'],
    },
  ];
}

function contentPolicyRows(): DetailRow[] {
  return [
    {
      title: 'Категории и словари',
      meta: 'Жанры, роли, типы организаций и категории контента должны быть локализуемыми и управляться централизованно.',
      badges: [{ label: 'локализация', tone: 'positive' }],
      details: ['жанры', 'роли', 'типы', 'ключи переводов'],
    },
    {
      title: 'Скрытие и снятие с публикации',
      meta: 'Контентные операции выполняются как платформенные действия, а не как редактирование от имени пользователя.',
      badges: [{ label: 'с аудитом', tone: 'warning' }],
      details: ['hide', 'unpublish', 'review', 'appeal'],
    },
    {
      title: 'Промо-поверхности',
      meta: 'Вывод в подборки, витрины и промо-блоки требует прозрачной причины и истории изменений.',
      badges: [{ label: 'reason required', tone: 'warning' }],
      details: ['витрина', 'главная', 'подборки'],
    },
  ];
}

function billingDetails(): string {
  return `<section class="bk-card" data-${DETAIL_MARKER}="billing-plans"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Тарифы и доступ</div><h3 class="bk-card-title">Коммерческий контур платформы</h3></div>${badge('read-only mock', 'positive')}</div><p class="bk-state-copy">Экран фиксирует будущую структуру тарифов, подписок и ручных выдач доступа. Реальные платежи, возвраты и entitlement-изменения пока не подключаются.</p><div class="bk-list">${billingRows().map(row).join('')}</div></section><section class="bk-card" data-${DETAIL_MARKER}="billing-ops"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Операции биллинга</div><h3 class="bk-card-title">Только через аудит и причину</h3></div>${badge('без списаний', 'positive')}</div><div class="bk-list">${billingOpsRows().map(row).join('')}</div></section><section class="bk-card" data-${DETAIL_MARKER}="billing-actions"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Матрица действий</div><h3 class="bk-card-title">Что будет доступно владельцу</h3></div>${badge('super-admin', 'warning')}</div><div class="bk-chip-row">${['Создать тариф', 'Выдать доступ', 'Отозвать доступ', 'Проверить платёж', 'Оформить возврат', 'Создать промокод', 'Открыть аудит'].map((item) => badge(item)).join('')}</div></section>`;
}

function contentDetails(): string {
  return `<section class="bk-card" data-${DETAIL_MARKER}="content-surfaces"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Контентные операции</div><h3 class="bk-card-title">Лента, медиа и подборки</h3></div>${badge('read-only mock', 'positive')}</div><p class="bk-state-copy">Экран описывает будущий операционный слой контента: публикации, медиа, категории, витрины и featured-поверхности. Это не редактор пользовательского профиля.</p><div class="bk-list">${contentRows().map(row).join('')}</div></section><section class="bk-card" data-${DETAIL_MARKER}="content-policies"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Контентная политика</div><h3 class="bk-card-title">Правила и управляемые словари</h3></div>${badge('с аудитом', 'warning')}</div><div class="bk-list">${contentPolicyRows().map(row).join('')}</div></section><section class="bk-card" data-${DETAIL_MARKER}="content-actions"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Матрица действий</div><h3 class="bk-card-title">Что можно делать из /admin/content</h3></div>${badge('без прямого редактирования', 'positive')}</div><div class="bk-chip-row">${['Скрыть пост', 'Снять комментарий', 'Проверить медиа', 'Добавить в подборку', 'Убрать из подборки', 'Изменить категорию', 'Открыть аудит'].map((item) => badge(item)).join('')}</div></section>`;
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
  const html = window.location.pathname === '/admin/billing' ? billingDetails() : contentDetails();
  kpiCard.insertAdjacentHTML('afterend', html);
}

function scheduleDetails(root: HTMLElement): void {
  window.requestAnimationFrame(() => injectDetails(root));
}

export function initPlatformAdminCommercialContentDetails(root: HTMLElement): void {
  scheduleDetails(root);
  window.addEventListener('popstate', () => scheduleDetails(root));
  window.addEventListener('bandkit:platform-admin-route', () => scheduleDetails(root));
}
