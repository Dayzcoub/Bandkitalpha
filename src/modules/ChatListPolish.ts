type ChatPreviewMeta = {
  id: string;
  preview: string;
  time: string;
  unread: number;
  risk?: boolean;
  muted?: boolean;
};

const CHAT_ROUTE_PATTERN = /^\/chats(?:\/[^/]+)?$/;

const CHAT_PREVIEW_META: ChatPreviewMeta[] = [
  { id: 'c1', preview: 'Репетиция перенесена, райдер обновлён в документах.', time: '14:03', unread: 3 },
  { id: 'c2', preview: 'Вокальные демо и материалы готовы к обмену.', time: '13:24', unread: 0 },
  { id: 'c3', preview: 'Проверить внешнюю ссылку и сохранить контекст жалобы.', time: '15:31', unread: 1, risk: true },
  { id: 'c4', preview: 'Монтаж сцены сегодня, загрузка и саундчек по таймингу.', time: '13:18', unread: 6 },
  { id: 'c5', preview: 'Ожидается подтверждение по booking и составу участников.', time: '12:54', unread: 2 },
  { id: 'c6', preview: 'Файлы готовы, можно привязать их к личному обмену.', time: '12:20', unread: 0 },
  { id: 'c7', preview: 'Правки райдера лучше оставить в закреплённом решении.', time: '11:48', unread: 4 },
  { id: 'c8', preview: 'Backline уточнён: ковёр и стойка под райд в ожидании.', time: '11:25', unread: 0, muted: true },
  { id: 'c9', preview: 'Safety-проверка жалобы и подозрительного контакта.', time: '10:52', unread: 1, risk: true },
  { id: 'c10', preview: 'Волонтёры подтверждают роли и точки входа на площадку.', time: '10:18', unread: 12 },
  { id: 'c11', preview: 'Бронь Studio A ждёт финального подтверждения.', time: '09:44', unread: 0 },
  { id: 'c12', preview: 'Setlist обновлён, участникам нужна актуальная версия.', time: '09:31', unread: 3 },
  { id: 'c13', preview: 'Проверить оплату вне платформы и safety-контекст.', time: '09:12', unread: 2, risk: true },
  { id: 'c14', preview: 'Админский чат по ролям и доступам без новых сообщений.', time: '08:57', unread: 0, muted: true },
  { id: 'c15', preview: 'Прослушивание нового гитариста: нужен ответ менеджера.', time: '08:30', unread: 5 },
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[char] ?? char;
  });
}

function chatIdFromRow(row: HTMLElement, index: number): string | null {
  const route = row.dataset.route ?? row.querySelector<HTMLElement>('[data-route]')?.dataset.route ?? '';
  const routeMatch = route.match(/^\/chats\/(c\d+)$/);
  if (routeMatch?.[1]) return routeMatch[1];
  return CHAT_PREVIEW_META[index]?.id ?? null;
}

function sideHtml(meta: ChatPreviewMeta): string {
  const unreadHtml = meta.unread > 0
    ? `<span class="bk-chat-unread-badge" aria-label="Непрочитано: ${meta.unread}">${meta.unread}</span>`
    : meta.muted
      ? '<span class="bk-chat-muted-dot" aria-label="Без новых уведомлений" title="Без новых уведомлений">◌</span>'
      : '<span class="bk-chat-read-check" aria-label="Прочитано" title="Прочитано">✓</span>';

  return `<span class="bk-chat-row-time">${escapeHtml(meta.time)}</span>${unreadHtml}`;
}

function decorateChatRow(row: HTMLElement, index: number): void {
  const chatId = chatIdFromRow(row, index);
  const meta = CHAT_PREVIEW_META.find((item) => item.id === chatId);
  if (!meta) return;

  row.classList.add('bk-chat-list-row');
  row.classList.toggle('has-unread', meta.unread > 0);
  row.classList.toggle('is-risk', meta.risk === true);
  row.classList.toggle('is-muted', meta.muted === true);
  row.dataset.chatId = meta.id;

  const metaNode = row.querySelector<HTMLElement>('.bk-meta');
  if (metaNode && metaNode.dataset.chatPreviewReady !== 'true') {
    metaNode.textContent = meta.preview;
    metaNode.dataset.chatPreviewReady = 'true';
  }

  Array.from(row.children).forEach((child) => {
    if (child instanceof HTMLElement && child.classList.contains('bk-badge')) child.remove();
  });

  let side = row.querySelector<HTMLElement>(':scope > .bk-chat-row-side');
  if (!side) {
    side = document.createElement('span');
    side.className = 'bk-chat-row-side';
    row.appendChild(side);
  }
  side.innerHTML = sideHtml(meta);
}

function decorateChatLists(root: HTMLElement): void {
  if (!CHAT_ROUTE_PATTERN.test(window.location.pathname)) return;

  const rows = Array.from(root.querySelectorAll<HTMLElement>('.bk-chat-nav-row, .bk-chat-stress-row'));
  rows.forEach((row, index) => decorateChatRow(row, index));
}

export function initChatListPolish(root: HTMLElement): void {
  decorateChatLists(root);

  const observer = new MutationObserver(() => decorateChatLists(root));
  observer.observe(root, { attributes: true, attributeFilter: ['data-route', 'aria-current', 'class'], childList: true, subtree: true });
}
