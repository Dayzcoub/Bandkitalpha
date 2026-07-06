-- Phase 1b — Auth foundation (BandKit_Auth_And_Permissions_Model_v1.md §8, MVP slice §9).
-- Adds: users auth/verification columns + platform_role, auth_credentials,
-- sessions, email_verifications. 2FA/recovery/oauth tables are laid with their
-- own slice later (spec §6, §8 seams) — not created here (YAGNI).
-- Security: store only password hashes and token hashes, never plaintext
-- (Security Engineering Standard §1, §8).

-- users: verification flags, platform role, auth timestamps.
alter table users add column if not exists email_verified boolean not null default false;
alter table users add column if not exists phone_verified boolean not null default false;
alter table users add column if not exists platform_role text
  check (platform_role in ('super_admin', 'platform_admin', 'platform_moderator', 'support_agent', 'read_only_auditor'));
alter table users add column if not exists password_updated_at timestamptz;
alter table users add column if not exists last_login_at timestamptz;

-- auth_credentials: one row per user. password_hash format is `salt$hash`;
-- algo carries the KDF so we can migrate off scrypt later without a schema change.
create table if not exists auth_credentials (
  user_id uuid primary key references users(id) on delete cascade,
  password_hash text not null,
  algo text not null default 'scrypt',
  updated_at timestamptz not null default now()
);

drop trigger if exists set_auth_credentials_updated_at on auth_credentials;
create trigger set_auth_credentials_updated_at
  before update on auth_credentials
  for each row execute function set_updated_at();

-- sessions: server-side sessions. Only the hash of the session token is stored;
-- the raw token lives in the client's HttpOnly cookie (spec §4).
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  ip text,
  user_agent text,
  revoked_at timestamptz
);

create index if not exists sessions_user_id_idx on sessions (user_id);
create index if not exists sessions_expires_at_idx on sessions (expires_at);

-- email_verifications: one-time, short-lived, hashed tokens (spec §5).
create table if not exists email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  purpose text not null default 'email_verify'
    check (purpose in ('email_verify', 'email_change')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists email_verifications_user_id_idx on email_verifications (user_id);
