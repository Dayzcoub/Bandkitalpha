type AdminTone = 'neutral' | 'positive' | 'warning' | 'danger';
type AdminAccess = 'moderator' | 'admin' | 'super_admin';

type AdminKpi = { value: string; label: string; };
type AdminRow = { title: string; meta: string; tone: AdminTone; };
type AdminSection = {
  path: string;
  access: AdminAccess;
  label: string;
  title: string;
  subtitle: string;
  kpis: AdminKpi[];
  rows: AdminRow[];
  actions: string[];
};

type AdminTableRow = {
  title: string;
  meta: string;
  badges: Array<{ label: string; tone?: AdminTone }>;
  details: string[];
};

const ADMIN_ROOT = '/admin';
const roleRank: Record<string, number> = { guest: 0, user: 1, moderator: 2, admin: 3, super_admin: 4 };

const sections: AdminSection[] = [
  {
    path: '/admin',
    access: 'admin',
    label: 'Обзор',
    title: 'Платформенная консоль',
    subtitle: 'Операционная консоль владельца уровня платформы. Это не админка группы, студии, организации или события.',
    kpis: [
      { value: '42', label: 'пользователя на проверке' },
      { value: '2', label: 'открытые жалобы' },
      { value: '7', label: 'очередей платформы' },
      { value: '0', label: 'критичных инцидентов' },
    ],
    rows: [
      { title: 'Граница платформы', meta: '/admin управляет только операциями платформы; настройки сущностей остаются в админках сущностей.', tone: 'positive' },
      { title: 'Критичные действия', meta: 'Блокировки, возвраты, смена ролей и impersonation должны аудироваться до реального backend-подключения.', tone: 'warning' },
      { title: 'Текущий режим', meta: 'Mock-консоль. Реальные backend-действия намеренно не подключены.', tone: 'neutral' },
    ],
    actions: ['Открыть очередь жалоб', 'Проверить сигналы доверия', 'Проверить аудит'],
  },
  {
    path: '/admin/users', access: 'admin', label: 'Пользователи', title: 'Реестр пользователей',
    subtitle: 'Платформенный поиск пользователей, статусы верификации, риск-флаги и безопасные операции поддержки.',
    kpis: [
      { value: '3', label: 'demo-профиля' },
      { value: '2FA', label: 'обязательно для команды' },
      { value: '1', label: 'пример ограничения' },
      { value: 'Аудит', label: 'обязателен' },
    ],
    rows: [
      { title: 'Alex Rhythm', meta: 'Верифицированный пользователь · репутация 92 · без активных ограничений', tone: 'positive' },
      { title: 'Mira Voice', meta: 'Премиум-профиль · доверенный контакт · email и телефон готовы', tone: 'positive' },
      { title: 'Подозрительный контакт', meta: 'Предупреждение по ссылкам · доступен контекст жалобы', tone: 'warning' },
    ],
    actions: ['Открыть карточку', 'Добавить заметку поддержки', 'Запросить верификацию'],
  },
  {
    path: '/admin/entities', access: 'admin', label: 'Сущности', title: 'Реестр сущностей',
    subtitle: 'Реестр групп, студий, организаций, площадок и событий без смешивания с их собственными админками.',
    kpis: [
      { value: '3', label: 'группы/проекты' },
      { value: '3', label: 'события' },
      { value: 'Future', label: 'студии/организации' },
      { value: 'Safe', label: 'только чтение сначала' },
    ],
    rows: [
      { title: 'Northern Lights Band', meta: 'Сущность группы/проекта · админка владельца вне /admin', tone: 'positive' },
      { title: 'City Orchestra Lab', meta: 'Оркестр · участники и внутренние настройки относятся к админке сущности', tone: 'neutral' },
      { title: 'Studio Night Crew', meta: 'Сессионная команда · платформа может заморозить или проверить, но не редактировать внутренние настройки случайно', tone: 'warning' },
    ],
    actions: ['Открыть сущность', 'Поставить флаг проверки', 'Открыть аудит'],
  },
  {
    path: '/admin/reports', access: 'moderator', label: 'Жалобы', title: 'Очередь жалоб',
    subtitle: 'Единая очередь жалоб, апелляций и эскалаций до подключения реальных процессов модерации.',
    kpis: [
      { value: '2', label: 'открытые жалобы' },
      { value: '1', label: 'высокий приоритет' },
      { value: '0', label: 'нарушений SLA' },
      { value: 'Апелляции', label: 'заложены на будущее' },
    ],
    rows: [
      { title: 'Жалоба на мошенничество', meta: 'Подозрительный пост · риск оплаты вне платформы и социальной инженерии', tone: 'danger' },
      { title: 'Жалоба на спам', meta: 'Подозрительный чат · повторяющийся паттерн рассылки', tone: 'warning' },
      { title: 'Линия апелляций', meta: 'Зарезервировано для апелляций после применённого действия', tone: 'neutral' },
    ],
    actions: ['Назначить кейс', 'Эскалация в безопасность', 'Отклонить'],
  },
  {
    path: '/admin/moderation', access: 'moderator', label: 'Модерация', title: 'Операции модерации',
    subtitle: 'Платформенная модерация контента, профилей, сообщений по жалобам и видимости сущностей.',
    kpis: [
      { value: 'Контент', label: 'посты/комментарии' },
      { value: 'Сообщения', label: 'только по жалобе' },
      { value: 'Профили', label: 'проверка риска' },
      { value: 'Аудит', label: 'неизменяемый' },
    ],
    rows: [
      { title: 'Проверка контента', meta: 'Скрытие и удаление проходят через действия модерации, а не через прямое редактирование текста пользователя.', tone: 'warning' },
      { title: 'Сообщения по жалобам', meta: 'Модераторы не получают общий доступ ко всем приватным чатам.', tone: 'positive' },
      { title: 'Видимость сущностей', meta: 'Заморозка, снятие с публикации или проверка; админы сущностей держат свои настройки отдельно.', tone: 'neutral' },
    ],
    actions: ['Открыть очередь', 'Проверить флаг контента', 'Заметка модератора'],
  },
  {
    path: '/admin/trust', access: 'admin', label: 'Доверие и безопасность', title: 'Доверие и безопасность',
    subtitle: 'Риск-сигналы, заблокированные ссылки, подозрительные паттерны, накрутки рейтинга и антифрод.',
    kpis: [
      { value: 'Ссылки', label: 'блокируются в MVP' },
      { value: 'Риск', label: 'ручная проверка' },
      { value: 'Рейтинг', label: 'защита от накруток' },
      { value: '2FA', label: 'обязательно для команды' },
    ],
    rows: [
      { title: 'Внешние ссылки', meta: 'MVP блокирует небезопасное поведение с внешними ссылками в чатах и постах.', tone: 'warning' },
      { title: 'Подозрительные входы', meta: 'Риски устройства и IP относятся к backend-политике до включения enforcement.', tone: 'neutral' },
      { title: 'Споры по рейтингу', meta: 'Неявки, отмены и отзывы требуют истории спора до изменения оценки.', tone: 'positive' },
    ],
    actions: ['Проверить ссылки', 'Открыть риск-профиль', 'Настроить черновик политики'],
  },
  {
    path: '/admin/billing', access: 'super_admin', label: 'Платежи', title: 'Тарифы и платежи',
    subtitle: 'Тарифы, подписки, возвраты и ручная выдача доступа отдельно от настроек сущностей и профиля.',
    kpis: [
      { value: 'Тарифы', label: 'будущий модуль' },
      { value: 'Счета', label: 'будущий модуль' },
      { value: 'Возвраты', label: 'аудируются' },
      { value: 'Доступ', label: 'ручная выдача' },
    ],
    rows: [
      { title: 'Каталог тарифов', meta: 'Централизованные тарифы и права доступа управляются владельцем платформы.', tone: 'neutral' },
      { title: 'Ручная выдача доступа', meta: 'Любое ручное изменение доступа должно создавать событие аудита.', tone: 'warning' },
      { title: 'Возвраты', meta: 'Интеграция платёжного провайдера только после готовности policy-slice.', tone: 'neutral' },
    ],
    actions: ['Проверить тарифы', 'Открыть подписки', 'Аудит возврата'],
  },
  {
    path: '/admin/content', access: 'admin', label: 'Контент', title: 'Контентные операции',
    subtitle: 'Лента, комментарии, медиа, категории и рекомендованные поверхности на уровне платформы.',
    kpis: [
      { value: 'Лента', label: 'модерируется' },
      { value: 'Медиа', label: 'проверка позже' },
      { value: 'Подборки', label: 'курируются' },
      { value: 'Категории', label: 'контролируемо' },
    ],
    rows: [
      { title: 'Операции ленты', meta: 'Платформа может рекомендовать, скрывать или отправлять посты на проверку.', tone: 'neutral' },
      { title: 'Статус медиа', meta: 'Проверка MIME и вирус-сканирование остаются future-ready задачами backend.', tone: 'warning' },
      { title: 'Категории', meta: 'Локализуемые названия без текста внутри ассетов.', tone: 'positive' },
    ],
    actions: ['Открыть флаги', 'Управлять подборками', 'Проверить медиа'],
  },
  {
    path: '/admin/localization', access: 'admin', label: 'Локализация', title: 'Консоль локализации',
    subtitle: 'Языковые пакеты, ключи переводов, отсутствующие строки и будущие import/export-потоки.',
    kpis: [
      { value: 'RU/EN', label: 'активны' },
      { value: 'JSON', label: 'текущий MVP' },
      { value: 'DB', label: 'заложено на будущее' },
      { value: 'Fallback', label: 'английский' },
    ],
    rows: [
      { title: 'Языковые пакеты', meta: 'Строки остаются в i18n JSON, а не хардкодятся в компонентах.', tone: 'positive' },
      { title: 'Отсутствующие ключи', meta: 'Admin tooling позже покажет непереведённые ключи по namespace.', tone: 'neutral' },
      { title: 'Политика ассетов', meta: 'Production assets остаются нейтральными к языку.', tone: 'positive' },
    ],
    actions: ['Проверить ключи', 'Экспорт пакета', 'Проверить пропуски'],
  },
  {
    path: '/admin/notifications', access: 'admin', label: 'Уведомления', title: 'Уведомления и рассылки',
    subtitle: 'Платформенные объявления, шаблоны, push/email/SMS политики и экстренные уведомления.',
    kpis: [
      { value: 'In-app', label: 'shell готов' },
      { value: 'Push', label: 'будущий модуль' },
      { value: 'Email', label: 'шаблоны' },
      { value: 'SMS', label: 'только критичное' },
    ],
    rows: [
      { title: 'Рассылки', meta: 'Сегментация по роли, языку, городу или типу сущности после backend.', tone: 'neutral' },
      { title: 'Шаблоны', meta: 'Все тексты уведомлений должны локализоваться и аудироваться.', tone: 'positive' },
      { title: 'Экстренное уведомление', meta: 'Действие уровня владельца со строгим аудитом и подтверждением.', tone: 'danger' },
    ],
    actions: ['Создать черновик', 'Предпросмотр шаблона', 'Аудит отправки'],
  },
  {
    path: '/admin/audit', access: 'admin', label: 'Аудит', title: 'Аудит действий',
    subtitle: 'Неизменяемый журнал смены ролей, ограничений, платежных действий, модерации и доступа к данным.',
    kpis: [
      { value: 'Immutable', label: 'неизменяемый' },
      { value: 'Actor', label: 'фиксируется' },
      { value: 'Reason', label: 'обязательна' },
      { value: 'IP/UA', label: 'хешируются' },
    ],
    rows: [
      { title: 'Route guard проверен', meta: 'Системное событие · граница доступа подтверждена.', tone: 'positive' },
      { title: 'Очередь модерации открыта', meta: 'Действие модератора · только контекст жалобы.', tone: 'neutral' },
      { title: 'Ручная смена роли', meta: 'Требует причины и 2FA до реальной реализации.', tone: 'warning' },
    ],
    actions: ['Фильтр аудита', 'Экспорт лога', 'Открыть actor'],
  },
  {
    path: '/admin/settings', access: 'super_admin', label: 'Настройки', title: 'Настройки платформы',
    subtitle: 'Глобальные флаги платформы, регистрация, требования безопасности, провайдеры и feature gates.',
    kpis: [
      { value: 'Регистрация', label: 'политика' },
      { value: '2FA', label: 'обязательно для команды' },
      { value: 'Feature flags', label: 'будущий модуль' },
      { value: 'Провайдеры', label: 'будущий модуль' },
    ],
    rows: [
      { title: 'Политика регистрации', meta: 'Email, phone и OAuth требования управляются здесь, не по сущностям.', tone: 'positive' },
      { title: 'Политика безопасности', meta: '2FA для elevated staff и владельцев — обязательное правило.', tone: 'warning' },
      { title: 'Feature gates', meta: 'Контролируемый rollout перед подключением широких социальных функций.', tone: 'neutral' },
    ],
    actions: ['Проверить политику', 'Feature flags', 'Проверить провайдеры'],
  },
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}

