-- Account lifecycle: one axis per column, and termination that says why.
-- Решение владельца 2026-07-16 (см. Account_Data_Privacy_Deletion_Export_Rules §Account states).
--
-- `users.status` было девять значений и ноль описанных переходов. Переходы никто не
-- описал не по забывчивости: в одной колонке жили ТРИ независимые машины —
--
--   онбординг : registered → active        (пишется регистрацией и verify)
--   санкции   : read_only, restricted, blocked  (читается SANCTIONED_STATUSES, не пишется никем)
--   уход      : deactivated, deleted, anonymized (почти не читается, не пишется)
--
-- Три машины в одном поле не имеют общей диаграммы состояний — поэтому её и нельзя было
-- нарисовать. Разводим по осям.
--
--   status         — только жизненный цикл: active | deactivated | anonymized
--   email_verified — подтверждение (boolean, уже существовал; `registered` его дублировал)
--   sanction       — санкция: null | read_only | restricted | blocked
--
-- Хард-делита строки `users` нет: он невозможен архитектурно (личная Party обязана иметь
-- user_id, а репутация держит Party через RESTRICT) и не нужен продуктово — спека требует
-- сохранять историю с анонимизацией автора. `deleted` как статус удаляется: терминальное
-- состояние одно — `anonymized`.

-- 1. Санкции — своя ось. Сегодня их не пишет никто, поэтому бэкфилл пуст,
--    но перенос ниже написан на случай данных в других окружениях.
alter table users add column if not exists sanction text
  check (sanction in ('read_only', 'restricted', 'blocked'));

comment on column users.sanction is
  'Moderation sanction, independent of lifecycle status. NULL = no sanction.';

-- 2. Причина ухода — отдельным полем, а не статусом. Статус описывает состояние, а не
--    причину, по которой аккаунт в него попал; иначе каждый новый повод порождал бы
--    новый статус.
alter table users add column if not exists account_termination_reason text
  check (account_termination_reason in ('SELF_REQUEST', 'MODERATION', 'LEGAL', 'SECURITY', 'OTHER'));
alter table users add column if not exists terminated_at timestamptz;
alter table users add column if not exists terminated_by uuid references users(id) on delete set null;

comment on column users.account_termination_reason is
  'Why the account was terminated. Never encoded in status.';

-- 3. Бэкфилл: свести старые значения к трём осям.
update users set sanction = status, status = 'active'
 where status in ('read_only', 'restricted', 'blocked');

-- `registered` дублировал email_verified = false, `verified` — email_verified = true.
update users set status = 'active' where status in ('registered', 'verified');

-- `deleted` и `anonymized` означали одно и то же; терминальное состояние одно.
update users
   set status = 'anonymized',
       terminated_at = coalesce(terminated_at, updated_at, now()),
       account_termination_reason = coalesce(account_termination_reason, 'OTHER')
 where status = 'deleted';

-- 4. status — только жизненный цикл.
alter table users drop constraint if exists users_status_check;
alter table users add constraint users_status_check
  check (status in ('active', 'deactivated', 'anonymized'));

-- 5. Терминальные поля существуют тогда и только тогда, когда аккаунт терминален.
--    Это не косметика: без констрейнта появится «анонимизирован, но неизвестно почему»,
--    что и есть та дыра, ради которой заведено поле причины.
alter table users drop constraint if exists users_termination_shape;
alter table users add constraint users_termination_shape check (
  (status = 'anonymized')
  = (terminated_at is not null and account_termination_reason is not null)
);

-- 6. Баг: единственная пара NOT NULL + ON DELETE SET NULL во всей базе. Внешний ключ
--    обязан записать NULL в колонку, которая NULL запрещает, — поэтому любого, кто подал
--    хоть одну жалобу, нельзя было удалить физически даже технической процедурой.
--    Остальной 21 SET NULL-столбец нулевой; намерение однозначно — сохранить кейс,
--    обезличив заявителя.
alter table reports alter column reporter_user_id drop not null;

create index if not exists users_sanction_idx on users (sanction) where sanction is not null;
