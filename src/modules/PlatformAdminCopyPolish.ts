const ADMIN_PREFIX = '/admin';

const TEXT_REPLACEMENTS: Array<[string, string]> = [
  ['read-only mock', 'режим просмотра'],
  ['read-only', 'только чтение'],
  ['mock', 'заглушка'],
  ['Mock', 'Заглушка'],
  ['backend permissions', 'серверные проверки прав'],
  ['backend-действия', 'серверные действия'],
  ['backend action', 'серверное действие'],
  ['backend-задачей', 'серверной задачей'],
  ['backend-политике', 'серверной политике'],
  ['backend-подключения', 'серверного подключения'],
  ['backend', 'серверный слой'],
  ['risk-флаги', 'флаги риска'],
  ['risk-флаг', 'флаг риска'],
  ['risk-сигналы', 'сигналы риска'],
  ['platform actions', 'платформенные действия'],
  ['platform action', 'платформенное действие'],
  ['future-ready', 'заложенные на будущее'],
  ['future', 'позже'],
  ['Future', 'Позже'],
  ['Fallback', 'Резерв'],
  ['fallback', 'резерв'],
  ['staff-доступ', 'доступ команды'],
  ['staff-ролей', 'ролей команды'],
  ['staff-матрица', 'матрица команды'],
  ['staff', 'команда'],
  ['owner-managed', 'управляет владелец'],
  ['owner-only', 'только владелец'],
  ['owner admin', 'админка владельца'],
  ['super-admin', 'суперадмин'],
  ['super_admin', 'суперадмин'],
  ['premium-профиль', 'премиум-профиль'],
  ['premium-функции', 'премиум-функции'],
  ['trusted', 'доверенный'],
  ['scoped', 'ограничено областью'],
  ['case-limited', 'только по кейсу'],
  ['rate limits', 'лимиты частоты'],
  ['MVP block', 'блокировка в MVP'],
  ['blocked domains', 'заблокированные домены'],
  ['allowlist', 'список разрешённых'],
  ['denylist', 'список запрещённых'],
  ['moderation queue', 'очередь модерации'],
  ['anti-spam', 'антиспам'],
  ['dispute trail', 'история спора'],
  ['reason code', 'код причины'],
  ['audit event', 'событие аудита'],
  ['audit trail', 'след аудита'],
  ['audit', 'аудит'],
  ['Audit', 'Аудит'],
  ['actor', 'оператор'],
  ['Actor', 'Оператор'],
  ['target', 'объект'],
  ['Target', 'Объект'],
  ['required', 'обязательно'],
  ['critical', 'критично'],
  ['data access', 'доступ к данным'],
  ['scope', 'область доступа'],
  ['Scope', 'Область'],
  ['operator', 'оператор'],
  ['rollout', 'поэтапное включение'],
  ['segments', 'сегменты'],
  ['rollback', 'откат'],
  ['shell ready', 'оболочка готова'],
  ['provider later', 'провайдер позже'],
  ['owner confirm', 'подтверждение владельца'],
  ['emergency notices', 'экстренные уведомления'],
  ['Emergency notices', 'Экстренные уведомления'],
  ['Maintenance mode', 'Режим обслуживания'],
  ['Feature gates', 'Флаги функций'],
  ['Feature flags', 'Флаги функций'],
  ['Security policy', 'Политика безопасности'],
  ['Safe', 'Безопасно'],
  ['Entity plan', 'Тариф сущности'],
  ['Free /', 'Базовый /'],
  ['Pro /', 'Про /'],
  ['trial-доступ', 'тестовый доступ'],
  ['trial', 'тест'],
  ['promo', 'промо'],
  ['payment provider', 'платёжный провайдер'],
  ['refund trail', 'история возврата'],
  ['invoice', 'счёт'],
  ['old/new value', 'старое/новое значение'],
  ['curated', 'курируемо'],
  ['featured', 'рекомендуемое'],
  ['hide', 'скрыть'],
  ['unpublish', 'снять с публикации'],
  ['review', 'проверка'],
  ['appeal', 'апелляция'],
  ['reason required', 'нужна причина'],
  ['missing keys', 'пропущенные ключи'],
  ['namespace', 'раздел ключей'],
  ['packages', 'пакеты'],
  ['import', 'импорт'],
  ['export', 'экспорт'],
  ['nav', 'навигация'],
  ['common', 'общие'],
  ['auth', 'авторизация'],
  ['settings', 'настройки'],
  ['billing', 'платежи'],
  ['roles', 'роли'],
  ['users', 'пользователи'],
  ['entities', 'сущности'],
  ['content', 'контент'],
  ['trust', 'доверие'],
  ['reports', 'жалобы'],
  ['moderation', 'модерация'],
  ['notes', 'заметки'],
  ['decision', 'решение'],
  ['note', 'заметка'],
  ['case id', 'ID кейса'],
  ['time', 'время'],
  ['flags', 'флаги'],
  ['email', 'email'],
  ['phone', 'телефон'],
  ['verification', 'верификация'],
  ['push', 'push'],
  ['SMS provider', 'SMS-провайдер'],
  ['Email provider', 'Email-провайдер'],
];

function shouldPolish(): boolean {
  return window.location.pathname.startsWith(ADMIN_PREFIX);
}

function polishText(value: string): string {
  let next = value;
  for (const [from, to] of TEXT_REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next;
}

function polishTextNodes(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('script, style, input, textarea')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    const current = node.nodeValue ?? '';
    const polished = polishText(current);
    if (polished !== current) node.nodeValue = polished;
  });
}

function polishInputs(root: HTMLElement): void {
  root.querySelectorAll<HTMLInputElement>('input[placeholder]').forEach((input) => {
    const current = input.placeholder;
    const polished = polishText(current);
    if (polished !== current) input.placeholder = polished;
  });
}

function runPolish(root: HTMLElement): void {
  if (!shouldPolish()) return;
  polishTextNodes(root);
  polishInputs(root);
}

function schedule(root: HTMLElement): void {
  window.requestAnimationFrame(() => runPolish(root));
  window.setTimeout(() => runPolish(root), 60);
  window.setTimeout(() => runPolish(root), 180);
}

export function initPlatformAdminCopyPolish(root: HTMLElement): void {
  schedule(root);
  window.addEventListener('popstate', () => schedule(root));
  window.addEventListener('bandkit:platform-admin-route', () => schedule(root));
}