function currentSection(pathname = window.location.pathname): AdminSection | null {
  if (!pathname.startsWith(ADMIN_ROOT)) return null;
  return sections.find((section) => section.path === pathname) ?? sections[0] ?? null;
}

function currentRole(root: HTMLElement): string {
  return root.querySelector<HTMLElement>('.bk-shell')?.dataset.role ?? 'guest';
}

function canViewSection(root: HTMLElement, section: AdminSection): boolean {
  return (roleRank[currentRole(root)] ?? 0) >= roleRank[section.access];
}

function badge(label: string, tone: AdminTone = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

function button(label: string, path: string, variant: 'primary' | 'secondary' | 'ghost' = 'secondary'): string {
  return `<button class="bk-button bk-button-${variant}" type="button" data-admin-route="${escapeHtml(path)}">${escapeHtml(label)}</button>`;
}

function renderKpi(item: AdminKpi): string {
  return `<div class="bk-kpi"><div class="bk-kpi-value">${escapeHtml(item.value)}</div><div class="bk-kpi-label">${escapeHtml(item.label)}</div></div>`;
}

function toneLabel(tone: AdminTone): string {
  if (tone === 'positive') return 'OK';
  if (tone === 'warning') return 'РИСК';
  if (tone === 'danger') return 'ВАЖНО';
  return 'INFO';
}

function renderRow(row: AdminRow): string {
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">◇</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(row.title)}</div><div class="bk-meta">${escapeHtml(row.meta)}</div></div>${badge(toneLabel(row.tone), row.tone)}</div>`;
}

function renderTableRow(row: AdminTableRow): string {
  const badges = row.badges.map((item) => badge(item.label, item.tone)).join('');
  const details = row.details.map((item) => `<span class="bk-badge">${escapeHtml(item)}</span>`).join('');
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">◇</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(row.title)}</div><div class="bk-meta">${escapeHtml(row.meta)}</div><div class="bk-chip-row">${details}</div></div><div class="bk-chip-row">${badges}</div></div>`;
}

function renderUsersRegistryDetails(): string {
  const users: AdminTableRow[] = [
    { title: 'Alex Rhythm', meta: 'Пользователь · музыкант · Helsinki · последний вход сегодня', badges: [{ label: 'верифицирован', tone: 'positive' }, { label: '2FA готова', tone: 'positive' }], details: ['email подтверждён', 'телефон подтверждён', 'репутация 92'] },
    { title: 'Mira Voice', meta: 'Пользователь · вокалист · Tallinn · premium-профиль', badges: [{ label: 'trusted', tone: 'positive' }, { label: 'платный тариф', tone: 'warning' }], details: ['email подтверждён', 'телефон подтверждён', 'репутация 96'] },
    { title: 'Подозрительный контакт', meta: 'Пользователь · личные сообщения · сработала политика внешних ссылок', badges: [{ label: 'проверка', tone: 'warning' }, { label: 'жалоба', tone: 'danger' }], details: ['ссылка заблокирована', 'контекст сохранён', 'нужна модерация'] },
  ];
  return `<section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Реестр пользователей</div><h3 class="bk-card-title">Support-safe карточки</h3></div>${badge('без мутаций', 'positive')}</div><p class="bk-state-copy">Первый проход показывает только безопасный read-only слой: статус аккаунта, верификация, 2FA, жалобы и risk-флаги. Блокировки, сброс 2FA, смена роли и доступ к приватным данным требуют отдельного backend action с причиной и аудитом.</p><div class="bk-list">${users.map(renderTableRow).join('')}</div></section><section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Что будет в карточке пользователя</div><h3 class="bk-card-title">Структура будущего detail view</h3></div>${badge('позже API', 'warning')}</div><div class="bk-chip-row">${['Профиль', 'Контакты', 'Верификация', '2FA', 'Роли', 'Сущности', 'Жалобы', 'Платежи', 'Устройства', 'Аудит'].map((item) => badge(item)).join('')}</div></section>`;
}

function renderEntitiesRegistryDetails(): string {
  const entities: AdminTableRow[] = [
    { title: 'Northern Lights Band', meta: 'Группа / проект · владелец Alex Rhythm · активна', badges: [{ label: 'активна', tone: 'positive' }, { label: 'owner admin отдельно', tone: 'neutral' }], details: ['5 участников', '2 события', 'документы есть'] },
    { title: 'City Orchestra Lab', meta: 'Оркестр · 32 участника · идёт набор', badges: [{ label: 'набор', tone: 'warning' }, { label: 'проверить роли', tone: 'neutral' }], details: ['много участников', 'публичная страница', 'роли сущности'] },
    { title: 'Studio Night Crew', meta: 'Сессионная команда · закрытый проект · platform review возможен', badges: [{ label: 'закрыто', tone: 'neutral' }, { label: 'review ready', tone: 'warning' }], details: ['8 участников', 'закрытая видимость', 'аудит изменений'] },
  ];
  return `<section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Реестр сущностей</div><h3 class="bk-card-title">Платформенный обзор без входа в админку сущности</h3></div>${badge('граница сохранена', 'positive')}</div><p class="bk-state-copy">Владелец платформы видит состояние сущностей, владельца, жалобы, активность и риск-флаги. Внутренние настройки группы, студии или события остаются в их собственных админках.</p><div class="bk-list">${entities.map(renderTableRow).join('')}</div></section><section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Допустимые platform actions</div><h3 class="bk-card-title">Что можно делать из /admin</h3></div>${badge('с аудитом', 'warning')}</div><div class="bk-chip-row">${['Заморозить', 'Снять с публикации', 'Поставить risk-флаг', 'Назначить проверку', 'Проверить владельца', 'Открыть read-only аудит'].map((item) => badge(item)).join('')}</div></section>`;
}

function renderReportsQueueDetails(): string {
  const reports: AdminTableRow[] = [
    { title: 'RPT-1024 · подозрение на мошенничество', meta: 'Пост в ленте · жалоба от пользователя · риск оплаты вне платформы', badges: [{ label: 'высокий приоритет', tone: 'danger' }, { label: 'новая', tone: 'warning' }], details: ['контент сохранён', 'автор виден', 'нужна проверка'] },
    { title: 'RPT-1025 · спам в личных сообщениях', meta: 'Чат по жалобе · повторяющийся текст · внешняя ссылка заблокирована', badges: [{ label: 'в работе', tone: 'warning' }, { label: 'сообщения по жалобе', tone: 'neutral' }], details: ['доступ только к кейсу', 'история действий', 'anti-fraud flag'] },
    { title: 'RPT-1026 · спор по рейтингу', meta: 'Отзыв после события · пользователь оспаривает оценку и причину отмены', badges: [{ label: 'апелляция', tone: 'neutral' }, { label: 'нужны данные', tone: 'warning' }], details: ['событие связано', 'нужен ответ второй стороны', 'аудит рейтинга'] },
  ];
  return `<section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Очередь жалоб</div><h3 class="bk-card-title">Операционные кейсы модерации</h3></div>${badge('read-only mock', 'positive')}</div><p class="bk-state-copy">Экран показывает будущую структуру очереди: тип жалобы, объект, приоритет, статус, назначение и следующий безопасный шаг. Реальные решения должны фиксировать причину и событие аудита.</p><div class="bk-list">${reports.map(renderTableRow).join('')}</div></section><section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Workflow жалобы</div><h3 class="bk-card-title">Статусы без потери следа</h3></div>${badge('аудит обязателен', 'warning')}</div><div class="bk-chip-row">${['Новая', 'В работе', 'Запрошены данные', 'Эскалация', 'Решена', 'Отклонена', 'Апелляция'].map((item) => badge(item)).join('')}</div></section>`;
}

function renderModerationOpsDetails(): string {
  const lanes: AdminTableRow[] = [
    { title: 'Контент в ленте', meta: 'Посты, комментарии, медиа и публичные профили', badges: [{ label: 'очередь', tone: 'warning' }], details: ['скрыть', 'снять', 'оставить', 'эскалация'] },
    { title: 'Сообщения по жалобе', meta: 'Доступ только к конкретному кейсу, без общего чтения приватных чатов', badges: [{ label: 'ограниченный доступ', tone: 'positive' }], details: ['контекст жалобы', 'снимок сообщений', 'аудит просмотра'] },
    { title: 'Видимость сущностей', meta: 'Группы, студии, события и организации на уровне публикации', badges: [{ label: 'platform action', tone: 'warning' }], details: ['заморозить', 'снять с публикации', 'проверить владельца'] },
  ];
  return `<section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Операции модерации</div><h3 class="bk-card-title">Очереди и допустимые решения</h3></div>${badge('без прямого редактирования', 'positive')}</div><p class="bk-state-copy">Модератор не редактирует профиль или пост как пользователь. Он принимает платформенное решение: скрыть, снять с публикации, ограничить, оставить без изменений или эскалировать.</p><div class="bk-list">${lanes.map(renderTableRow).join('')}</div></section><section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Матрица решения</div><h3 class="bk-card-title">Каждое действие требует причины</h3></div>${badge('логируется', 'warning')}</div><div class="bk-chip-row">${['Скрыть публикацию', 'Снять комментарий', 'Ограничить сообщения', 'Оставить без изменений', 'Отправить на проверку', 'Эскалация в безопасность'].map((item) => badge(item)).join('')}</div></section>`;
}

function renderSectionSpecificDetails(section: AdminSection): string {
  if (section.path === '/admin/users') return renderUsersRegistryDetails();
  if (section.path === '/admin/entities') return renderEntitiesRegistryDetails();
  if (section.path === '/admin/reports') return renderReportsQueueDetails();
  if (section.path === '/admin/moderation') return renderModerationOpsDetails();
  return '';
}

function renderAdminMain(section: AdminSection, root: HTMLElement): string {
  const shortcutButtons = sections
    .filter((item) => item.path !== section.path && canViewSection(root, item))
    .slice(0, 6)
    .map((item) => button(item.label, item.path, 'ghost'))
    .join('');
  const details = renderSectionSpecificDetails(section);
  return `<header class="bk-page-header"><div class="bk-eyebrow">Платформенная консоль · операции владельца · режим заглушек</div><div class="bk-chip-row">${badge('/admin граница', 'positive')}${badge('админки сущностей отдельно', 'warning')}${badge('без критичных API')}</div><div class="bk-page-header-main"><div><h1 class="bk-title">${escapeHtml(section.title)}</h1><p class="bk-subtitle">${escapeHtml(section.subtitle)}</p></div><div class="bk-action-row">${button('В приложение', '/feed', 'secondary')}</div></div></header><section class="bk-card"><div class="bk-kpi-grid">${section.kpis.map(renderKpi).join('')}</div></section>${details}<section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Операционная граница</div><h3 class="bk-card-title">Только действия уровня платформы</h3></div>${badge('сначала только чтение', 'positive')}</div><div class="bk-list">${section.rows.map(renderRow).join('')}</div></section><section class="bk-card"><h3 class="bk-card-title">Безопасные действия</h3><p class="bk-state-copy">Эти кнопки пока являются UI-заглушками. Реальные блокировки, возвраты, смена ролей, impersonation и доступ к данным должны проходить через backend permissions, запрос причины и неизменяемый аудит.</p><div class="bk-action-row">${section.actions.map((action) => button(action, section.path, action.includes('Аудит') || action.includes('аудит') ? 'primary' : 'secondary')).join('')}</div></section><section class="bk-card"><h3 class="bk-card-title">Разделы платформы</h3><div class="bk-action-row">${shortcutButtons}</div></section>`;
}

function renderAdminRightRail(section: AdminSection): string {
  return `<aside class="bk-right-rail"><section class="bk-card"><div class="bk-meta">Режим консоли</div><strong>${escapeHtml(section.label)}</strong><p class="bk-state-copy">Рабочее место владельца и команды платформы. Администраторы сущностей должны использовать свои будущие маршруты: /band/:id/admin, /studio/:id/admin, /org/:id/admin, /event/:id/admin.</p><div class="bk-chip-row">${badge('2FA обязательно', 'warning')}${badge('роли доступа')}${badge('аудит')}</div></section><section class="bk-card"><h3 class="bk-card-title">Не смешивать здесь</h3><div class="bk-list"><div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">×</span><div class="bk-list-row-main"><div class="bk-list-row-title">Настройки группы</div><div class="bk-meta">Относятся к админке сущности.</div></div></div><div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">×</span><div class="bk-list-row-main"><div class="bk-list-row-title">Настройки студии</div><div class="bk-meta">Относятся к будущему /studio/:id/admin.</div></div></div><div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">×</span><div class="bk-list-row-main"><div class="bk-list-row-title">Настройки пользователя</div><div class="bk-meta">Относятся к настройкам аккаунта, не к консоли владельца.</div></div></div></div></section></aside>`;
}

function renderAdminPage(root: HTMLElement, section: AdminSection): void {
  if (!canViewSection(root, section)) return;
  document.documentElement.dataset.platformAdminConsole = 'true';
  root.querySelectorAll<HTMLElement>('.bk-nav-item').forEach((item) => {
    const href = item.getAttribute('href') ?? '';
    const active = href === section.path;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  const grid = root.querySelector<HTMLElement>('.bk-content-grid');
  const main = root.querySelector<HTMLElement>('.bk-main-column');
  if (grid) grid.classList.remove('bk-content-wide');
  if (main) main.innerHTML = renderAdminMain(section, root);
  const existingRail = root.querySelector<HTMLElement>('.bk-right-rail');
  const railHtml = renderAdminRightRail(section);
  if (existingRail) existingRail.outerHTML = railHtml;
  else grid?.insertAdjacentHTML('beforeend', railHtml);
}

function routeTo(path: string): void {
  if (!path.startsWith(ADMIN_ROOT)) {
    window.location.href = path;
    return;
  }
  if (window.location.pathname !== path) {
    window.history.pushState({ bandkitPlatformAdmin: true }, '', path);
  }
  window.dispatchEvent(new CustomEvent('bandkit:platform-admin-route'));
}

function maybeRender(root: HTMLElement): void {
  const section = currentSection();
  if (!section) {
    document.documentElement.dataset.platformAdminConsole = 'false';
    return;
  }
  window.requestAnimationFrame(() => renderAdminPage(root, section));
}

export function initPlatformAdminConsole(root: HTMLElement): void {
  maybeRender(root);
  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-admin-route], a[href^="/admin"]') : null;
    if (!target) return;
    const nextPath = target.dataset.adminRoute ?? target.getAttribute('href') ?? '';
    if (!nextPath) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    routeTo(nextPath);
  }, true);
  window.addEventListener('popstate', () => maybeRender(root));
  window.addEventListener('bandkit:platform-admin-route', () => maybeRender(root));
}
