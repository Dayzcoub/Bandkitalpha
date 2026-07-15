import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { getPool } from '../../db/client.js';
import { sendError, sendJson } from '../../shared/http.js';
import { permissionService } from '../permissions/PermissionService.js';
import { resolveSessionUser } from '../auth/session.js';
import { detectType, safeFilename, ALLOWED_MIMES } from '../../shared/fileTypes.js';
import { getEntityPlan, getStorageUsed, getVersionCount } from '../billing/plans.js';

// Files are never served from the web root: every read goes through this proxy,
// which checks membership first (Security §6, §16.1/§16.2).

// Node exposes header values as latin1, so a raw UTF-8 filename arrives
// mojibaked ("Райдер" -> "Ð Ð°Ð¹Ð´ÐµÑ"). Re-read the bytes as UTF-8, then
// undo percent-encoding if the client sent it (both forms end up correct).
function decodeFilenameHeader(raw) {
  const value = String(raw || '');
  if (!value) return '';
  const reinterpreted = Buffer.from(value, 'latin1').toString('utf8');
  try {
    return decodeURIComponent(reinterpreted);
  } catch {
    return reinterpreted; // a literal '%' that isn't an escape
  }
}

// Resolves the document and the actor's membership in its owning entity.
// Returns { actor, doc, membership } or null after sending an error.
async function requireDocumentAccess(client, req, res, documentId) {
  const actor = await resolveSessionUser(req);
  if (!actor) {
    sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
    return null;
  }
  const result = await client.query(
    `select d.id, d.entity_id, d.event_id, d.title, d.status, d.version_number
       from documents d where d.id = $1 limit 1`,
    [documentId]
  );
  const doc = result.rows[0];
  if (!doc || doc.status === 'deleted') {
    sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    return null;
  }
  if (!doc.entity_id) {
    sendError(res, 409, 'DOCUMENT_NOT_SCOPED', 'Document is not attached to an entity');
    return null;
  }
  const membershipResult = await client.query(
    'select role, status from entity_memberships where entity_id = $1 and user_id = $2 limit 1',
    [doc.entity_id, actor.id]
  );
  const membership = membershipResult.rows[0] || null;
  // Not a member -> 404, not 403: don't confirm the document exists.
  if (!permissionService.canViewEntityDocuments(actor, membership)) {
    sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    return null;
  }
  return { actor, doc, membership };
}

// Streams the request body to disk, aborting past the cap so an oversized upload
// can never fill the volume (Security §6, §4 body limits).
async function streamToFile(req, absPath, maxBytes) {
  const handle = await fsp.open(absPath, 'w');
  let size = 0;
  let head = Buffer.alloc(0);
  try {
    const stream = handle.createWriteStream();
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBytes) {
        stream.destroy();
        const error = new Error('Upload too large');
        error.code = 'UPLOAD_TOO_LARGE';
        throw error;
      }
      // Keep the first bytes for magic-byte detection.
      if (head.length < 16) head = Buffer.concat([head, chunk.subarray(0, 16 - head.length)]);
      if (!stream.write(chunk)) await new Promise((resolve) => stream.once('drain', resolve));
    }
    await new Promise((resolve, reject) => {
      stream.end((err) => (err ? reject(err) : resolve()));
    });
  } finally {
    await handle.close().catch(() => {});
  }
  return { size, head };
}

