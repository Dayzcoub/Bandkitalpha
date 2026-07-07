-- Phase 1 — 2FA (TOTP) + recovery codes (Auth spec §6, TZ §7).
-- Secrets and recovery codes are stored hashed/at-rest only; raw values are
-- shown to the user once at enrollment (Security Standard §1, §10).

alter table users add column if not exists two_factor_enabled boolean not null default false;

-- One TOTP secret per user. confirmed_at is set only after the user proves a
-- valid code (enrollment is a two-step: create secret -> confirm code).
create table if not exists two_factor_secrets (
  user_id uuid primary key references users(id) on delete cascade,
  secret text not null,
  confirmed_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_two_factor_secrets_updated_at on two_factor_secrets;
create trigger set_two_factor_secrets_updated_at
  before update on two_factor_secrets
  for each row execute function set_updated_at();

-- One-time recovery codes, stored hashed. status via used_at (null = unused).
create table if not exists recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists recovery_codes_user_id_idx on recovery_codes (user_id);
