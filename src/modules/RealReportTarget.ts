import { createTranslator, normalizeLocale } from '../lib/i18n/i18n.js';

function t(key: string): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('bandkit.locale') : null;
  return createTranslator(normalizeLocale(stored))(key);
}

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

// Reason sets per reportable object type (stable keys from report_reasons;
// labels localized below). Chat messages have their own in-chat flow.
const REASONS_BY_TYPE: Record<string, string[]> = {
  user_profile: ['impersonation', 'fake_profile', 'harassment', 'spam', 'scam', 'other'],
  post: ['spam', 'scam', 'suspicious_link', 'prohibited_content', 'harassment', 'other']
};
const DEFAULT_REASONS = ['spam', 'scam', 'harassment', 'other'];

// One floating menu for every report target on the page — same .bk-real-menu
// look the chat menu uses (its CSS is global), so no new styles.
let menuEl: HTMLElement | null = null;
let pending: { type: string; id: string } | null = null;

function getMenu(root: HTMLElement): HTMLElement {
  if (menuEl && menuEl.isConnected) return menuEl;
  const el = document.createElement('div');
  el.className = 'bk-real-menu';
  el.setAttribute('role', 'menu');
  el.hidden = true;
  root.appendChild(el);
  menuEl = el;
  return el;
}

function closeMenu(): void {
  if (menuEl) menuEl.hidden = true;
  pending = null;
}

function openMenu(root: HTMLElement, anchor: HTMLElement, type: string, id: string): void {
  const menu = getMenu(root);
  pending = { type, id };
  const reasons = REASONS_BY_TYPE[type] ?? DEFAULT_REASONS;
  menu.innerHTML = `<div class="bk-real-menu-note">${esc(t('moderation.report.title'))}</div>`
    + reasons.map((key) => `<button type="button" role="menuitem" data-target-reason="${esc(key)}">${esc(t(`moderation.report.reason.${key}`))}</button>`).join('');
  menu.hidden = false;
  const r = anchor.getBoundingClientRect();
  const mw = menu.offsetWidth || 220;
  const mh = menu.offsetHeight || 160;
  const left = Math.max(8, Math.min(r.left, window.innerWidth - mw - 8));
  let top = r.bottom + 6;
  if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function menuNote(text: string): void {
  if (!menuEl) return;
  menuEl.innerHTML = `<div class="bk-real-menu-note">${esc(text)}</div>`;
  window.setTimeout(closeMenu, 1900);
}

async function submit(type: string, id: string, reasonKey: string): Promise<void> {
  try {
    const res = await fetch('/api/v1/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ object_type: type, object_id: id, reason_key: reasonKey }),
      credentials: 'same-origin'
    });
    menuNote(res.status === 201 ? t('moderation.report.sent') : t('moderation.report.error'));
  } catch {
    menuNote(t('moderation.report.error'));
  }
}

export function initRealReportTarget(root: HTMLElement): void {
  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const reasonBtn = target.closest<HTMLElement>('[data-target-reason]');
    if (reasonBtn && pending) {
      event.preventDefault();
      void submit(pending.type, pending.id, reasonBtn.getAttribute('data-target-reason') || '');
      return;
    }

    const trigger = target.closest<HTMLElement>('[data-report-target]');
    if (trigger) {
      event.preventDefault();
      // Reporting requires an account; guests keep the button as a no-op hint.
      if (document.documentElement.dataset.bandkitAuthed !== 'true') return;
      openMenu(root, trigger, trigger.getAttribute('data-report-type') || 'other', trigger.getAttribute('data-report-id') || '');
      return;
    }

    if (menuEl && !menuEl.hidden) closeMenu();
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}
