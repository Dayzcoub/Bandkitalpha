-- Phase 4 billing domain slice 1 — entity plans and limits (Monetization and
-- Entity Feature Policy v1.0).
--
-- The policy is unambiguous about what billing is NOT at this stage: no
-- in-platform payments, no settlement, no escrow, no commission — "MVP must not
-- depend on them". Monetization is "expanding platform capabilities for
-- entities". So this slice is plans + real, enforced limits; money is a separate
-- future module (`entity_billing_profile` stays unbuilt on purpose).
--
-- The policy also insists the free tier "is not a useless demo. It must be a real
-- starter package", so free limits are generous enough to run a small band.

-- Plans as a reference table (CLAUDE.md: types are lookups, not enums). Limits
-- live as columns because every one of them is enforced by code today.
create table if not exists plans (
  key text primary key,
  label text not null,
  max_members int not null,
  max_storage_bytes bigint not null,
  max_file_versions int not null,
  max_upload_bytes bigint not null,
  sort_order int not null default 100
);

-- Values are a product direction, not final pricing (policy: "This is a product
-- direction, not final pricing").
insert into plans (key, label, max_members, max_storage_bytes, max_file_versions, max_upload_bytes, sort_order) values
  ('free', 'Free',                 10,    104857600,  3,  10485760, 10),   -- 100 MB, 10 MB/file
  ('pro',  'Pro Entity',           50,   5368709120, 25,  52428800, 20),   -- 5 GB,  50 MB/file
  ('org',  'Organization',        500,  53687091200, 100, 104857600, 30)   -- 50 GB, 100 MB/file
on conflict (key) do nothing;

-- An entity's current plan. No row = free (the default must never require a
-- write to exist). `assigned_by_user_id`/`note` cover the policy's "admin
-- override for testing/support" — the only way a plan changes today, since there
-- is no payment flow.
create table if not exists entity_plans (
  entity_id uuid primary key references entities(id) on delete cascade,
  plan_key text not null references plans(key) on delete restrict,
  assigned_by_user_id uuid references users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists entity_plans_set_updated_at on entity_plans;
create trigger entity_plans_set_updated_at
before update on entity_plans
for each row execute function set_updated_at();
