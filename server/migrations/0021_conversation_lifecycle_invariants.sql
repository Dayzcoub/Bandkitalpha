-- Align the canonical pair with the naming the spec mandates, and add the one
-- structural invariant it adds on top of 0020.
--
-- Source of truth: docs/handoff/spec/BandKit_Conversation_Lifecycle_and_Abuse_Controls_v1.md
-- (arrived after 0020 shipped; it supplements Chat_and_Messaging_Security_v1).
--
-- §1 names the invariant explicitly:
--     user_low_id  = min(user_a_id, user_b_id)
--     user_high_id = max(user_a_id, user_b_id)
--     UNIQUE(user_low_id, user_high_id)
--     CHECK(user_low_id <> user_high_id)
-- 0020 built exactly this shape but called the columns personal_user_a/b. The
-- semantics were already right; only the vocabulary was ours instead of the spec's.
-- Renaming now is free — nothing reads these columns yet and staging holds no
-- personal dialogue. `user_low_id < user_high_id` is kept rather than `<>`: it is
-- strictly stronger, implies the spec's CHECK, and is what makes the pair unordered.

alter table chat_rooms rename column personal_user_a to user_low_id;
alter table chat_rooms rename column personal_user_b to user_high_id;

alter index chat_rooms_personal_pair_uidx rename to chat_rooms_user_pair_uidx;
alter index chat_rooms_personal_user_a_idx rename to chat_rooms_user_low_id_idx;
alter index chat_rooms_personal_user_b_idx rename to chat_rooms_user_high_id_idx;

-- A column rename rewrites the constraint definition automatically; recreate it
-- anyway so the migration states the invariant in full rather than leaving a reader
-- to reconstruct it from two files.
alter table chat_rooms drop constraint if exists chat_rooms_conversation_shape;
alter table chat_rooms add constraint chat_rooms_conversation_shape check (
  (
    conversation_scope = 'personal'
    and type = 'direct'
    and entity_id is null
    and event_id is null
    and user_low_id is not null
    and user_high_id is not null
    and user_low_id < user_high_id
  )
  or (
    conversation_scope = 'entity'
    and type in ('entity', 'event')
    and (entity_id is not null or event_id is not null)
    and user_low_id is null
    and user_high_id is null
  )
);

-- §4: "В MVP у каждой сущности допускается ровно один основной групповой чат."
-- Sub-chats, role channels and entity DMs are forbidden until there is an ACL spec
-- and a migration for them, so the database refuses a second one now rather than
-- letting the product grow into a shape §4 bans. Two indexes because a chat owned by
-- an event and a chat owned by an entity are different conversations (§3 of
-- Chat_and_Messaging_Security_v1) even when the members coincide.
create unique index if not exists chat_rooms_one_entity_chat_uidx
  on chat_rooms (entity_id)
  where conversation_scope = 'entity' and type = 'entity';

create unique index if not exists chat_rooms_one_event_chat_uidx
  on chat_rooms (event_id)
  where conversation_scope = 'entity' and type = 'event';
