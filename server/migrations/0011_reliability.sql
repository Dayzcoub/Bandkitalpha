-- Phase 4 slice 1 — reliability event records (Reputation and Reliability Rules
-- v1.0). This is the "lightweight reliability-ready structure" the MVP scope
-- asks for: structured records of what actually happened around a verified
-- collaboration (an engagement), NOT a public rating number. Deliberately out of
-- scope here (later slices): public rating algorithm, automated punishment,
-- party-level reputation summary, full dispute state machine. We store the
-- dispute-ready audit context now and expose ratings only once anti-abuse is in.

-- Reliability event catalogue as a reference table (CLAUDE.md: types are lookups,
-- not enums). `polarity` lets a later scoring slice weight signals without the
-- write path hardcoding which types are "bad" — MVP just records them.
create table if not exists reliability_event_types (
  key text primary key,
  label text not null,
  polarity text not null default 'neutral' check (polarity in ('positive', 'neutral', 'negative')),
  sort_order int not null default 100
);

-- Seeded from the spec's "Reliability events" and "Positive reliability" lists.
insert into reliability_event_types (key, label, polarity, sort_order) values
  ('completed_participation',   'Completed participation',    'positive', 10),
  ('confirmed_attendance',      'Confirmed attendance',       'positive', 20),
  ('on_time_acknowledgement',   'On-time acknowledgement',    'positive', 30),
  ('replacement_provided',      'Replacement provided',       'positive', 40),
  ('early_decline',             'Early decline',              'neutral',  50),
  ('organizer_cancellation',    'Organizer cancellation',     'neutral',  60),
  ('event_reschedule',          'Event reschedule',           'neutral',  70),
  ('dispute_opened',            'Dispute opened',             'neutral',  80),
  ('dispute_resolved',          'Dispute resolved',           'neutral',  90),
  ('late_cancellation',         'Late cancellation',          'negative', 100),
  ('no_show',                   'No-show',                    'negative', 110),
  ('moderation_confirmed_issue','Moderation-confirmed issue', 'negative', 120)
on conflict (key) do nothing;

-- Valid reasons as a controlled vocabulary (spec "Valid reasons and disputes").
-- A recorded negative event can carry a reason that a later scoring/dispute slice
-- uses to reduce or remove its weight — the spec's fairness requirement.
create table if not exists reliability_reasons (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

insert into reliability_reasons (key, label, sort_order) values
  ('illness',                     'Illness',                       10),
  ('emergency',                   'Emergency',                     20),
  ('force_majeure',               'Force majeure',                 30),
  ('organizer_changed_conditions','Organizer changed conditions',  40),
  ('event_rescheduled',           'Event rescheduled',             50),
  ('unsafe_conditions',           'Unsafe conditions',             60),
  ('documented_conflict',         'Documented conflict',           70),
  ('other',                       'Other (accepted by policy)',    80)
on conflict (key) do nothing;

-- Reliability event — a structured record about a party, always anchored to an
-- engagement (the spec's "verified collaboration context": feedback/records only
-- exist where real work was engaged). subject_party_id is denormalised from the
-- engagement's counterparty so a future reputation summary can query a party's
-- history without walking every event; event_id is denormalised for scoping and
-- audit. `visibility` starts conservative ('organizers') per the spec's layered,
-- anti-shaming default — public exposure is a later, anti-abuse-gated slice.
-- `disputed` is the dispute-ready seam: a negative record can be flagged so it is
-- "not final public negative reputation until reviewed".
create table if not exists reliability_events (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  subject_party_id uuid not null references parties(id) on delete restrict,
  event_id uuid not null references events(id) on delete cascade,
  type_key text not null references reliability_event_types(key) on delete restrict,
  reason_key text references reliability_reasons(key) on delete restrict,
  visibility text not null default 'organizers'
    check (visibility in ('organizers', 'collaborators', 'moderation', 'hidden')),
  disputed boolean not null default false,
  note text,
  metadata jsonb,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists reliability_events_set_updated_at on reliability_events;
create trigger reliability_events_set_updated_at
before update on reliability_events
for each row execute function set_updated_at();

create index if not exists reliability_events_engagement_idx on reliability_events (engagement_id);
create index if not exists reliability_events_subject_idx on reliability_events (subject_party_id);
create index if not exists reliability_events_event_idx on reliability_events (event_id);
create index if not exists reliability_events_type_idx on reliability_events (type_key);
