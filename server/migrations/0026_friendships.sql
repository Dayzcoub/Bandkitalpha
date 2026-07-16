-- Friendship: the personal social graph.
-- Источник: `BandKit_User_Friends_And_Personal_Feed_v1_0` (§Relationship states,
-- §Friend request flow, §Future backend model draft).
--
-- Спека называет свою модель «Future backend model draft» и «Suggested tables» — то есть
-- эскиз, а не обязательство. Здесь два отклонения от него, оба по причинам, которые
-- проект уже оплатил.
--
-- ОТКЛОНЕНИЕ 1. В черновике `status` включает `blocked`. Блокировка — не состояние
-- дружбы, а отдельная ось:
--   * она асимметрична (A заблокировал B ≠ B заблокировал A), а строка описывает пару;
--   * она ортогональна (можно заблокировать друга — и что тогда с фактом дружбы?);
--   * разблокировка обязана возвращать прежнее состояние, а одна колонка его стирает.
-- Ровно та болезнь, которую 0023 лечил у `users.status`: несколько машин в одном поле.
-- Блокировка — своя таблица и обязательный chat-срез 3, не здесь.
--
-- ОТКЛОНЕНИЕ 2. В черновике `declined`, `cancelled`, `removed` — три статуса. Это одно
-- состояние («не друзья») с тремя причинами. Решение владельца от 2026-07-16: «статус
-- описывает состояние, а не причину». Поэтому `ended` + `ended_reason`.
--
-- Пара канонизирована так же, как личный диалог (0020/0021): дружба — свойство пары, а
-- не того, кто нажал кнопку. Это даёт бесплатно то, чего в черновике нет: встречный
-- запрос B→A при живом A→B не создаёт второй строки, а попадает в ту же.

create table if not exists user_friendships (
  user_low_id uuid not null references users(id) on delete cascade,
  user_high_id uuid not null references users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'ended')),
  -- Направление: пара симметрична, просьба — нет.
  requested_by_user_id uuid not null references users(id) on delete cascade,
  ended_reason text check (ended_reason in ('declined', 'cancelled', 'removed')),
  source text check (source in ('profile', 'search', 'event', 'project', 'chat', 'recommendation')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  ended_at timestamptz,
  primary key (user_low_id, user_high_id),
  -- Упорядочивание — то, что делает пару неупорядоченной: (A,B) и (B,A) это одна строка.
  constraint user_friendships_pair_ordered check (user_low_id < user_high_id),
  -- Причина существует тогда и только тогда, когда отношение закончилось.
  constraint user_friendships_ended_shape check ((status = 'ended') = (ended_reason is not null)),
  constraint user_friendships_accepted_shape check ((status = 'accepted') = (accepted_at is not null))
);

create trigger user_friendships_set_updated_at
before update on user_friendships
for each row execute function set_updated_at();

-- «Кто мои друзья» и «кто меня просит» — оба направления, оба горячие.
create index if not exists user_friendships_low_idx on user_friendships (user_low_id) where status = 'accepted';
create index if not exists user_friendships_high_idx on user_friendships (user_high_id) where status = 'accepted';
create index if not exists user_friendships_pending_idx on user_friendships (requested_by_user_id) where status = 'pending';

-- `circle` появляется в политике входящих только теперь, когда за ним есть граф.
-- До 0026 его сознательно не было: настройка, обещающая социальный круг и означающая
-- что-то другое, хуже отсутствующей (1.17.0).
insert into dm_policies (key, label, sort_order) values
  ('circle', 'Friends only', 25)
on conflict (key) do nothing;

insert into notification_types (key, label, sort_order) values
  ('friend_request',  'New friend request', 5),
  ('friend_accepted', 'Friend request accepted', 6)
on conflict (key) do nothing;
