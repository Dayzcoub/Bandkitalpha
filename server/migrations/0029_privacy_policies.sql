-- Приватность: сколько осей в MVP и где они хранятся.
-- Решение владельца F2 (Architecture Freeze, `Architecture_Decisions_v1 §7`,
-- обоснование §3.2). Модель целиком — `BandKit_Privacy_Model_v1`.
--
-- ПОЧЕМУ ВООБЩЕ. `dm_policy` — колонка на `users` с FK на справочник `dm_policies`. Для
-- ОДНОЙ оси это правильная форма, и претензий к 0022 нет. Но в форме «одна ось = одна
-- колонка» каждая следующая ось продукта стоит миграции, релиза и правки каждого места,
-- где читают `users`. Пока пользователей ноль, переделка бесплатна; после первого живого
-- она станет миграцией данных, а не миграцией схемы. Это единственная причина делать её
-- сегодня — F2 ничего не блокирует, и именно поэтому его легко не сделать.
--
-- ДВЕ ОСИ, НЕ ВОСЕМЬ. `Friends §Privacy settings` называет восемь. Они написаны против
-- продукта, которого нет: в роутере нет ни одного маршрута профиля пользователя, личных
-- постов нет (пост принадлежит сущности), подписка — на сущность, а не на человека,
-- `last_seen` нет вовсе (realtime вне MVP). «Кто видит мой профиль», «кто видит список
-- друзей», «кто видит онлайн», «дефолт видимости постов» — настройки, которым сегодня
-- нечего запрещать.
--
-- Правило, по которому ось попадает в MVP: **ось существует, если есть поверхность,
-- которая её применяет.** Это не новое правило — это ровно то, что 0022 уже сделал с
-- `circle`, отказавшись сеять значение, за которым не было графа, и что 0026 исправил,
-- когда граф появился («Shipping the option now would mean a setting that silently means
-- something other than its name»). Здесь то же правило поднято с уровня значения на
-- уровень оси.
--
-- Поверхности есть у двух:
--   dm             — `POST /conversations/personal`. Живёт с 0022, переезжает сюда.
--   friend_request — `POST /me/friends/:userId`. Маршрут есть с 0026, политики у него нет
--                    никакой: заявку в друзья сегодня может прислать кто угодно кому
--                    угодно. Это не «новая фича», а незакрытая половина 0026.
--
-- ФОРМА: ТАБЛИЦА ПОЛИТИК, И ПОЧЕМУ ОНА НЕ GOD-ОБЪЕКТ (D8).
-- Ось и политика ортогональны: **ось говорит, какая дверь; политика говорит, кто проходит
-- через любую дверь.** Словарь политик описывает отношение «актор ↔ субъект»
-- (незнакомец / верифицированный / есть общий контекст / друг / никто) и ничего не знает
-- об объекте за дверью. Поэтому вычисление «удовлетворяет ли актор политике» общее, а
-- смысл каждой оси остаётся в её домене (§3.2: механизм общий, смысл — домена). Единого
-- домена Privacy здесь не заводится: `dm` принадлежит Communication, `friend_request` —
-- Friends. Общая только эта таблица.

-- Ось существует ⟺ у неё есть варианты. Отдельная таблица `privacy_axes` была бы вторым
-- описанием того же и, хуже того, циклическим FK: ось ссылается на свой дефолт, дефолт —
-- на ось.
create table if not exists privacy_axis_options (
  axis text not null,
  policy text not null,
  label text not null,
  sort_order int not null default 100,
  is_default boolean not null default false,
  primary key (axis, policy)
);

-- Ровно один дефолт на ось. «Не больше одного» держит индекс; «не меньше одного» —
-- проверка в конце этой миграции: без дефолта ось не резолвится ни во что, а политика,
-- которая не резолвится, — это отказ в доступе на ровном месте.
create unique index if not exists privacy_axis_single_default
  on privacy_axis_options (axis) where is_default;

-- Ключи стабильны, UI рендерит t('privacy.<axis>.<policy>'); label — англоязычная
-- ops-подпись, как у report reasons и как было у `dm_policies`.
--
-- РАЗНЫЕ СЛОВАРИ У РАЗНЫХ ОСЕЙ — И ЭТО ГЛАВНАЯ ПРИЧИНА, ПОЧЕМУ КЛЮЧ СОСТАВНОЙ.
-- У `friend_request` НЕТ `circle`. «Заявку в друзья могут слать только друзья» — не
-- строгая настройка, а бессмыслица: тот, кто уже в круге, заявку не шлёт. Обычное
-- возражение против generic-таблицы политик — «БД перестаёт знать, какое значение
-- валидно» — снимается составным FK `(axis, policy)`: `circle` для `dm` валиден, для
-- `friend_request` его нельзя записать физически. Это то же самое, что давал FK на
-- `dm_policies`, только с точностью до оси.
insert into privacy_axis_options (axis, policy, label, sort_order, is_default) values
  ('dm',             'everyone',       'Anyone',                       10, true),
  ('dm',             'verified',       'Verified accounts only',       20, false),
  ('dm',             'circle',         'Friends only',                 25, false),
  ('dm',             'shared_context', 'People with a shared context', 30, false),
  ('dm',             'nobody',         'Nobody',                       40, false),

  ('friend_request', 'everyone',       'Anyone',                       10, true),
  ('friend_request', 'verified',       'Verified accounts only',       20, false),
  ('friend_request', 'shared_context', 'People with a shared context', 30, false),
  ('friend_request', 'nobody',         'Nobody',                       40, false)
on conflict (axis, policy) do nothing;

-- Строка — это ОТКЛОНЕНИЕ от дефолта, а не «настройка пользователя». Дефолт живёт в
-- справочнике, в одном месте на ось, а не размазан по строке на каждого пользователя:
-- иначе смена дефолта продукта была бы UPDATE по всей таблице и молча переписала бы
-- осознанный выбор тех, кто выставил то же значение руками.
create table if not exists user_privacy_policies (
  user_id uuid not null references users(id) on delete cascade,
  axis text not null,
  policy text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, axis),
  foreign key (axis, policy) references privacy_axis_options (axis, policy)
);

-- Переезд единственной живой оси. `everyone` не переносится: это дефолт, а строка —
-- отклонение. Пользователей ноль, поэтому строк здесь ожидается ноль, и это не повод не
-- написать перенос: миграция обязана быть верной на данных, а не на их отсутствии.
insert into user_privacy_policies (user_id, axis, policy)
  select id, 'dm', dm_policy
    from users
   where dm_policy is not null and dm_policy <> 'everyone'
on conflict (user_id, axis) do nothing;

-- Старая форма уходит целиком. Оставить колонку «на всякий случай» — значит завести
-- вторую точку истины о том же и гарантировать, что однажды прочитают не ту.
alter table users drop column if exists dm_policy;
drop table if exists dm_policies;

-- «Не меньше одного дефолта на ось» — то, чего не умеет partial unique index.
do $$
declare
  orphan text;
begin
  select axis into orphan
    from privacy_axis_options
   group by axis
  having count(*) filter (where is_default) <> 1
   limit 1;
  if orphan is not null then
    raise exception 'privacy axis % has no single default option', orphan;
  end if;
end;
$$;
