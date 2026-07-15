// Upload type gate (Security Standard §6): a whitelist checked against MAGIC
// BYTES, not the client-supplied content-type or the extension — both are
// trivially spoofed. Anything not on this list is rejected.
//
// The list is deliberately narrow for MVP: the documents area handles riders,
// setlists, offers and scans. ZIP-based office formats are intentionally absent —
// their magic bytes are just "PK", which would let any archive through; add them
// only with real container inspection.

const TYPES = [
  {
    mime: 'application/pdf',
    ext: 'pdf',
    matches: (b) => b.length >= 5 && b.subarray(0, 5).toString('latin1') === '%PDF-'
  },
  {
    mime: 'image/png',
    ext: 'png',
    matches: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  },
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    matches: (b) => b.length >= 12
      && b.subarray(0, 4).toString('latin1') === 'RIFF'
      && b.subarray(8, 12).toString('latin1') === 'WEBP'
  }
];

export const ALLOWED_MIMES = TYPES.map((t) => t.mime);

// Returns the detected type from the bytes themselves, or null when the content
// is not an allowed type.
export function detectType(buffer) {
  return TYPES.find((t) => t.matches(buffer)) || null;
}

const CONTROL_MAX = 31;   // C0 range
const DELETE_CODE = 127;  // DEL

// Keeps a human-readable name for the download header without ever letting it
// reach the filesystem: drops path separators and control characters (a filtered
// codepoint pass is clearer here than an escape-heavy regex), then leading dots
// so names like ".." or ".env" cannot survive.
export function safeFilename(raw, fallbackExt) {
  const cleaned = Array.from(String(raw || ''))
    .filter((ch) => {
      const code = ch.codePointAt(0);
      if (code <= CONTROL_MAX || code === DELETE_CODE) return false;
      return ch !== '/' && ch !== '\\';
    })
    .join('');
  const base = cleaned.replace(/^\.+/, '').trim().slice(0, 120);
  if (base) return base;
  return fallbackExt ? `file.${fallbackExt}` : 'file';
}
