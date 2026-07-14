-- Phase 4 moderation slice 4 — restore actions (Platform Owner Operations spec:
-- "appeals and reversals"). Every sanction must be reversible by staff with the
-- same reason+audit discipline. To restore faithfully (not blindly to 'active'),
-- sanction actions now snapshot the prior status into `metadata`, and restore
-- actions put it back.

insert into moderation_action_types (key, label, sort_order) values
  ('unhide_content',  'Unhide content',  35),
  ('unrestrict_user', 'Unrestrict user', 45),
  ('unsuspend_user',  'Unsuspend user',  55)
on conflict (key) do nothing;

alter table moderation_actions
  add column if not exists metadata jsonb;
