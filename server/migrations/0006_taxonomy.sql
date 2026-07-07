-- Foundation slice 4a — reference tables over enums (Foundation Domain Model
-- v1 §5, load-bearing fix #1). Additive: creates the taxonomy that encodes the
-- event-industry scope. Existing entities.type/enum columns are untouched here;
-- wiring FKs to these tables is a later slice.

-- Entity/workspace types (was a check-enum on entities.type).
create table if not exists entity_types (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

insert into entity_types (key, label, sort_order) values
  ('band', 'Band / Project', 10),
  ('solo_artist', 'Solo Artist', 20),
  ('orchestra', 'Orchestra / Ensemble', 30),
  ('project', 'Project', 40),
  ('studio', 'Recording Studio', 50),
  ('venue', 'Venue', 60),
  ('agency', 'Agency / Booking', 70),
  ('production_company', 'Production Company', 80),
  ('rental_provider', 'Equipment Rental', 90),
  ('organization', 'Organization', 100),
  ('school', 'School / Academy', 110),
  ('other', 'Other', 900)
on conflict (key) do nothing;

-- Professions (party <-> profession is many-to-many; wired in slice 4b).
create table if not exists professions (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

insert into professions (key, label, sort_order) values
  ('musician', 'Musician', 10),
  ('vocalist', 'Vocalist', 20),
  ('session_musician', 'Session Musician', 30),
  ('composer', 'Composer / Arranger', 40),
  ('sound_engineer', 'Sound Engineer', 50),
  ('light_engineer', 'Lighting Engineer', 60),
  ('stage_manager', 'Stage Manager', 70),
  ('backline_tech', 'Backline Tech', 80),
  ('rigger', 'Rigger', 90),
  ('photographer', 'Photographer', 100),
  ('videographer', 'Videographer', 110),
  ('dj', 'DJ', 120),
  ('host_mc', 'Host / MC', 130),
  ('event_organizer', 'Event Organizer', 140),
  ('booking_manager', 'Booking / Manager', 150),
  ('production_company', 'Production Company', 160),
  ('rental_provider', 'Equipment Rental', 170),
  ('other', 'Other', 900)
on conflict (key) do nothing;

-- Specializations under a profession (extensible; seeded with examples).
create table if not exists specializations (
  key text primary key,
  profession_key text not null references professions(key) on delete cascade,
  label text not null,
  sort_order int not null default 100
);

insert into specializations (key, profession_key, label, sort_order) values
  ('musician_drummer', 'musician', 'Drummer', 10),
  ('musician_guitarist', 'musician', 'Guitarist', 20),
  ('musician_bassist', 'musician', 'Bassist', 30),
  ('musician_keyboardist', 'musician', 'Keyboardist', 40),
  ('musician_percussionist', 'musician', 'Percussionist', 50),
  ('sound_engineer_foh', 'sound_engineer', 'Front of House', 10),
  ('sound_engineer_monitor', 'sound_engineer', 'Monitor Engineer', 20),
  ('sound_engineer_studio', 'sound_engineer', 'Studio Engineer', 30),
  ('photographer_event', 'photographer', 'Event Photographer', 10),
  ('photographer_portrait', 'photographer', 'Portrait Photographer', 20),
  ('videographer_event', 'videographer', 'Event Videographer', 10),
  ('videographer_music', 'videographer', 'Music Video', 20),
  ('dj_club', 'dj', 'Club DJ', 10),
  ('dj_wedding', 'dj', 'Wedding DJ', 20)
on conflict (key) do nothing;

create index if not exists specializations_profession_idx on specializations (profession_key);
