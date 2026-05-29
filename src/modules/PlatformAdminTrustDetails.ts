type TrustTone = 'neutral' | 'positive' | 'warning' | 'danger';

type TrustRow = {
  title: string;
  meta: string;
  badges: Array<{ label: string; tone?: TrustTone }>;
  details: string[];
};

const TRUST_ROUTE = '/admin/trust';
const DETAIL_MARKER = 'platform-admin-trust-details';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}

function badge(label: string, tone: TrustTone = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

function renderTrustRow(row: TrustRow): string {
  const badges = row.badges.map((item) => badge(item.label, item.tone)).join('');
  const details = row.details.map((item) => badge(item)).join('');
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">◇</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(row.title)}</div><div class="bk-meta">${escapeHtml(row.meta)}</div><div class="bk-chip-row">${details}</div></div><div class="bk-chip-row">${badges}</div></div>`;
}

function trustSignalRows(): TrustRow[] {
  return [
    {
      title: 'Внешние ссылки и социнженерия',
      meta: 'Контроль попыток увести пользователя во внешние оплаты, фейковые сайты и подозрительные контакты.',
      badges: [{ label: 'высокий риск', tone: 'danger' }, { label: 'ручная проверка', tone: 'warning' }],
      details: ['blocked domains', 'разрешённые домены', 'текстовые триггеры'],
    },
    {
      title: 'Спам-паттерны и массовые сообщения',
      meta: 'Повторяющиеся тексты, частые приглашения, одинаковые сообщения и подозрительная частота отправки.',
      badges: [{ label: 'лимиты', tone: 'warning' }, { label: 'anti-spam', tone: 'neutral' }],
      details: ['частота сообщений', 'одинаковый текст', 'новые аккаунты'],
    },
    {
      title: 'Подозрительные входы',
      meta: 'Новые устройства, частая смена IP, необычные регионы и попытки входа в staff-аккаунты.',
      badges: [{ label: '2FA', tone: 'positive' }, { label: 'нужен backend', tone: 'warning' }],
      details: ['устройства', 'IP-риск', 'история входов'],
    },
    {
      title: 'Рейтинг, отзывы и отмены',
      meta: 'Защита от накруток, спорных отзывов, массовых жалоб и необоснованных снижений рейтинга.',
      badges: [{ label: 'dispute trail', tone: 'neutral' }, { label: 'аудит', tone: 'warning' }],
      details: ['неявки', 'отмены', 'апелляции'],
    },
  ];
}

function policyRows(): TrustRow[] {
  return [
    {
      title: 'Политика ссылок',
      meta: 'Запрет опасных внешних ссылок, allowlist безопасных доменов и отдельная очередь проверки спорных ссылок.',
      badges: [{ label: 'MVP block', tone: 'warning' }],
      details: ['allowlist', 'denylist', 'moderation queue'],
    },
    {
      title: 'Лимиты новых аккаунтов',
      meta: 'Ограничения на сообщения, приглашения и публикации до подтверждения email, телефона и первичной репутации.',
      badges: [{ label: 'rate limits', tone: 'neutral' }],
      details: ['email', 'телефон', 'порог доверия'],
    },
    {
      title: 'Действия высокого риска',
      meta: 'Блокировки, ограничения сообщений, ручное изменение рейтинга и staff-доступ требуют причины и аудита.',
      badges: [{ label: 'причина обязательна', tone: 'danger' }],
      details: ['2FA staff', 'reason code', 'audit event'],
    },
  ];
}

function renderTrustDetails(): string {
  return `<section class="bk-card" data-${DETAIL_MARKER}="signals"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Доверие и безопасность</div><h3 class="bk-card-title">Сигналы риска</h3></div>${badge('read-only mock', 'positive')}</div><p class="bk-state-copy">Этот экран собирает будущие risk-сигналы платформы: ссылки, спам, подозрительные входы, спорные рейтинги и жалобы. Реальные автоматические ограничения пока не подключаются.</p><div class="bk-list">${trustSignalRows().map(renderTrustRow).join('')}</div></section><section class="bk-card" data-${DETAIL_MARKER}="policies"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Политики безопасности</div><h3 class="bk-card-title">Правила, лимиты и ручные проверки</h3></div>${badge('без enforcement', 'warning')}</div><div class="bk-list">${policyRows().map(renderTrustRow).join('')}</div></section><section class="bk-card" data-${DETAIL_MARKER}="matrix"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Матрица действий</div><h3 class="bk-card-title">Что можно будет делать из /admin/trust</h3></div>${badge('только с аудитом', 'warning')}</div><div class="bk-chip-row">${['Проверить домен', 'Поставить risk-флаг', 'Ограничить сообщения', 'Запросить 2FA', 'Отправить на модерацию', 'Открыть спор рейтинга', 'Эскалация владельцу'].map((item) => badge(item)).join('')}</div></section>`;
}

function removeTrustDetails(root: HTMLElement): void {
  root.querySelectorAll(`[data-${DETAIL_MARKER}]`).forEach((item) => item.remove());
}

function injectTrustDetails(root: HTMLElement): void {
  removeTrustDetails(root);
  if (window.location.pathname !== TRUST_ROUTE) return;
  const main = root.querySelector<HTMLElement>('.bk-main-column');
  const kpiCard = main?.querySelector<HTMLElement>('.bk-kpi-grid')?.closest<HTMLElement>('.bk-card');
  if (!main || !kpiCard) return;
  kpiCard.insertAdjacentHTML('afterend', renderTrustDetails());
}

function scheduleTrustDetails(root: HTMLElement): void {
  window.requestAnimationFrame(() => injectTrustDetails(root));
}

export function initPlatformAdminTrustDetails(root: HTMLElement): void {
  scheduleTrustDetails(root);
  window.addEventListener('popstate', () => scheduleTrustDetails(root));
  window.addEventListener('bandkit:platform-admin-route', () => scheduleTrustDetails(root));
}