// POST /documents/:id/file — upload the document's file as a NEW version.
// Raw binary body (content-type = the file's type, x-filename = display name);
// no multipart parser is needed, keeping the backend dependency-free.
export async function handleUploadDocumentFile(req, res, env, documentId) {
  const client = await getPool().connect();
  let absPath = null;
  try {
    const access = await requireDocumentAccess(client, req, res, documentId);
    if (!access) return;
    // Uploading is a managing action, like creating the document itself.
    if (!permissionService.canCreateDocument(access.actor, access.membership)) {
      sendError(res, 403, 'DOCUMENT_UPLOAD_FORBIDDEN', 'You cannot upload files for this document');
      return;
    }

    // Plan limits are enforced before a byte is written (Monetization policy:
    // storage quotas, larger attachments and more file versions are exactly the
    // paid axes). The global cap still applies as a hard ceiling.
    const plan = await getEntityPlan(client, access.doc.entity_id);
    const uploadCap = Math.min(Number(plan.max_upload_bytes), env.maxUploadBytes);
    const versions = await getVersionCount(client, access.doc.id);
    if (versions >= plan.max_file_versions) {
      sendError(res, 409, 'PLAN_VERSION_LIMIT', 'This plan\'s file version limit is reached', {
        plan: plan.key, limit: plan.max_file_versions
      });
      return;
    }
    const storageUsed = await getStorageUsed(client, access.doc.entity_id);
    if (storageUsed >= Number(plan.max_storage_bytes)) {
      sendError(res, 409, 'PLAN_STORAGE_FULL', 'This plan\'s storage is full', {
        plan: plan.key, limit: Number(plan.max_storage_bytes), used: storageUsed
      });
      return;
    }

    // The storage key is built from server-side values only — never from the
    // client filename — so a crafted name cannot escape the storage root.
    const nextVersion = (access.doc.version_number || 0) + 1;
    const storageKey = path.posix.join(
      'documents',
      access.doc.id,
      `${nextVersion}-${crypto.randomBytes(8).toString('hex')}`
    );
    absPath = path.join(env.filesDir, storageKey);
    await fsp.mkdir(path.dirname(absPath), { recursive: true });

    const { size, head } = await streamToFile(req, absPath, uploadCap);
    if (size === 0) {
      await fsp.rm(absPath, { force: true });
      sendError(res, 400, 'UPLOAD_EMPTY', 'The uploaded file is empty');
      return;
    }

    // Trust the bytes, not the declared content-type or extension.
    const detected = detectType(head);
    if (!detected) {
      await fsp.rm(absPath, { force: true });
      sendError(res, 415, 'UPLOAD_TYPE_REJECTED', 'This file type is not allowed', { allowed: ALLOWED_MIMES });
      return;
    }
    // The cap bounds a single file; the quota bounds the total. Check the real
    // size against the remaining quota now that it is known.
    if (storageUsed + size > Number(plan.max_storage_bytes)) {
      await fsp.rm(absPath, { force: true });
      sendError(res, 409, 'PLAN_STORAGE_FULL', 'This file would exceed the plan storage quota', {
        plan: plan.key, limit: Number(plan.max_storage_bytes), used: storageUsed
      });
      return;
    }
    const filename = safeFilename(decodeFilenameHeader(req.headers['x-filename']), detected.ext);

    await client.query('begin');
    const inserted = await client.query(
      `insert into document_files (document_id, version_number, storage_key, mime_type, size_bytes, original_filename, uploaded_by_user_id)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, version_number, mime_type, size_bytes, original_filename, created_at`,
      [access.doc.id, nextVersion, storageKey, detected.mime, size, filename, access.actor.id]
    );
    // documents.* mirrors the current version for cheap listing.
    await client.query(
      `update documents set version_number = $2, storage_key = $3, mime_type = $4, size_bytes = $5,
              status = case when status = 'draft' then 'active' else status end
        where id = $1`,
      [access.doc.id, nextVersion, storageKey, detected.mime, size]
    );
    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, 'document.file_uploaded', $2,
               jsonb_build_object('document_id', $3::text, 'version', $4::int, 'mime', $5::text, 'size', $6::bigint))`,
      [access.actor.id, access.doc.entity_id, access.doc.id, nextVersion, detected.mime, size]
    );
    await client.query('commit');

    sendJson(res, 201, { ok: true, file: inserted.rows[0] });
  } catch (error) {
    await client.query('rollback').catch(() => {});
    if (absPath) await fsp.rm(absPath, { force: true }).catch(() => {});
    if (error?.code === 'UPLOAD_TOO_LARGE') {
      sendError(res, 413, 'UPLOAD_TOO_LARGE', 'The file is too large');
      return;
    }
    // Never leak paths/stack to the client (Security §16.10).
    sendError(res, 500, 'UPLOAD_FAILED', 'Failed to upload the file');
  } finally {
    client.release();
  }
}

// GET /documents/:id/file — download the current (or ?version=N) file through
// the permission proxy.
export async function handleDownloadDocumentFile(req, res, env, documentId) {
  const client = await getPool().connect();
  try {
    const access = await requireDocumentAccess(client, req, res, documentId);
    if (!access) return;

    const url = new URL(req.url, 'http://localhost');
    const requested = Number.parseInt(url.searchParams.get('version') || '', 10);
    const fileResult = Number.isFinite(requested)
      ? await client.query(
          `select storage_key, mime_type, size_bytes, original_filename, version_number
             from document_files where document_id = $1 and version_number = $2 limit 1`,
          [access.doc.id, requested]
        )
      : await client.query(
          `select storage_key, mime_type, size_bytes, original_filename, version_number
             from document_files where document_id = $1 order by version_number desc limit 1`,
          [access.doc.id]
        );
    const file = fileResult.rows[0];
    if (!file) {
      sendError(res, 404, 'FILE_NOT_FOUND', 'This document has no uploaded file');
      return;
    }

    // Re-anchor the stored key under the storage root and verify it stayed
    // inside — defence in depth even though keys are server-generated.
    const absPath = path.resolve(env.filesDir, file.storage_key);
    const root = path.resolve(env.filesDir);
    if (!absPath.startsWith(root + path.sep)) {
      sendError(res, 500, 'FILE_UNAVAILABLE', 'File is unavailable');
      return;
    }
    if (!fs.existsSync(absPath)) {
      sendError(res, 404, 'FILE_NOT_FOUND', 'This document has no uploaded file');
      return;
    }

    await client.query(
      `insert into audit_events (actor_user_id, action, entity_id, metadata)
       values ($1, 'document.file_downloaded', $2, jsonb_build_object('document_id', $3::text, 'version', $4::int))`,
      [access.actor.id, access.doc.entity_id, access.doc.id, file.version_number]
    );

    // attachment + nosniff: uploaded content must never render as a page on our
    // origin (Security §6). RFC 5987 filename* carries non-ASCII names safely.
    const asciiName = safeFilename(file.original_filename, 'bin').replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
    res.writeHead(200, {
      'content-type': file.mime_type,
      'content-length': file.size_bytes,
      'content-disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.original_filename || asciiName)}`,
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; sandbox",
      'cache-control': 'private, no-store'
    });
    fs.createReadStream(absPath).pipe(res);
  } catch (error) {
    sendError(res, 500, 'DOWNLOAD_FAILED', 'Failed to download the file');
  } finally {
    client.release();
  }
}

// GET /documents/:id/files — version history for the document.
export async function handleListDocumentFiles(req, res, documentId) {
  const client = await getPool().connect();
  try {
    const access = await requireDocumentAccess(client, req, res, documentId);
    if (!access) return;
    const result = await client.query(
      `select f.version_number, f.mime_type, f.size_bytes, f.original_filename, f.created_at,
              u.display_name as uploaded_by
         from document_files f
         left join users u on u.id = f.uploaded_by_user_id
        where f.document_id = $1
        order by f.version_number desc
        limit 100`,
      [access.doc.id]
    );
    sendJson(res, 200, { ok: true, files: result.rows });
  } catch (error) {
    sendError(res, 500, 'FILES_LIST_FAILED', 'Failed to list files');
  } finally {
    client.release();
  }
}
