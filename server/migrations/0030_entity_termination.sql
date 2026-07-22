-- Терминал сущности — `deleted`. Анонимизации у сущности нет.
-- Решение владельца F3 (Architecture Freeze, `Architecture_Decisions_v1 §7`,
-- обоснование §3.1). Чекпоинт 1.26.0.
--
-- ПОЧЕМУ АНОНИМИЗАЦИЯ СУЩНОСТИ НЕ НУЖНА (D11: не унифицировать разное).
-- `0023` оставил `users` ровно один терминал — `anonymized`. Причина там — персональные
-- данные: строка живёт ради ссылочной целостности, личное вычищается. Перенести вывод на
-- `entities` по симметрии нельзя: у сущности персональных данных в этом смысле нет, а её
-- имя — не её приватность, а несущая конструкция ЧУЖОЙ истории. Вычистив название группы,
-- мы обессмыслим каждое прошлое событие и повесим репутацию контрагентов на безымянный
-- Party. `Platform_Entity_Lifecycle §Deleted/anonymized` требует ровно обратного своим же
-- правилом: «do not destroy other users' legitimate history».
--
-- Поэтому честный терминал сущности — `deleted`: убрана из продукта, строка и имя живы.
--
-- А КАК ЖЕ ИМЯ, СОДЕРЖАЩЕЕ ПД («Иван Петров Photo», solo_artist с именем человека)?
-- Это и есть случай, который в §3.1 «ломает картину», — и при проверке он ломает не
-- решение, а сам инструмент. Стирание данных человека обязано дотянуться до имени
-- сущности, даже если сущность **живёт дальше**: солист удалил аккаунт, его solo_artist
-- продолжает выступать. Терминальный статус тут не поможет физически — сущность не
-- терминируется. Значит нужна не «анонимизация как состояние», а переименование как
-- действие, ортогональное жизненному циклу. Оно и не заводится здесь: свой статус для
-- него — ровно та ошибка, которую D1/D2 запрещают (состояние против причины и действия).
--
-- РАЗВЕДЕНИЕ ОСЕЙ — следствие D1/D2, а не решение (§3.1: «делается в любом случае»).
-- Одна колонка держала две машины: рабочий цикл (draft/active/paused/archived) и уход
-- (deleted/anonymized). У ухода обязаны быть причина, время и инициатор, а не строка в
-- общем статусе — иначе каждый новый повод порождает новый статус.
--
-- ЧЕСТНО О ТОМ, ЧЕГО ЗДЕСЬ НЕТ. `entities.status` сегодня не пишет НИКТО: строка
-- вставляется как 'active' и не обновляется ни одним маршрутом. Ни `paused`, ни
-- `archived`, ни `deleted` недостижимы, и эта миграция их достижимыми не делает — это
-- работа entity-lifecycle среза.
--
-- Почему тогда колонки заводятся сейчас, если правило F2 гласит «не заводить того, чего
-- никто не применяет»? Правило F2 — про НАСТРОЙКИ, которые обещают пользователю защиту и
-- не дают её. Колонка, которую никто не пишет, никому ничего не обещает. Здесь работает
-- обратное соображение: `entities_termination_shape` ниже делает структурно невозможным
-- записать терминал без причины — но только если констрейнт существует РАНЬШЕ того, кто
-- будет писать. Тот же приём, что `0023` применил к `users`, и он работает только заранее.

-- 1. Причина ухода — отдельным полем. На `users` этот столбец зовётся
--    `account_termination_reason`; префикс там избыточен (таблица и так говорит, чей он),
--    и повторять избыточность здесь незачем. Переименовывать `users` — не работа F3.
alter table entities add column if not exists termination_reason text
  check (termination_reason in ('SELF_REQUEST', 'MODERATION', 'LEGAL', 'SECURITY', 'OTHER'));
alter table entities add column if not exists terminated_at timestamptz;
alter table entities add column if not exists terminated_by uuid references users(id) on delete set null;

comment on column entities.termination_reason is
  'Why the entity was removed from the product. Never encoded in status (D1/D2).';

-- 2. Бэкфилл. Строк с `anonymized` не существует — их никто никогда не писал, — но
--    миграция обязана быть верной на данных, а не на их отсутствии.
update entities
   set status = 'deleted',
       terminated_at = coalesce(terminated_at, updated_at, now()),
       termination_reason = coalesce(termination_reason, 'OTHER')
 where status = 'anonymized';

-- 3. Словарь без `anonymized`: значение, которого у сущности не бывает, не должно быть
--    выразимым. Пока оно в CHECK, оно остаётся приглашением его однажды записать.
alter table entities drop constraint if exists entities_status_check;
alter table entities add constraint entities_status_check
  check (status in ('draft', 'active', 'paused', 'archived', 'deleted'));

-- 4. Терминальные поля существуют тогда и только тогда, когда сущность терминальна.
--    `archived` сюда не входит намеренно: из него можно вернуться
--    (`Platform_Entity_Lifecycle §Archived`: «owner/admin can restore if allowed»), а
--    терминал — то, откуда возврата нет. Единственный терминал — `deleted`.
alter table entities drop constraint if exists entities_termination_shape;
alter table entities add constraint entities_termination_shape check (
  (status = 'deleted')
  = (terminated_at is not null and termination_reason is not null)
);
