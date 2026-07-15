# BandKit — Phase 4 Files Storage Checkpoint 1.14.0

## Status

Accepted checkpoint.

First slice of the Phase 4 **files** domain (fifth domain, after reputation, link guard, moderation and feed). Documents stop being metadata-only: real files are uploaded, versioned, and served through a permission-checked proxy, per Documents and Entity Files Policy v1.0 and Security Standard §6.

---

## Repository

- Repository: `Dayzcoub/Bandkitalpha`
- Branch: `main`
- Backend local port: `127.0.0.1:3001`
- PostgreSQL database: `bandkit`

---

## Scope of this slice

```text
server/migrations/0018_document_files.sql
server/src/shared/fileTypes.js                        (new — magic-byte whitelist + filename hygiene)
server/src/modules/documents/files.routes.js          (new — upload/download/versions)
server/src/modules/documents/documents.routes.js      (list: auth + membership scoping)
server/src/config/env.js                              (FILES_DIR, MAX_UPLOAD_BYTES)
server/.env.example
scripts/staging-smoke-api.sh                          (documents list is protected now)
src/modules/RealDirectories.ts                        (upload/download UI)
src/locales/en|ru/documents.json
```

### Storage model (policy: files never live in PostgreSQL)

- Migration `0018`: `document_files` — one row per version (`storage_key`, `mime_type`, `size_bytes`, `original_filename`, uploader). `documents.*` mirrors the current version for cheap listing; the history lives here because the policy requires that updating an important document **creates a new version instead of silently overwriting**.
- Files are written under `FILES_DIR` (default `/var/lib/bandkit/files`), **outside the web root**. `storage_key` stays backend-agnostic (a relative path today, an object key when storage moves).

### API

```text
POST /api/v1/documents/:id/file    raw body + content-type + x-filename  (entity managers)
GET  /api/v1/documents/:id/file    ?version=N optional                    (entity members)
GET  /api/v1/documents/:id/files   version history                        (entity members)
```

Raw-body upload (no multipart) keeps the backend dependency-free — `pg` remains the only dependency.

### Security (Standard §6 + DoD §16)

- **Magic-byte whitelist**, not extension/content-type: PDF, PNG, JPEG, WebP. ZIP-based office formats are deliberately excluded (their signature is just "PK", which would admit any archive).
- **Storage keys are server-generated** (`documents/<id>/<version>-<random>`); the client filename never reaches the filesystem. `safeFilename` strips path separators, control characters (also blocking header injection) and leading dots; download paths are re-anchored under the root and verified.
- **Size cap** enforced while streaming (`MAX_UPLOAD_BYTES`, default 25 MiB) — an oversized upload is aborted, not buffered.
- **Served only through the proxy** with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` and a `default-src 'none'; sandbox` CSP, so uploaded content can never render as a page on our origin. Non-members get 404 (existence hidden), anonymous 401.
- Audit on `document.file_uploaded` and `document.file_downloaded`.

### Security fix found on the way

`GET /documents` was **unauthenticated and unscoped** — it returned every document on the platform (titles, entity names) to anyone. Now it requires a session and is scoped to the caller's active memberships plus their own documents. The smoke asserted the anonymous 200; it now asserts the endpoint is protected.

### Frontend

The `/documents` panel shows the real file state (version, size), a **Download** button and an **Upload / Upload new version** control. Errors are mapped to localized messages (type rejected, too large, forbidden).

---

## Verification

Backend (curl): PDF upload 201; HTML spoofed as `application/pdf` → 415; >cap → 413; empty → 400; non-member upload → 404; anonymous download → 401; non-member download → 404; old version still fetchable via `?version=N`; files land under `FILES_DIR` with generated keys. Unit-checked `safeFilename` against `../../etc/passwd`, `..\..\win.ini`, `.env`, `..`, newline injection and 300-char names; `detectType` rejects HTML, ZIP and ELF.

Fixed during verification: Node exposes headers as latin1, so a raw UTF-8 `x-filename` stored mojibake (`Ð Ð°Ð¹Ð´ÐµÑ`). The header is now re-read as UTF-8 and percent-decoded — both raw and encoded names round-trip.

Real browser: `/documents` lists the real file (v4); uploading through the file input → "Файл загружен как новая версия", v4 → v5; download returns 200 with `attachment` + `nosniff` and real PDF bytes; the Cyrillic name survives in `filename*`; an HTML file named `.pdf` is rejected with the localized message; version history shows `v5 Райдер из UI.pdf`. No console errors.

---

## Deferred

- object storage backend (the `storage_key` seam is ready);
- external export flow + `canExportDocument` (still `false`: no external sharing exists yet);
- antivirus/scan lifecycle (initiated→scanning→ready→rejected), orphan cleanup job;
- message attachments (a different concept per the policy) and document-level ACLs.

---

## Do not regress

- Files never go into PostgreSQL and are never served from the web root.
- Trust magic bytes, never the extension or the declared content-type.
- Storage keys stay server-generated; client filenames are display-only.
- Keep `attachment` + `nosniff` on every download.
- Keep the documents list authenticated and membership-scoped.

---

## Next recommended work

Object storage adapter, or the next Phase 4 domain (PDF).
