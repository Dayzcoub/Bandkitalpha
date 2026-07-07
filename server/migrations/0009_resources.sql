-- Foundation slice 4d — resources + resource reservations (Foundation Domain
-- Model v1 §2.6, §6 step 5). Additive: the one genuinely new primitive vs the
-- MVP schema. Bookable things (venue spaces, studio rooms, rental gear) belong
-- to a party; booking one is an engagement carrying resource_reservations.

-- Reference lookups (CLAUDE.md: types/statuses are lookups, not enums).
create table if not exists resource_types (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

insert into resource_types (key, label, sort_order) values
  ('space',         'Venue Space',      10),
  ('room',          'Studio Room',      20),
  ('stage',         'Stage',            30),
  ('lighting_gear', 'Lighting Gear',    40),
  ('sound_gear',    'Sound Gear',       50),
  ('backline',      'Backline',         60),
  ('instrument',    'Instrument',       70),
  ('vehicle',       'Vehicle',          80),
  ('other',         'Other',           900)
on conflict (key) do nothing;

create table if not exists resource_statuses (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

insert into resource_statuses (key, label, sort_order) values
  ('active',      'Active',      10),
  ('maintenance', 'Maintenance', 20),
  ('retired',     'Retired',     30)
on conflict (key) do nothing;

-- Reservation lifecycle. `is_active` marks states that hold capacity (so the
-- booking service can ignore released/cancelled rows when checking conflicts).
create table if not exists reservation_statuses (
  key text primary key,
  label text not null,
  sort_order int not null default 100,
  is_active boolean not null default true
);

insert into reservation_statuses (key, label, sort_order, is_active) values
  ('held',      'Held',      10, true),
  ('confirmed', 'Confirmed', 20, true),
  ('released',  'Released',  30, false),
  ('cancelled', 'Cancelled', 40, false)
on conflict (key) do nothing;

-- Resource — a bookable thing owned by a party. `quantity` supports a fungible
-- pool of identical units (e.g. 5 identical mics); unique resources use 1.
-- `attributes` (JSONB) is the extension layer for catalog specifics (§2.x).
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  owner_party_id uuid not null references parties(id) on delete cascade,
  resource_type_key text not null references resource_types(key) on delete restrict,
  status_key text not null default 'active' references resource_statuses(key) on delete restrict,
  name text not null,
  quantity int not null default 1 check (quantity > 0),
  attributes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists resources_set_updated_at on resources;
create trigger resources_set_updated_at
before update on resources
for each row execute function set_updated_at();

create index if not exists resources_owner_idx on resources (owner_party_id);
create index if not exists resources_type_idx on resources (resource_type_key);

-- Resource reservation — a time-boxed hold on a resource, carried by an
-- engagement (booking collapses into engagement, §2.6). `buffer_*_minutes`
-- express setup/teardown padding around the window.
--
-- Double-booking protection is intentionally NOT a hard DB exclusion constraint:
-- fungible pools (quantity > 1) allow legitimate overlapping reservations up to
-- capacity, which a single-row exclusion can't express. Conflict detection lives
-- in the booking service (sum of active overlapping quantities <= resource
-- quantity); the GiST index below makes that overlap query cheap. Seam, not gap.
create extension if not exists btree_gist;

create table if not exists resource_reservations (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  status_key text not null default 'held' references reservation_statuses(key) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  buffer_before_minutes int not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes int not null default 0 check (buffer_after_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_reservations_window check (ends_at > starts_at)
);

drop trigger if exists resource_reservations_set_updated_at on resource_reservations;
create trigger resource_reservations_set_updated_at
before update on resource_reservations
for each row execute function set_updated_at();

create index if not exists resource_reservations_engagement_idx
  on resource_reservations (engagement_id);

-- Overlap-query support for the booking service's conflict check.
create index if not exists resource_reservations_window_idx
  on resource_reservations using gist (resource_id, tstzrange(starts_at, ends_at));
