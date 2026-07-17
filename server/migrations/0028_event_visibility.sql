-- Видимость события — своя ось, а не копия entity.visibility.
-- Решение владельца F1 (Architecture Freeze, `Architecture_Decisions_v1 §7`).
--
-- ПОЧЕМУ ВООБЩЕ. У `entities` видимость есть с `0002`, у `events` не было никакой: кто
-- видит событие, выводилось из членства и участия. Для «своих» это работало, а выразить
-- «этот концерт виден всем» было нечем. «Публичных событий не существует» жило только в
-- чекпоинте 1.15.1 — то есть нигде. Без этой оси невозможны публичная афиша площадки и
-- Marketplace: слот, на который нельзя откликнуться, не найдя его, не предложение.
--
-- ОТКЛОНЕНИЕ ОТ entities.visibility — СОЗНАТЕЛЬНОЕ (D11: не унифицировать разное).
-- У сущностей словарь `private | members | registered | public`. Он сюда не переносится
-- по двум причинам.
--
-- Первая: у события «members» двусмысленно — члены владеющей сущности или участники
-- самого события? Это разные множества, и колонка, которая не может ответить, какое из
-- них имеется в виду, — не ось, а спор.
--
-- Вторая: в `entities` `private` и `members` проходят ОДНУ И ТУ ЖЕ проверку
-- (`PermissionService.canViewEntity`: оба падают в «нужно активное членство»). Четыре
-- значения, три поведения. Копировать этот словарь значило бы копировать различие,
-- которого код не делает.
--
-- Поэтому три значения, каждое со своим поведением:
--   internal   — активный член владеющей сущности ЛИБО участник события. Ровно то, что
--                код делал до сегодня, поэтому это дефолт и миграция ничего не меняет.
--   registered — любой вошедший пользователь.
--   public     — кто угодно, включая анонима.
--
-- РЕШЕНИЕ F1b: СОБЫТИЕ НЕ МОЖЕТ БЫТЬ ВИДНЕЕ СВОЕГО ВЛАДЕЛЬЦА.
-- Список и карточка события отдают `entity_name`. Публичное событие закрытой группы
-- опубликовало бы саму группу — а `Lifecycle §10` запрещает раскрывать название закрытой
-- сущности тому, у кого нет доступа. Это ровно та утечка, вокруг которой проектировали
-- уведомления 1.20.0 (ссылки вместо текста): там её обошли конструкцией, здесь — тоже.
--
-- Инвариант держит база, а не договорённость: проверка межтабличная, поэтому триггер, а
-- не CHECK. Порядок: internal < registered < public — и у событий, и у сущностей
-- (`private`/`members` сущности = `internal` события: обоим нужно активное членство).

alter table events
  add column if not exists visibility text not null default 'internal'
    check (visibility in ('internal', 'registered', 'public'));

-- Числовой ранг обоих словарей. Функция, а не таблица: словари фиксированы кодом
-- (`canViewEvent`, `canViewEntity`), и справочник дал бы вторую точку истины.
create or replace function bandkit_visibility_rank(kind text, value text)
returns int language sql immutable as $$
  select case
    when kind = 'entity' then case value
      when 'private' then 0 when 'members' then 0   -- одна проверка, один ранг
      when 'registered' then 1 when 'public' then 2 else 0 end
    when kind = 'event' then case value
      when 'internal' then 0 when 'registered' then 1 when 'public' then 2 else 0 end
    else 0 end;
$$;

create or replace function bandkit_event_visibility_not_wider()
returns trigger language plpgsql as $$
declare
  owner_visibility text;
begin
  select e.visibility into owner_visibility from entities e where e.id = new.entity_id;
  -- Событие без владельца (entity_id is null) сравнивать не с чем: ограничивает только
  -- собственная ось.
  if owner_visibility is null then
    return new;
  end if;
  if bandkit_visibility_rank('event', new.visibility) > bandkit_visibility_rank('entity', owner_visibility) then
    raise exception
      'event visibility % is wider than its owner entity visibility % (Lifecycle §10: a public event of a closed entity publishes the entity)',
      new.visibility, owner_visibility
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists events_visibility_not_wider on events;
create trigger events_visibility_not_wider
before insert or update of visibility, entity_id on events
for each row execute function bandkit_event_visibility_not_wider();

-- Вторая половина инварианта: закрыть сущность, у которой есть событие шире неё, тоже
-- нельзя. Без этого правило обходится с другой стороны — опубликовать событие, затем
-- закрыть группу, и публичное событие останется висеть на закрытом владельце.
--
-- Отказ, а не каскад: тихо перевести чужие события в `internal` значит снять их с афиши
-- без ведома того, кто их опубликовал. Владелец обязан решить это сам — что именно
-- делать с публичными событиями, — а не узнать постфактум.
create or replace function bandkit_entity_visibility_not_narrower()
returns trigger language plpgsql as $$
declare
  offending int;
begin
  select count(*) into offending
    from events ev
   where ev.entity_id = new.id
     and bandkit_visibility_rank('event', ev.visibility) > bandkit_visibility_rank('entity', new.visibility);
  if offending > 0 then
    raise exception
      'cannot narrow entity visibility to %: % event(s) are more visible than that (Lifecycle §10)',
      new.visibility, offending
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists entities_visibility_not_narrower on entities;
create trigger entities_visibility_not_narrower
before update of visibility on entities
for each row execute function bandkit_entity_visibility_not_narrower();

-- Афиша: «покажи публичные события» — запрос, которого раньше не существовало.
create index if not exists events_visibility_idx on events (visibility, starts_at)
  where visibility in ('registered', 'public');
