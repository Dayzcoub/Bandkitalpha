-- Foundation slice 4c — event slots + engagements (Foundation Domain Model v1
-- §2.4/§2.5, §6 step 4). Additive: introduces the requirement side of an event
-- (abstract role/resource slots) and the single transactional lifecycle engine
-- (Engagement) that every kind of work runs through — gig, session, shoot,
-- gear rental, venue hold. Existing events/event_participants are untouched;
-- event_participants stays as the current MVP shell until a later slice migrates
-- it onto engagements.

-- Engagement lifecycle as a reference table (CLAUDE.md: statuses are lookups,
-- not enums). One status machine for all work types. `is_terminal` marks states
-- that close the engagement.
create table if not exists engagement_statuses (
  key text primary key,
  label text not null,
  sort_order int not null default 100,
  is_terminal boolean not null default false
);

insert into engagement_statuses (key, label, sort_order, is_terminal) values
  ('draft',       'Draft',        10,  false),
  ('proposed',    'Proposed',     20,  false),
  ('accepted',    'Accepted',     30,  false),
  ('confirmed',   'Confirmed',    40,  false),
  ('in_progress', 'In Progress',  50,  false),
  ('in_delivery', 'In Delivery',  60,  false),
  ('completed',   'Completed',    70,  true),
  ('declined',    'Declined',     80,  true),
  ('cancelled',   'Cancelled',    90,  true),
  ('expired',     'Expired',      95,  true),
  ('disputed',    'Disputed',    100,  false)
on conflict (key) do nothing;

-- Event slot — an abstract requirement on an event: "need {photographer x1}" or
-- "need {lighting_gear x1}". A slot requires either a party (by profession) or a
-- resource, never both. Resource taxonomy arrives in slice 4d; `resource_type`
-- is a seam here. `terms` holds conditional deal terms as JSONB (extension layer,
-- §2.x) so verticals don't force schema changes.
create table if not exists event_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  requirement text not null default 'party' check (requirement in ('party', 'resource')),
  profession_key text references professions(key) on delete restrict,
  specialization_key text,
  resource_type text,
  count int not null default 1 check (count > 0),
  terms jsonb,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A party slot names a profession; a resource slot names a resource type.
  constraint event_slots_requirement_shape check (
    (requirement = 'party'    and profession_key is not null and resource_type is null) or
    (requirement = 'resource' and resource_type is not null and profession_key is null and specialization_key is null)
  ),
  -- Chosen specialization must belong to the chosen profession (skipped when
  -- specialization_key is null via MATCH SIMPLE).
  constraint event_slots_spec_matches_profession
    foreign key (specialization_key, profession_key)
    references specializations (key, profession_key) on delete restrict
);

drop trigger if exists event_slots_set_updated_at on event_slots;
create trigger event_slots_set_updated_at
before update on event_slots
for each row execute function set_updated_at();

create index if not exists event_slots_event_idx on event_slots (event_id);
create index if not exists event_slots_profession_idx on event_slots (profession_key);

-- Engagement — "a party took a slot on terms". The one transactional primitive:
-- symmetric by direction, decoupled completion (an event can be over while a
-- photo engagement is still in_delivery). A slot is optional so recursive cases
-- ("client hired the organizer") need no special-case. resource_reservations and
-- assigned_members are seams for later slices.
create table if not exists engagements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  slot_id uuid references event_slots(id) on delete set null,
  counterparty_party_id uuid not null references parties(id) on delete restrict,
  status_key text not null default 'draft' references engagement_statuses(key) on delete restrict,
  terms jsonb,
  completed_at timestamptz,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists engagements_set_updated_at on engagements;
create trigger engagements_set_updated_at
before update on engagements
for each row execute function set_updated_at();

create index if not exists engagements_event_idx on engagements (event_id);
create index if not exists engagements_slot_idx on engagements (slot_id);
create index if not exists engagements_counterparty_idx on engagements (counterparty_party_id);
create index if not exists engagements_status_idx on engagements (status_key);
