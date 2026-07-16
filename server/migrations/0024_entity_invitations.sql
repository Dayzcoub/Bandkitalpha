-- Entity invitations: consent before membership.
--
-- Invitations are NOT a new domain. `entity_memberships.status` has carried 'invited'
-- since migration 0002, and `event_participants.status` defaults to it — the model was
-- always invitation-based. What was missing is the flow: nothing ever wrote 'invited',
-- and `handleAddEntityMember` inserted 'active' directly.
--
-- That shortcut became a privacy bypass the moment 1.17.0 shipped `shared_context`:
--   1. victim sets dm_policy = 'shared_context'  -> a stranger writing gets 403
--   2. stranger creates an entity, adds the victim by email -> membership 'active'
--   3. stranger now shares context with the victim -> writes: 201
-- Verified end to end before this migration. Consent is what closes it: an invited
-- membership is not active, so it grants neither chat access nor shared context.
--
-- 'declined' is added for symmetry with event_participants, which has had it all along.
-- Without it a refused invitation had nowhere to go: 'removed' means someone else threw
-- you out, 'left' means you were in. Neither is true of an invitation you turned down.

alter table entity_memberships drop constraint if exists entity_memberships_status_check;
alter table entity_memberships add constraint entity_memberships_status_check
  check (status in ('invited', 'active', 'declined', 'former', 'removed', 'left'));

-- Who invited, and when — an invitation without an inviter cannot be judged by the
-- person deciding on it.
alter table entity_memberships add column if not exists invited_by_user_id uuid
  references users(id) on delete set null;
alter table entity_memberships add column if not exists invited_at timestamptz;
alter table entity_memberships add column if not exists decided_at timestamptz;

comment on column entity_memberships.invited_by_user_id is
  'Who issued the invitation. NULL for memberships created before 0024 or by seeds.';

create index if not exists entity_memberships_invited_idx
  on entity_memberships (user_id)
  where status = 'invited';
