-- Phase 4 files domain slice 1 — real file storage for documents (Documents and
-- Entity Files Policy v1.0). The policy is explicit: files never live in
-- PostgreSQL — local storage for MVP, object storage later. The DB only holds
-- metadata, so `storage_key` stays backend-agnostic (a relative path today, an
-- object key tomorrow).
--
-- `documents` already carried storage_key/mime_type/size_bytes seams; they were
-- never filled. Those now mirror the CURRENT version for cheap listing, while
-- this table keeps the history — the policy requires that updating an important
-- document creates a new version instead of silently overwriting.

create table if not exists document_files (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  version_number integer not null,
  storage_key text not null,
  mime_type text not null,
  size_bytes bigint not null,
  -- Display name only; it is never used to build a filesystem path.
  original_filename text,
  uploaded_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index if not exists document_files_document_idx on document_files (document_id, version_number desc);
