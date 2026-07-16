-- Notifications: references, not frozen text.
--
-- Источники: `Conversation_Lifecycle §10` (обязательная), `User_Friends_And_Personal_Feed
-- §Notifications`, `Communication_Domain §9` (Inbox — четыре разные сущности).
--
-- Три решения, которые определяют форму таблицы.
--
-- 1. Объект, а не проекция. Состояние прочтения, дедупликация и retention всё равно
--    требуют хранения, а выводить уведомления из `audit_events` — значит сделать аудит
--    продуктовой таблицей с требованиями к производительности. Аудит не источник
--    уведомлений, как он не источник аналитики.
--
-- 2. Получатель — User, не Party. Уведомления для Party означали бы входящие сущности,
--    то есть Entity Inbox, который `CLAUDE.md` запрещает в MVP.
--
-- 3. Никакого замороженного payload. `§10` требует «проверять актуальный доступ
--    непосредственно перед отправкой» и «не раскрывать название закрытой сущности при
--    отсутствии доступа». Сохранённый текст «Иван пригласил вас в „Север"» пережил бы
--    отзыв доступа и утёк бы именно тем, от кого его прячут. Поэтому здесь только
--    ссылки: тип и id. Текст собирается при чтении, с проверкой прав в тот же момент.
--    Канала доставки в MVP нет (in-app only — Friends §Notifications: push и email
--    future-ready), поэтому «проверить перед отправкой» и «проверить при чтении» — одно
--    и то же, и требование выполняется само. Когда появится email или push, проверка
--    обязана переехать в момент отправки; это цена канала, а не сюрприз внутри него.

create table if not exists notification_types (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

-- Ops-метки; UI рендерит t('notifications.type.<key>') по стабильному ключу.
insert into notification_types (key, label, sort_order) values
  ('entity_invitation',    'Invited to an entity',        10),
  ('invitation_accepted',  'Invitation accepted',         20),
  ('invitation_declined',  'Invitation declined',         30),
  ('conversation_request', 'New message request',         40)
on conflict (key) do nothing;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references users(id) on delete cascade,
  type_key text not null references notification_types(key) on delete restrict,
  -- Кто вызвал событие. SET NULL: анонимизированный автор не удаляет уведомление, но и
  -- не называется (users.status='anonymized' — терминальное состояние, 0023).
  actor_user_id uuid references users(id) on delete set null,
  -- Ссылки на предмет. Каскад: исчез предмет — исчезло уведомление о нём. Это и есть
  -- отсутствие замороженного payload: не на что ссылаться — нечего показывать.
  entity_id uuid references entities(id) on delete cascade,
  room_id uuid references chat_rooms(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_inbox_idx
  on notifications (recipient_user_id, created_at desc);

create index if not exists notifications_unread_idx
  on notifications (recipient_user_id)
  where read_at is null;

-- Одно уведомление на приглашение: повторное приглашение после отказа обновляет то же,
-- а не плодит второе. Дедупликация структурная, а не правилом в коде.
create unique index if not exists notifications_entity_invitation_uidx
  on notifications (recipient_user_id, entity_id)
  where type_key = 'entity_invitation';

create unique index if not exists notifications_conversation_request_uidx
  on notifications (recipient_user_id, room_id)
  where type_key = 'conversation_request';
