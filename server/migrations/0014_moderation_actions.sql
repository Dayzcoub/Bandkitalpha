-- Phase 4 moderation slice 3 — case actions (Moderation Rules v1.0 "Moderation
-- actions"). A moderator resolves a case with a concrete action, and the spec
-- requires every sensitive action to carry a reason and an audit event. The
-- schema already supports the effects: users.status has 'restricted'/'blocked',
-- chat_messages.status has 'hidden' — so actions here change real state, they are
-- not decorative. Broader actions (remove from entity, revoke document access,
-- legal hold) arrive with their domains.

create table if not exists moderation_action_types (
  key text primary key,
  label text not null,
  sort_order int not null default 100
);

insert into moderation_action_types (key, label, sort_order) values
  ('no_action',     'No action',      10),
  ('warning',       'Warning',        20),
  ('hide_content',  'Hide content',   30),
  ('restrict_user', 'Restrict user',  40),
  ('suspend_user',  'Suspend user',   50)
on conflict (key) do nothing;

-- Action history per case — part of the evidence trail the spec asks moderation
-- to preserve ("moderation action history"). reason is NOT NULL by policy.
create table if not exists moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  action_key text not null references moderation_action_types(key) on delete restrict,
  target_user_id uuid references users(id) on delete set null,
  reason text not null,
  actor_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists moderation_actions_report_idx on moderation_actions (report_id);
create index if not exists moderation_actions_target_idx on moderation_actions (target_user_id);
