type AdminTone = 'neutral' | 'positive' | 'warning' | 'danger';
type AdminAccess = 'moderator' | 'admin' | 'super_admin';
type Translate = (key: string, vars?: Record<string, string | number>) => string;

type AdminSection = {
  path: string;
  access: AdminAccess;
  key: string;
  kpis: Array<[string, string]>;
  rows: Array<[string, string, string, AdminTone]>;
  actions: string[];
};

const ADMIN_ROOT = '/admin';
const roleRank: Record<string, number> = { guest: 0, user: 1, moderator: 2, admin: 3, super_admin: 4 };

const sections: AdminSection[] = [
  {
    path: '/admin', access: 'admin', key: 'overview',
    kpis: [['42', 'usersReview'], ['2', 'openReports'], ['7', 'platformQueues'], ['0', 'criticalIncidents']],
    rows: [
      ['platformBoundary', 'platformBoundaryMeta', 'positive', 'positive'],
      ['sensitiveActions', 'sensitiveActionsMeta', 'warning', 'warning'],
      ['currentMode', 'currentModeMeta', 'neutral', 'neutral'],
    ],
    actions: ['openReportsQueue', 'reviewTrustSignals', 'checkAuditTrail'],
  },
  {
    path: '/admin/users', access: 'admin', key: 'users',
    kpis: [['3', 'demoProfiles'], ['2FA', 'staffRequired'], ['1', 'restrictedSample'], ['Audit', 'mandatory']],
    rows: [
      ['alexRhythm', 'alexRhythmMeta', 'positive', 'positive'],
      ['miraVoice', 'miraVoiceMeta', 'positive', 'positive'],
      ['suspiciousOutreach', 'suspiciousOutreachMeta', 'warning', 'warning'],
    ],
    actions: ['openUserCard', 'addSupportNote', 'requestVerification'],
  },
  {
    path: '/admin/entities', access: 'admin', key: 'entities',
    kpis: [['3', 'bandsProjects'], ['3', 'events'], ['Future', 'studiosOrgs'], ['Safe', 'readFirst']],
    rows: [
      ['northernLights', 'northernLightsMeta', 'positive', 'positive'],
      ['cityOrchestra', 'cityOrchestraMeta', 'neutral', 'neutral'],
      ['studioCrew', 'studioCrewMeta', 'warning', 'warning'],
    ],
    actions: ['openRegistryItem', 'flagForReview', 'openReadOnlyAudit'],
  },
  {
    path: '/admin/reports', access: 'moderator', key: 'reports',
    kpis: [['2', 'openReports'], ['1', 'highPriority'], ['0', 'slaBreaches'], ['Appeals', 'futureReady']],
    rows: [
      ['fraudReport', 'fraudReportMeta', 'danger', 'danger'],
      ['spamReport', 'spamReportMeta', 'warning', 'warning'],
      ['appealLane', 'appealLaneMeta', 'neutral', 'neutral'],
    ],
    actions: ['assignCase', 'escalateToTrust', 'closeRejected'],
  },
  {
    path: '/admin/moderation', access: 'moderator', key: 'moderation',
    kpis: [['Content', 'postsComments'], ['Messages', 'complaintGated'], ['Profiles', 'riskReview'], ['Audit', 'immutable']],
    rows: [
      ['contentReview', 'contentReviewMeta', 'warning', 'warning'],
      ['complaintMessages', 'complaintMessagesMeta', 'positive', 'positive'],
      ['entityVisibility', 'entityVisibilityMeta', 'neutral', 'neutral'],
    ],
    actions: ['openQueue', 'reviewContentFlag', 'writeModerationNote'],
  },
  {
    path: '/admin/trust', access: 'admin', key: 'trust',
    kpis: [['Links', 'blockedMvp'], ['Risk', 'manualReview'], ['Rating', 'abuseFuture'], ['2FA', 'staffRequired']],
    rows: [
      ['externalLinks', 'externalLinksMeta', 'warning', 'warning'],
      ['suspiciousLogins', 'suspiciousLoginsMeta', 'neutral', 'neutral'],
      ['ratingDisputes', 'ratingDisputesMeta', 'positive', 'positive'],
    ],
    actions: ['reviewBlockedLinks', 'openRiskUser', 'tunePolicyDraft'],
  },
  {
    path: '/admin/billing', access: 'super_admin', key: 'billing',
    kpis: [['Plans', 'future'], ['Invoices', 'future'], ['Refunds', 'audited'], ['Access', 'manualGrant']],
    rows: [
      ['planCatalog', 'planCatalogMeta', 'neutral', 'neutral'],
      ['manualGrant', 'manualGrantMeta', 'warning', 'warning'],
      ['refundLane', 'refundLaneMeta', 'neutral', 'neutral'],
    ],
    actions: ['reviewPlans', 'openSubscriptions', 'auditRefund'],
  },
  {
    path: '/admin/content', access: 'admin', key: 'content',
    kpis: [['Feed', 'moderated'], ['Media', 'scanFuture'], ['Featured', 'curated'], ['Categories', 'controlled']],
    rows: [
      ['feedOperations', 'feedOperationsMeta', 'neutral', 'neutral'],
      ['mediaStatus', 'mediaStatusMeta', 'warning', 'warning'],
      ['categories', 'categoriesMeta', 'positive', 'positive'],
    ],
    actions: ['openContentFlags', 'manageFeatured', 'reviewMedia'],
  },
  {
    path: '/admin/localization', access: 'admin', key: 'localization',
    kpis: [['RU/EN', 'active'], ['JSON', 'currentMvp'], ['DB', 'futureReady'], ['Fallback', 'english']],
    rows: [
      ['languagePacks', 'languagePacksMeta', 'positive', 'positive'],
      ['missingKeys', 'missingKeysMeta', 'neutral', 'neutral'],
      ['assetPolicy', 'assetPolicyMeta', 'positive', 'positive'],
    ],
    actions: ['reviewKeys', 'exportPack', 'checkMissing'],
  },
  {
    path: '/admin/notifications', access: 'admin', key: 'notifications',
    kpis: [['In-app', 'readyShell'], ['Push', 'future'], ['Email', 'templates'], ['SMS', 'criticalOnly']],
    rows: [
      ['broadcasts', 'broadcastsMeta', 'neutral', 'neutral'],
      ['templates', 'templatesMeta', 'positive', 'positive'],
      ['emergencyNotice', 'emergencyNoticeMeta', 'danger', 'danger'],
    ],
    actions: ['createDraft', 'previewTemplate', 'auditSend'],
  },
  {
    path: '/admin/audit', access: 'admin', key: 'audit',
    kpis: [['Immutable', 'required'], ['Actor', 'captured'], ['Reason', 'required'], ['IP/UA', 'hashed']],
    rows: [
      ['routeGuardChecked', 'routeGuardCheckedMeta', 'positive', 'positive'],
      ['moderationViewed', 'moderationViewedMeta', 'neutral', 'neutral'],
      ['manualRoleChange', 'manualRoleChangeMeta', 'warning', 'warning'],
    ],
    actions: ['filterAudit', 'exportLog', 'openActor'],
  },
  {
    path: '/admin/settings', access: 'super_admin', key: 'settings',
    kpis: [['Registration', 'policy'], ['2FA', 'staffRequired'], ['Feature flags', 'future'], ['Providers', 'future']],
    rows: [
      ['registrationPolicy', 'registrationPolicyMeta', 'positive', 'positive'],
      ['securityPolicy', 'securityPolicyMeta', 'warning', 'warning'],
      ['featureGates', 'featureGatesMeta', 'neutral', 'neutral'],
    ],
    actions: ['reviewPolicy', 'openFeatureFlags', 'checkProviders'],
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

function localeFromDocument(): 'ru' | 'en' {
  return document.documentElement.lang === 'en' ? 'en' : 'ru';
}

const messages: Record<'ru' | 'en', Record<string, string>> = {
  ru: {
    'admin.platformEyebrow': 'Платформенная консоль · операции владельца · mock-only',
    'admin.boundaryBadge': '/admin граница',
    'admin.entityBadge': 'админки сущностей отдельно',
    'admin.noSensitiveApi': 'без sensitive API',
    'admin.backToApp': 'В приложение',
    'admin.operationalBoundary': 'Операционная граница',
    'admin.platformActionsOnly': 'Только действия уровня платформы',
    'admin.readFirstMock': 'read-first mock',
    'admin.safeActionsTitle': 'Безопасные действия',
    'admin.safeActionsCopy': 'Эти кнопки пока являются UI-заглушками. Реальные блокировки, возвраты, смена ролей, impersonation и доступ к данным должны проходить через backend permissions, запрос причины и неизменяемый аудит.',
    'admin.platformSections': 'Разделы платформы',
    'admin.consoleModeLabel': 'Режим консоли',
    'admin.rightRailCopy': 'Рабочее место владельца и команды платформы. Администраторы сущностей должны использовать свои будущие маршруты: /band/:id/admin, /studio/:id/admin, /org/:id/admin, /event/:id/admin.',
    'admin.doNotMix': 'Не смешивать здесь',
    'admin.twoFactorRequired': '2FA обязательно',
    'admin.bandSettings': 'Настройки группы',
    'admin.bandSettingsMeta': 'Относятся к админке сущности.',
    'admin.studioSettings': 'Настройки студии',
    'admin.studioSettingsMeta': 'Относятся к будущему /studio/:id/admin.',
    'admin.userPreferences': 'Настройки пользователя',
    'admin.userPreferencesMeta': 'Относятся к настройкам аккаунта, не к консоли владельца.',
    'tone.positive': 'OK', 'tone.warning': 'РИСК', 'tone.neutral': 'INFO', 'tone.danger': 'ВАЖНО',
    'section.overview.label': 'Обзор', 'section.overview.title': 'Платформенная консоль', 'section.overview.subtitle': 'Операционная консоль владельца уровня платформы. Это не админка группы, студии, организации или события.',
    'section.users.label': 'Пользователи', 'section.users.title': 'Реестр пользователей', 'section.users.subtitle': 'Платформенный поиск пользователей, статусы верификации, риск-флаги и support-safe операции аккаунта.',
    'section.entities.label': 'Сущности', 'section.entities.title': 'Реестр сущностей', 'section.entities.subtitle': 'Реестр групп, студий, организаций, площадок и событий без смешивания с их собственными админками.',
    'section.reports.label': 'Жалобы', 'section.reports.title': 'Очередь жалоб', 'section.reports.subtitle': 'Единая очередь жалоб, апелляций и эскалаций до подключения реальных moderation workflows.',
    'section.moderation.label': 'Модерация', 'section.moderation.title': 'Операции модерации', 'section.moderation.subtitle': 'Платформенная модерация контента, профилей, сообщений по жалобам и видимости сущностей.',
    'section.trust.label': 'Trust & Safety', 'section.trust.title': 'Trust & Safety', 'section.trust.subtitle': 'Риск-сигналы, заблокированные ссылки, подозрительные паттерны, накрутки рейтинга и антифрод.',
    'section.billing.label': 'Платежи', 'section.billing.title': 'Тарифы и платежи', 'section.billing.subtitle': 'Тарифы, подписки, возвраты и ручная выдача доступа отдельно от настроек сущностей и профиля.',
    'section.content.label': 'Контент', 'section.content.title': 'Контентные операции', 'section.content.subtitle': 'Лента, комментарии, медиа, категории и рекомендованные поверхности на уровне платформы.',
    'section.localization.label': 'Локализация', 'section.localization.title': 'Консоль локализации', 'section.localization.subtitle': 'Языковые пакеты, ключи переводов, отсутствующие строки и будущие import/export flows.',
    'section.notifications.label': 'Уведомления', 'section.notifications.title': 'Уведомления и рассылки', 'section.notifications.subtitle': 'Платформенные объявления, шаблоны, push/email/SMS политики и emergency notices.',
    'section.audit.label': 'Аудит', 'section.audit.title': 'Аудит действий', 'section.audit.subtitle': 'Неизменяемый журнал смены ролей, ограничений, платежных действий, модерации и доступа к данным.',
    'section.settings.label': 'Настройки', 'section.settings.title': 'Настройки платформы', 'section.settings.subtitle': 'Глобальные флаги платформы, регистрация, требования безопасности, провайдеры и feature gates.',
    'kpi.usersReview': 'пользователей на проверке', 'kpi.openReports': 'открытые жалобы', 'kpi.platformQueues': 'очередей платформы', 'kpi.criticalIncidents': 'критичных инцидентов', 'kpi.demoProfiles': 'demo-профиля', 'kpi.staffRequired': 'обязательно для staff', 'kpi.restrictedSample': 'пример ограничения', 'kpi.mandatory': 'обязателен', 'kpi.bandsProjects': 'группы/проекты', 'kpi.events': 'события', 'kpi.studiosOrgs': 'студии/организации', 'kpi.readFirst': 'read-first', 'kpi.highPriority': 'высокий приоритет', 'kpi.slaBreaches': 'SLA нарушений', 'kpi.futureReady': 'future-ready', 'kpi.postsComments': 'посты/комментарии', 'kpi.complaintGated': 'только по жалобе', 'kpi.riskReview': 'проверка риска', 'kpi.immutable': 'неизменяемый', 'kpi.blockedMvp': 'блокируются в MVP', 'kpi.manualReview': 'ручная проверка', 'kpi.abuseFuture': 'накрутки future', 'kpi.future': 'future', 'kpi.audited': 'аудируется', 'kpi.manualGrant': 'ручная выдача', 'kpi.moderated': 'модерируется', 'kpi.scanFuture': 'scan future', 'kpi.curated': 'курируется', 'kpi.controlled': 'контролируемо', 'kpi.active': 'активны', 'kpi.currentMvp': 'текущий MVP', 'kpi.english': 'английский', 'kpi.readyShell': 'shell готов', 'kpi.templates': 'шаблоны', 'kpi.criticalOnly': 'только критичные', 'kpi.required': 'обязательно', 'kpi.captured': 'фиксируется', 'kpi.hashed': 'хешируются', 'kpi.policy': 'политика',
    'row.platformBoundary': 'Граница платформы', 'row.platformBoundaryMeta': '/admin управляет только операциями платформы; настройки сущностей остаются в админках сущностей.',
    'row.sensitiveActions': 'Sensitive actions', 'row.sensitiveActionsMeta': 'Блокировки, возвраты, смена ролей и impersonation должны аудироваться до реального backend-подключения.',
    'row.currentMode': 'Текущий режим', 'row.currentModeMeta': 'Mock-консоль. Backend business actions намеренно не подключены.',
    'row.alexRhythm': 'Alex Rhythm', 'row.alexRhythmMeta': 'Верифицированный пользователь · reputation 92 · без активных ограничений',
    'row.miraVoice': 'Mira Voice', 'row.miraVoiceMeta': 'Premium performer · trusted contact · email и телефон готовы',
    'row.suspiciousOutreach': 'Suspicious outreach sample', 'row.suspiciousOutreachMeta': 'Link-policy warning · доступен контекст жалобы',
    'row.northernLights': 'Northern Lights Band', 'row.northernLightsMeta': 'Band/project entity · owner admin вне /admin',
    'row.cityOrchestra': 'City Orchestra Lab', 'row.cityOrchestraMeta': 'Orchestra entity · membership и настройки относятся к админке сущности',
    'row.studioCrew': 'Studio Night Crew', 'row.studioCrewMeta': 'Session crew · платформа может freeze/review, но не случайно редактировать internals',
    'row.fraudReport': 'Жалоба на мошенничество', 'row.fraudReportMeta': 'Подозрительный пост · external payment / social engineering risk',
    'row.spamReport': 'Жалоба на спам', 'row.spamReportMeta': 'Подозрительный чат · повторяющийся outreach pattern',
    'row.appealLane': 'Линия апелляций', 'row.appealLaneMeta': 'Зарезервировано для апелляций после применённого действия',
    'row.contentReview': 'Проверка контента', 'row.contentReviewMeta': 'Hide/remove через moderation actions, не прямое редактирование текста пользователя.',
    'row.complaintMessages': 'Сообщения по жалобам', 'row.complaintMessagesMeta': 'Модераторы не получают blanket access ко всем приватным чатам.',
    'row.entityVisibility': 'Видимость сущностей', 'row.entityVisibilityMeta': 'Freeze, unpublish или review; entity admins держат свои настройки отдельно.',
    'row.externalLinks': 'Внешние ссылки', 'row.externalLinksMeta': 'MVP блокирует небезопасное поведение с внешними ссылками в чатах и постах.',
    'row.suspiciousLogins': 'Подозрительные входы', 'row.suspiciousLoginsMeta': 'Device/IP risk относится к backend policy до enforcement.',
    'row.ratingDisputes': 'Споры по рейтингу', 'row.ratingDisputesMeta': 'No-shows, cancellations и reviews требуют dispute trail до изменения score.',
    'row.planCatalog': 'Каталог тарифов', 'row.planCatalogMeta': 'Центральные owner-managed pricing и entitlements.',
    'row.manualGrant': 'Ручная выдача доступа', 'row.manualGrantMeta': 'Любое ручное изменение entitlement должно создавать audit event.',
    'row.refundLane': 'Возвраты', 'row.refundLaneMeta': 'Payment provider integration только после готовности policy slice.',
    'row.feedOperations': 'Операции ленты', 'row.feedOperationsMeta': 'Платформа может feature, hide или отправлять посты на review.',
    'row.mediaStatus': 'Статус медиа', 'row.mediaStatusMeta': 'MIME и virus scanning остаются future-ready backend concerns.',
    'row.categories': 'Категории', 'row.categoriesMeta': 'Localization-safe labels, без текста внутри ассетов.',
    'row.languagePacks': 'Языковые пакеты', 'row.languagePacksMeta': 'Строки остаются в i18n JSON, а не hardcoded в компонентах.',
    'row.missingKeys': 'Отсутствующие ключи', 'row.missingKeysMeta': 'Admin tooling позже покажет untranslated keys по namespace.',
    'row.assetPolicy': 'Asset policy', 'row.assetPolicyMeta': 'Production assets остаются language-neutral.',
    'row.broadcasts': 'Рассылки', 'row.broadcastsMeta': 'Сегментация по роли, locale, городу или типу сущности после backend.',
    'row.templates': 'Шаблоны', 'row.templatesMeta': 'Все тексты уведомлений должны локализоваться и аудироваться.',
    'row.emergencyNotice': 'Emergency notice', 'row.emergencyNoticeMeta': 'Owner-level действие со строгим аудитом и подтверждением.',
    'row.routeGuardChecked': 'Route guard проверен', 'row.routeGuardCheckedMeta': 'System actor · permission boundary verified.',
    'row.moderationViewed': 'Очередь модерации открыта', 'row.moderationViewedMeta': 'Moderator actor · только complaint context.',
    'row.manualRoleChange': 'Ручная смена роли', 'row.manualRoleChangeMeta': 'Требует reason и 2FA до реальной реализации.',
    'row.registrationPolicy': 'Политика регистрации', 'row.registrationPolicyMeta': 'Email, phone и OAuth требования управляются здесь, не по сущностям.',
    'row.securityPolicy': 'Security policy', 'row.securityPolicyMeta': '2FA для elevated staff и owners — обязательное правило.',
    'row.featureGates': 'Feature gates', 'row.featureGatesMeta': 'Контролируемый rollout перед подключением широких социальных функций.',
    'action.openReportsQueue': 'Открыть очередь жалоб', 'action.reviewTrustSignals': 'Проверить trust signals', 'action.checkAuditTrail': 'Проверить аудит', 'action.openUserCard': 'Открыть карточку', 'action.addSupportNote': 'Добавить заметку', 'action.requestVerification': 'Запросить верификацию', 'action.openRegistryItem': 'Открыть сущность', 'action.flagForReview': 'Поставить флаг', 'action.openReadOnlyAudit': 'Открыть аудит', 'action.assignCase': 'Назначить кейс', 'action.escalateToTrust': 'Эскалация в trust', 'action.closeRejected': 'Отклонить', 'action.openQueue': 'Открыть очередь', 'action.reviewContentFlag': 'Проверить флаг', 'action.writeModerationNote': 'Заметка модератора', 'action.reviewBlockedLinks': 'Проверить ссылки', 'action.openRiskUser': 'Открыть риск-профиль', 'action.tunePolicyDraft': 'Настроить policy draft', 'action.reviewPlans': 'Проверить тарифы', 'action.openSubscriptions': 'Открыть подписки', 'action.auditRefund': 'Аудит возврата', 'action.openContentFlags': 'Открыть флаги', 'action.manageFeatured': 'Управлять featured', 'action.reviewMedia': 'Проверить медиа', 'action.reviewKeys': 'Проверить ключи', 'action.exportPack': 'Экспорт pack', 'action.checkMissing': 'Проверить пропуски', 'action.createDraft': 'Создать черновик', 'action.previewTemplate': 'Предпросмотр шаблона', 'action.auditSend': 'Аудит отправки', 'action.filterAudit': 'Фильтр аудита', 'action.exportLog': 'Экспорт лога', 'action.openActor': 'Открыть actor', 'action.reviewPolicy': 'Проверить policy', 'action.openFeatureFlags': 'Feature flags', 'action.checkProviders': 'Проверить провайдеры'
  },
  en: {}
};

messages.en = messages.ru;

function createTranslator(): Translate {
  const locale = localeFromDocument();
  return (key: string) => messages[locale][key] ?? messages.ru[key] ?? key;
}

function badge(label: string, tone: AdminTone = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

function button(label: string, path: string, variant: 'primary' | 'secondary' | 'ghost' = 'secondary'): string {
  return `<button class="bk-button bk-button-${variant}" type="button" data-admin-route="${escapeHtml(path)}">${escapeHtml(label)}</button>`;
}

function renderKpi(t: Translate, [value, labelKey]: [string, string]): string {
  return `<div class="bk-kpi"><div class="bk-kpi-value">${escapeHtml(value)}</div><div class="bk-kpi-label">${escapeHtml(t(`kpi.${labelKey}`))}</div></div>`;
}

function renderRow(t: Translate, [titleKey, metaKey, toneLabelKey, tone]: [string, string, string, AdminTone]): string {
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">◇</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(t(`row.${titleKey}`))}</div><div class="bk-meta">${escapeHtml(t(`row.${metaKey}`))}</div></div>${badge(t(`tone.${toneLabelKey}`), tone)}</div>`;
}

function renderAdminMain(section: AdminSection, root: HTMLElement): string {
  const t = createTranslator();
  const shortcutButtons = sections
    .filter((item) => item.path !== section.path && canViewSection(root, item))
    .slice(0, 6)
    .map((item) => button(t(`section.${item.key}.label`), item.path, 'ghost'))
    .join('');
  return `<header class="bk-page-header"><div class="bk-eyebrow">${escapeHtml(t('admin.platformEyebrow'))}</div><div class="bk-chip-row">${badge(t('admin.boundaryBadge'), 'positive')}${badge(t('admin.entityBadge'), 'warning')}${badge(t('admin.noSensitiveApi'))}</div><div class="bk-page-header-main"><div><h1 class="bk-title">${escapeHtml(t(`section.${section.key}.title`))}</h1><p class="bk-subtitle">${escapeHtml(t(`section.${section.key}.subtitle`))}</p></div><div class="bk-action-row">${button(t('admin.backToApp'), '/feed', 'secondary')}</div></div></header><section class="bk-card"><div class="bk-kpi-grid">${section.kpis.map((item) => renderKpi(t, item)).join('')}</div></section><section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">${escapeHtml(t('admin.operationalBoundary'))}</div><h3 class="bk-card-title">${escapeHtml(t('admin.platformActionsOnly'))}</h3></div>${badge(t('admin.readFirstMock'), 'positive')}</div><div class="bk-list">${section.rows.map((item) => renderRow(t, item)).join('')}</div></section><section class="bk-card"><h3 class="bk-card-title">${escapeHtml(t('admin.safeActionsTitle'))}</h3><p class="bk-state-copy">${escapeHtml(t('admin.safeActionsCopy'))}</p><div class="bk-action-row">${section.actions.map((action) => button(t(`action.${action}`), section.path, action.includes('Audit') || action.includes('audit') ? 'primary' : 'secondary')).join('')}</div></section><section class="bk-card"><h3 class="bk-card-title">${escapeHtml(t('admin.platformSections'))}</h3><div class="bk-action-row">${shortcutButtons}</div></section>`;
}

function renderAdminRightRail(section: AdminSection): string {
  const t = createTranslator();
  return `<aside class="bk-right-rail"><section class="bk-card"><div class="bk-meta">${escapeHtml(t('admin.consoleModeLabel'))}</div><strong>${escapeHtml(t(`section.${section.key}.label`))}</strong><p class="bk-state-copy">${escapeHtml(t('admin.rightRailCopy'))}</p><div class="bk-chip-row">${badge(t('admin.twoFactorRequired'), 'warning')}${badge('RBAC')}${badge('audit')}</div></section><section class="bk-card"><h3 class="bk-card-title">${escapeHtml(t('admin.doNotMix'))}</h3><div class="bk-list"><div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">×</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(t('admin.bandSettings'))}</div><div class="bk-meta">${escapeHtml(t('admin.bandSettingsMeta'))}</div></div></div><div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">×</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(t('admin.studioSettings'))}</div><div class="bk-meta">${escapeHtml(t('admin.studioSettingsMeta'))}</div></div></div><div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">×</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(t('admin.userPreferences'))}</div><div class="bk-meta">${escapeHtml(t('admin.userPreferencesMeta'))}</div></div></div></div></section></aside>`;
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
