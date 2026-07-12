-- Phase 4 slice 4 — reliability dispute flow (Reputation and Reliability Rules
-- v1.0, "Valid reasons and disputes" + anti-abuse). The spec makes a dispute flow
-- mandatory for serious negative reliability events: a record must be able to be
-- contested by its subject and reviewed, and a disputed record must not count as
-- final negative reputation until resolved. Slice 1 shipped a `disputed` boolean
-- seam; this slice gives it a real lifecycle.

-- Dispute lifecycle as a reference table (CLAUDE.md: statuses are lookups). A row
-- with dispute_state = null has no dispute. `open` is non-terminal; a resolution
-- is either `upheld` (the record stands and resumes counting) or `retracted`
-- (the record is withdrawn and excluded from reputation).
create table if not exists reliability_dispute_states (
  key text primary key,
  label text not null,
  sort_order int not null default 100,
  is_terminal boolean not null default false
);

insert into reliability_dispute_states (key, label, sort_order, is_terminal) values
  ('open',      'Open',      10, false),
  ('upheld',    'Upheld',    20, true),
  ('retracted', 'Retracted', 30, true)
on conflict (key) do nothing;

-- Dispute context lives on the reliability record (at most one dispute per
-- record). The subject opens it (reason + statement); the organizer side or a
-- moderator resolves it. Timestamps and actor ids preserve the audit trail the
-- spec asks a dispute to keep.
alter table reliability_events
  add column if not exists dispute_state text references reliability_dispute_states(key) on delete restrict,
  add column if not exists dispute_opened_by uuid references users(id) on delete set null,
  add column if not exists dispute_reason_key text references reliability_reasons(key) on delete restrict,
  add column if not exists dispute_note text,
  add column if not exists dispute_opened_at timestamptz,
  add column if not exists dispute_resolved_by uuid references users(id) on delete set null,
  add column if not exists dispute_resolution text,
  add column if not exists dispute_resolved_at timestamptz;

create index if not exists reliability_events_dispute_state_idx on reliability_events (dispute_state);
