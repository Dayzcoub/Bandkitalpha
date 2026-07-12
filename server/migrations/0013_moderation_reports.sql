-- Phase 4 moderation domain slice 1 — reports (Platform Moderation and Safety
-- Rules v1.0). MVP scope is the "report-ready data model" + basic action concept
-- + evidence preservation: a user can report a reportable object, the report
-- keeps context/evidence, and staff can triage it. Full dashboard, ML moderation,
-- appeal portal and legal workflow are explicitly out of scope.

-- What can be reported (spec "Reportable objects") as a reference table
-- (CLAUDE.md: types are lookups). object_id in `reports` is polymorphic text so a
-- single table covers every object kind without per-type columns.
create table if not exists report_object_types (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

insert into report_object_types (key, label, sort_order) values
  ('user_profile',     'User profile',            10),
  ('direct_message',   'Direct message',          20),
  ('chat_message',     'Chat message',            30),
  ('post',             'Post',                    40),
  ('comment',          'Comment',                 50),
  ('entity',           'Entity / group / project',60),
  ('event',            'Event',                   70),
  ('document',         'Document / file',         80),
  ('reputation_event', 'Reputation / feedback',   90),
  ('invitation',       'Invitation / application',100),
  ('external_link',    'Suspicious external link',110),
  ('payment_pattern',  'Suspicious payment',      120),
  ('other',            'Other',                   130)
on conflict (key) do nothing;

-- Report reasons (spec "Report reasons") as a reference table.
create table if not exists report_reasons (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

insert into report_reasons (key, label, sort_order) values
  ('spam',                 'Spam',                              10),
  ('scam',                 'Scam / fraud',                      20),
  ('suspicious_link',      'Suspicious link',                   30),
  ('payment_off_platform', 'Payment outside platform',          40),
  ('harassment',           'Harassment / insults',              50),
  ('threats',              'Threats',                           60),
  ('prohibited_content',   'Prohibited content',                70),
  ('confidential_leak',    'Confidential information leak',      80),
  ('impersonation',        'Impersonation',                     90),
  ('fake_profile',         'Fake profile / entity',            100),
  ('agreement_violation',  'Event / project agreement broken', 110),
  ('reliability_dispute',  'No-show / reliability dispute',    120),
  ('document_abuse',       'Document abuse',                   130),
  ('other',                'Other',                            140)
on conflict (key) do nothing;

-- Moderation case lifecycle (spec "Moderation case states") as a reference table.
-- is_terminal marks states that close a case.
create table if not exists moderation_case_states (
  key text primary key,
  label text not null,
  sort_order int not null default 100,
  is_terminal boolean not null default false
);

insert into moderation_case_states (key, label, sort_order, is_terminal) values
  ('created',           'Created',            10,  false),
  ('triage',            'Triage',             20,  false),
  ('in_review',         'In review',          30,  false),
  ('action_required',   'Action required',    40,  false),
  ('waiting_for_user',  'Waiting for user',   50,  false),
  ('waiting_for_admin', 'Waiting for admin',  60,  false),
  ('escalated',         'Escalated',          70,  false),
  ('legal_hold',        'Legal hold',         80,  false),
  ('resolved',          'Resolved',           90,  false),
  ('appealed',          'Appealed',          100,  false),
  ('duplicate',         'Duplicate',         110,  true),
  ('rejected',          'Rejected',          120,  true),
  ('closed',            'Closed',            130,  true)
on conflict (key) do nothing;

-- A report is also the moderation case (one row, evolving state). Evidence is
-- preserved in `context` (a snapshot taken at report time) so it survives even if
-- the underlying object is later edited or deleted — the spec's core rule that
-- safety-sensitive content is not destroyed by normal user actions. object_id is
-- text/polymorphic; accused_* are optional structured links for querying.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references users(id) on delete set null,
  object_type text not null references report_object_types(key) on delete restrict,
  object_id text,
  reason_key text not null references report_reasons(key) on delete restrict,
  state_key text not null default 'created' references moderation_case_states(key) on delete restrict,
  details text,
  context jsonb,
  accused_user_id uuid references users(id) on delete set null,
  accused_entity_id uuid references entities(id) on delete set null,
  assigned_to_user_id uuid references users(id) on delete set null,
  resolution text,
  resolved_by_user_id uuid references users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists reports_set_updated_at on reports;
create trigger reports_set_updated_at
before update on reports
for each row execute function set_updated_at();

create index if not exists reports_state_idx on reports (state_key);
create index if not exists reports_reporter_idx on reports (reporter_user_id);
create index if not exists reports_object_idx on reports (object_type, object_id);
create index if not exists reports_accused_user_idx on reports (accused_user_id);
