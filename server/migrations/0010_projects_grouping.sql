-- Foundation slice 4e — project grouping + extension layer (Foundation Domain
-- Model v1 §3.1 and §2.x, §6 steps 6 & 7). Closes the foundation phase.
-- Additive throughout.
--
-- Grouping (tour / season / residency / shoot series) is a light container over
-- events and engagements, NOT a new heavy primitive. It reuses the existing
-- `project` entity type: a project IS an entity acting as a container. Membership
-- is expressed through link tables so an Event/Engagement is never a standalone
-- top by code. Enforcing that the container entity is type='project' is an
-- app-layer concern (seam), consistent with the generic model.

create table if not exists project_events (
  project_entity_id uuid not null references entities(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  primary key (project_entity_id, event_id)
);

create index if not exists project_events_event_idx on project_events (event_id);

create table if not exists project_engagements (
  project_entity_id uuid not null references entities(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  primary key (project_entity_id, engagement_id)
);

create index if not exists project_engagements_engagement_idx
  on project_engagements (engagement_id);

-- Extension layer (§2.x): vertical-specific fields live as JSONB tails on the
-- core primitives so no vertical forces an ALTER. slots/engagements/resources
-- already carry their JSONB (terms/attributes); parties and events get theirs
-- here to complete the core.
alter table parties add column if not exists attributes jsonb;
alter table events  add column if not exists attributes jsonb;
