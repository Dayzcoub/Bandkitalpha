-- Phase 4 feed domain slice 1 — entity posts + subscriptions (Feed Rules v1.0,
-- Entity Subscriptions & Public Feeds v1.0). MVP scope is deliberately narrow:
-- "minimal entity updates if they support the working entity flow" — no
-- algorithmic feed, no reactions/reposts, no media, no per-entity feed settings.
-- Subscription is NOT membership: it grants public/subscriber posts only, never
-- workspace access (chat, documents, logistics).

-- A user follows an entity's public feed. One row per (user, entity); status is
-- the lifecycle ('cancelled' keeps history instead of deleting — anti-fraud
-- signals like subscribe/unsubscribe churn need it). notification_level is
-- stored now (spec's setting) though delivery arrives with the notifications
-- domain later.
create table if not exists entity_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  entity_id uuid not null references entities(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'muted', 'cancelled', 'blocked')),
  notification_level text not null default 'all'
    check (notification_level in ('all', 'important', 'events_only', 'silent', 'muted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entity_id)
);

drop trigger if exists entity_subscriptions_set_updated_at on entity_subscriptions;
create trigger entity_subscriptions_set_updated_at
before update on entity_subscriptions
for each row execute function set_updated_at();

create index if not exists entity_subscriptions_entity_idx on entity_subscriptions (entity_id, status);
create index if not exists entity_subscriptions_user_idx on entity_subscriptions (user_id, status);

-- An entity post: published by users with an entity role (never by subscribers).
-- Visibility layers per spec, MVP subset: public / subscribers / members.
-- moderation_state is the moderation domain's handle on this content (hidden
-- posts drop out of every non-staff read).
create table if not exists entity_posts (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references entities(id) on delete cascade,
  author_user_id uuid references users(id) on delete set null,
  body text not null,
  visibility text not null default 'public' check (visibility in ('public', 'subscribers', 'members')),
  event_id uuid references events(id) on delete set null,
  is_pinned boolean not null default false,
  moderation_state text not null default 'clean'
    check (moderation_state in ('clean', 'flagged', 'hidden', 'removed')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists entity_posts_set_updated_at on entity_posts;
create trigger entity_posts_set_updated_at
before update on entity_posts
for each row execute function set_updated_at();

create index if not exists entity_posts_entity_idx on entity_posts (entity_id, published_at desc);
create index if not exists entity_posts_moderation_idx on entity_posts (moderation_state);
