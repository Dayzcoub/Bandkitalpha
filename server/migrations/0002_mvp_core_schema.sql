create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  handle text unique,
  email text unique,
  phone text,
  status text not null default 'active' check (status in ('registered', 'verified', 'active', 'read_only', 'restricted', 'blocked', 'deactivated', 'deleted', 'anonymized')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users(id) on delete set null,
  type text not null check (type in ('band', 'solo_artist', 'orchestra', 'project', 'organization', 'studio', 'venue', 'agency', 'other')),
  name text not null,
  slug text unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived', 'deleted', 'anonymized')),
  visibility text not null default 'private' check (visibility in ('private', 'members', 'registered', 'public')),
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger entities_set_updated_at
before update on entities
for each row execute function set_updated_at();

create table if not exists entity_memberships (
  entity_id uuid not null references entities(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'manager', 'member', 'guest')),
  status text not null default 'active' check (status in ('invited', 'active', 'former', 'removed', 'left')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_id, user_id)
);

create trigger entity_memberships_set_updated_at
before update on entity_memberships
for each row execute function set_updated_at();

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references entities(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'recruiting', 'confirmed', 'in_progress', 'completed', 'archived', 'cancelled', 'rescheduled')),
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger events_set_updated_at
before update on events
for each row execute function set_updated_at();

create table if not exists event_participants (
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'participant' check (role in ('owner', 'organizer', 'manager', 'participant', 'crew', 'guest')),
  status text not null default 'invited' check (status in ('invited', 'applied', 'confirmed', 'declined', 'removed', 'completed', 'replaced', 'no_show', 'late_cancel')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create trigger event_participants_set_updated_at
before update on event_participants
for each row execute function set_updated_at();

create table if not exists chat_rooms (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'free_group', 'entity', 'event', 'safety', 'admin')),
  title text,
  entity_id uuid references entities(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'read_only', 'archived', 'hidden')),
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type = 'entity' and entity_id is not null)
    or (type = 'event' and event_id is not null)
    or (type not in ('entity', 'event'))
  )
);

create trigger chat_rooms_set_updated_at
before update on chat_rooms
for each row execute function set_updated_at();

create table if not exists chat_room_members (
  room_id uuid not null references chat_rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'manager', 'member', 'guest')),
  status text not null default 'active' check (status in ('active', 'left', 'removed', 'read_only', 'hidden')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create trigger chat_room_members_set_updated_at
before update on chat_room_members
for each row execute function set_updated_at();

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references chat_rooms(id) on delete cascade,
  author_user_id uuid references users(id) on delete set null,
  kind text not null default 'user' check (kind in ('user', 'system', 'important')),
  body text not null default '',
  reply_to_message_id uuid references chat_messages(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'edited', 'deleted', 'hidden')),
  is_pinned boolean not null default false,
  requires_ack boolean not null default false,
  moderation_hold boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists message_acknowledgements (
  message_id uuid not null references chat_messages(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('user', 'entity', 'event')),
  entity_id uuid references entities(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  owner_user_id uuid references users(id) on delete set null,
  title text not null,
  document_type text not null default 'other' check (document_type in ('rider', 'setlist', 'offer', 'contract_draft', 'receipt', 'schedule', 'technical_plan', 'booking_file', 'other')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived', 'revoked', 'deleted')),
  storage_key text,
  mime_type text,
  size_bytes bigint,
  version_number integer not null default 1,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (parent_type = 'entity' and entity_id is not null)
    or (parent_type = 'event' and event_id is not null)
    or (parent_type = 'user' and owner_user_id is not null)
  )
);

create trigger documents_set_updated_at
before update on documents
for each row execute function set_updated_at();

create table if not exists document_permissions (
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  permission text not null check (permission in ('view', 'edit', 'export', 'manage', 'audit')),
  granted_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (document_id, user_id, permission)
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  reason text,
  entity_id uuid references entities(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  document_id uuid references documents(id) on delete set null,
  room_id uuid references chat_rooms(id) on delete set null,
  message_id uuid references chat_messages(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_entities_owner on entities(owner_user_id);
create index if not exists idx_entity_memberships_user on entity_memberships(user_id);
create index if not exists idx_events_entity on events(entity_id);
create index if not exists idx_event_participants_user on event_participants(user_id);
create index if not exists idx_chat_rooms_entity on chat_rooms(entity_id);
create index if not exists idx_chat_rooms_event on chat_rooms(event_id);
create index if not exists idx_chat_messages_room_created on chat_messages(room_id, created_at);
create index if not exists idx_documents_entity on documents(entity_id);
create index if not exists idx_documents_event on documents(event_id);
create index if not exists idx_audit_events_created on audit_events(created_at);
