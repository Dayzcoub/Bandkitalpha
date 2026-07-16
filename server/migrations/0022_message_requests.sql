-- Incoming privacy and message requests.
-- Source of truth: docs/handoff/spec/BandKit_Conversation_Lifecycle_and_Abuse_Controls_v1.md §2.
--
-- Opening the canonical dialogue (1.16.2) is not the right to post into it. A first
-- message from someone who is not an established contact belongs in a message
-- request, not in the recipient's inbox.

create table if not exists dm_policies (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

-- Labels are English ops labels; the UI renders t('chat.dmPolicy.<key>') from the
-- stable key, as it already does for report reasons.
insert into dm_policies (key, label, sort_order) values
  ('everyone',       'Anyone',                       10),
  ('verified',       'Verified accounts only',       20),
  ('shared_context', 'People with a shared context', 30),
  ('nobody',         'Nobody',                       40)
on conflict (key) do nothing;

-- §2 also lists "пользователи из разрешённого социального круга". It is deliberately
-- absent: it needs the friends/circle domain of
-- BandKit_User_Friends_And_Personal_Feed_v1_0.md, which has no schema at all yet.
-- Shipping the option now would mean a setting that silently means something other
-- than its name. Add the row when the domain exists — nothing else here changes.

alter table users add column if not exists dm_policy text not null default 'everyone'
  references dm_policies(key);

-- One request per canonical dialogue, so room_id is the key. That is what makes §2's
-- "отклонение не должно автоматически создавать новый запрос при следующем обращении"
-- structural rather than a rule the code has to remember: a rejected row stays, and
-- there is nowhere to put a second one.
create table if not exists conversation_requests (
  room_id uuid primary key references chat_rooms(id) on delete cascade,
  requester_user_id uuid not null references users(id) on delete cascade,
  recipient_user_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  starter_message_id uuid references chat_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz,
  check (requester_user_id <> recipient_user_id),
  check ((status = 'pending') = (decided_at is null))
);

create index if not exists conversation_requests_pending_recipient_idx
  on conversation_requests (recipient_user_id)
  where status = 'pending';

create trigger conversation_requests_set_updated_at
before update on conversation_requests
for each row execute function set_updated_at();
