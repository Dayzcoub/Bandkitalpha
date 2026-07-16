-- Canonical conversation model.
-- Source of truth: docs/handoff/spec/BandKit_Chat_and_Messaging_Security_v1.md §1–3.
--
-- The spec allows exactly two classes of conversation and nothing between them:
--   personal — one canonical dialogue per unordered pair of users, owned by nobody
--              else; entity_id is null; exactly two participants;
--   entity   — a chat belonging to exactly one entity (a band, a project, an event,
--              a studio, an organisation).
--
-- The schema could not express either: there was no scope column, and nothing stopped
-- a second dialogue from being created for the same pair. This migration makes the
-- database — not the application — the thing that enforces both.

-- Rooms typed free_group/safety/admin belong to neither class. Mapping them would
-- mean inventing policy the spec does not have, and deleting them would mean losing
-- messages, so refuse and let a human decide. Nothing on staging matches; a local
-- dev box may.
do $$
declare stray_count int; stray_list text;
begin
  select count(*), string_agg(format('%s (%s, %L)', id, type, coalesce(title, '')), '; ')
    into stray_count, stray_list
    from chat_rooms where type not in ('direct', 'entity', 'event');
  if stray_count > 0 then
    raise exception 'chat_rooms holds % room(s) with no place in the canonical model: %. Convert or delete them, then re-run.', stray_count, stray_list;
  end if;
end $$;

alter table chat_rooms add column if not exists conversation_scope text;

update chat_rooms
   set conversation_scope = case when type = 'direct' then 'personal' else 'entity' end
 where conversation_scope is null;

-- The canonical pair lives on the room, not only in chat_room_members, so a unique
-- index can enforce "at most one dialogue per pair" — an invariant that cannot be
-- expressed over the many rows of a membership table. Ordering the two ids (a < b)
-- is what makes the pair *unordered*: (A,B) and (B,A) become the same row.
--
-- ON DELETE CASCADE: deleting a user removes their personal dialogues. Today a
-- deleted user instead leaves an orphaned room with one member, which the shape
-- constraint below would reject. Revisit alongside the account deletion/anonymisation
-- rules (BandKit_Account_Data_Privacy_Deletion_Export_Rules_v1_0.md) — entity history
-- must survive account deletion, but a two-party dialogue arguably should not.
alter table chat_rooms add column if not exists personal_user_a uuid references users(id) on delete cascade;
alter table chat_rooms add column if not exists personal_user_b uuid references users(id) on delete cascade;

-- Note: there is no min(uuid)/max(uuid) aggregate in PostgreSQL, hence array_agg.
update chat_rooms r
   set personal_user_a = p.pair[1],
       personal_user_b = p.pair[2]
  from (
    select room_id, array_agg(user_id order by user_id) as pair
      from chat_room_members
     group by room_id
    having count(*) = 2
  ) p
 where p.room_id = r.id
   and r.conversation_scope = 'personal'
   and r.personal_user_a is null;

-- A personal room without exactly two members cannot be expressed in the model.
do $$
declare broken_count int;
begin
  select count(*) into broken_count
    from chat_rooms
   where conversation_scope = 'personal'
     and (personal_user_a is null or personal_user_b is null);
  if broken_count > 0 then
    raise exception '% personal room(s) do not have exactly two members; resolve them, then re-run.', broken_count;
  end if;
end $$;

-- Duplicates predating this migration would violate the unique index below. Surface
-- them rather than let the index fail with a less useful message: merging two
-- dialogues means moving messages, which is a decision, not a migration step.
do $$
declare dupe_count int;
begin
  select count(*) into dupe_count
    from (select personal_user_a, personal_user_b
            from chat_rooms
           where conversation_scope = 'personal'
           group by 1, 2 having count(*) > 1) d;
  if dupe_count > 0 then
    raise exception '% user pair(s) already have more than one personal dialogue; merge them, then re-run.', dupe_count;
  end if;
end $$;

alter table chat_rooms alter column conversation_scope set not null;

-- Only the two classes exist. free_group/safety/admin were speculative and never
-- carried real data.
alter table chat_rooms drop constraint if exists chat_rooms_type_check;
alter table chat_rooms add constraint chat_rooms_type_check
  check (type in ('direct', 'entity', 'event'));

-- The invariants from the spec, in one place:
--   personal — no entity, no event, a canonical ordered pair;
--   entity   — an entity or event reference, and no pair.
-- Scope and type cannot disagree.
alter table chat_rooms drop constraint if exists chat_rooms_conversation_shape;
alter table chat_rooms add constraint chat_rooms_conversation_shape check (
  (
    conversation_scope = 'personal'
    and type = 'direct'
    and entity_id is null
    and event_id is null
    and personal_user_a is not null
    and personal_user_b is not null
    and personal_user_a < personal_user_b
  )
  or (
    conversation_scope = 'entity'
    and type in ('entity', 'event')
    and (entity_id is not null or event_id is not null)
    and personal_user_a is null
    and personal_user_b is null
  )
);

-- "не более одного канонического личного диалога" (spec §2), enforced.
create unique index if not exists chat_rooms_personal_pair_uidx
  on chat_rooms (personal_user_a, personal_user_b)
  where conversation_scope = 'personal';

create index if not exists chat_rooms_personal_user_a_idx on chat_rooms (personal_user_a) where conversation_scope = 'personal';
create index if not exists chat_rooms_personal_user_b_idx on chat_rooms (personal_user_b) where conversation_scope = 'personal';
