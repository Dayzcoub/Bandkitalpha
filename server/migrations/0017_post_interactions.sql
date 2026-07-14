-- Phase 4 feed slice 3 — post interactions (Feed Rules v1.0 "Comments" +
-- "Reactions"; Entity Subscriptions spec's entity_post_interactions draft).
-- One table for likes and comments, per the spec draft: a like is a contentless
-- row (one per user per post), a comment carries a body and its own moderation
-- state (comments are reportable/hideable like any content). Reposts are out of
-- MVP; reports go through the moderation domain, not here.
create table if not exists entity_post_interactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references entity_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('like', 'comment')),
  body text,
  moderation_state text not null default 'clean'
    check (moderation_state in ('clean', 'flagged', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A like has no body; a comment must have one.
  constraint entity_post_interactions_shape check (
    (type = 'like' and body is null) or (type = 'comment' and body is not null)
  )
);

drop trigger if exists entity_post_interactions_set_updated_at on entity_post_interactions;
create trigger entity_post_interactions_set_updated_at
before update on entity_post_interactions
for each row execute function set_updated_at();

create unique index if not exists entity_post_one_like_per_user
  on entity_post_interactions (post_id, user_id) where type = 'like';
create index if not exists entity_post_interactions_post_idx
  on entity_post_interactions (post_id, type, created_at);
