-- Foundation slice 4b — wire party <-> profession (Foundation Domain Model v1
-- §2.1/§2.2, §6 steps 1 & 3). Additive: introduces the polymorphic `parties`
-- primitive over existing users/entities and the many-to-many join to the
-- `professions` taxonomy seeded in slice 4a (0006). Existing tables are
-- untouched; nothing here changes users/entities/events behavior yet.

-- Party — the single "actor" abstraction. An individual maps to one users row;
-- an organization maps to one entities row. Exactly one link is set, and it must
-- agree with `kind`. Human and org occupy an event slot through the same code
-- path, so both hang professions off the same table below.
create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('individual', 'organization')),
  user_id uuid unique references users(id) on delete cascade,
  entity_id uuid unique references entities(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parties_link_matches_kind check (
    (kind = 'individual'   and user_id is not null and entity_id is null) or
    (kind = 'organization' and entity_id is not null and user_id is null)
  )
);

drop trigger if exists parties_set_updated_at on parties;
create trigger parties_set_updated_at
before update on parties
for each row execute function set_updated_at();

-- Backfill a party for every existing user and entity. Idempotent via the
-- unique(user_id)/unique(entity_id) links, so re-running is a no-op.
insert into parties (kind, user_id)
select 'individual', u.id
from users u
where not exists (select 1 from parties p where p.user_id = u.id);

insert into parties (kind, entity_id)
select 'organization', e.id
from entities e
where not exists (select 1 from parties p where p.entity_id = e.id);

-- Enforce that a chosen specialization actually belongs to the chosen
-- profession (specializations.key is already unique; this pairs it with its
-- profession so the composite FK below can hold).
do $$ begin
  alter table specializations
    add constraint specializations_key_profession_uniq unique (key, profession_key);
exception when duplicate_table then null;
end $$;

-- party <-> profession (many-to-many). A person can be DJ and host; a studio
-- can do both video and photo. Optional specialization is validated against the
-- profession via the composite FK. `is_primary` marks the headline profession
-- (at most one per party, enforced by the partial unique index below).
create table if not exists party_professions (
  party_id uuid not null references parties(id) on delete cascade,
  profession_key text not null references professions(key) on delete restrict,
  specialization_key text,
  is_primary boolean not null default false,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  primary key (party_id, profession_key),
  -- Composite FK ties specialization to its profession. MATCH SIMPLE means the
  -- check is skipped when specialization_key is null (profession without a
  -- specialization), which is exactly what we want. RESTRICT because seeded
  -- reference rows should not be deleted while a party still points at them.
  constraint party_professions_spec_matches_profession
    foreign key (specialization_key, profession_key)
    references specializations (key, profession_key) on delete restrict
);

-- Discovery: "find all parties with profession X" scans by profession.
create index if not exists party_professions_profession_idx
  on party_professions (profession_key);

-- At most one primary profession per party.
create unique index if not exists party_professions_one_primary_idx
  on party_professions (party_id) where is_primary;
