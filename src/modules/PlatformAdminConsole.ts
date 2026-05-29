type AdminTone = 'neutral' | 'positive' | 'warning' | 'danger';
type AdminAccess = 'moderator' | 'admin' | 'super_admin';

type AdminSection = {
  path: string;
  access: AdminAccess;
  label: string;
  title: string;
  subtitle: string;
  kpis: Array<[string, string]>;
  rows: Array<[string, string, AdminTone]>;
  actions: string[];
};

const ADMIN_ROOT = '/admin';
const roleRank: Record<string, number> = { guest: 0, user: 1, moderator: 2, admin: 3, super_admin: 4 };

const sections: AdminSection[] = [
  {
    path: '/admin', access: 'admin', label: 'Overview', title: 'Platform Console',
    subtitle: 'Owner-level operations console. This is not a band, studio, organization or event admin area.',
    kpis: [['42', 'users under review'], ['2', 'open reports'], ['7', 'platform queues'], ['0', 'critical incidents']],
    rows: [
      ['Platform boundary', '/admin controls platform operations only; entity settings stay in entity admin spaces.', 'positive'],
      ['Sensitive actions', 'Blocking, refunds, role changes and impersonation must be audited before real backend wiring.', 'warning'],
      ['Current mode', 'Mock console surface. Backend business actions are intentionally not connected yet.', 'neutral'],
    ],
    actions: ['Open reports queue', 'Review trust signals', 'Check audit trail'],
  },
  {
    path: '/admin/users', access: 'admin', label: 'Users', title: 'Users Registry',
    subtitle: 'Platform-level user lookup, verification state, risk flags and support-safe account operations.',
    kpis: [['3', 'demo profiles'], ['2FA', 'required for staff'], ['1', 'restricted sample'], ['Audit', 'mandatory']],
    rows: [
      ['Alex Rhythm', 'Verified user · reputation 92 · no active restriction', 'positive'],
      ['Mira Voice', 'Premium performer · trusted contact · email and phone ready', 'positive'],
      ['Suspicious outreach sample', 'Link-policy warning · complaint context available', 'warning'],
    ],
    actions: ['Open user card', 'Add support note', 'Request verification'],
  },
  {
    path: '/admin/entities', access: 'admin', label: 'Entities', title: 'Entities Registry',
    subtitle: 'Read platform-level registry for bands, studios, organizations, venues and events without mixing their own admin panels.',
    kpis: [['3', 'bands/projects'], ['3', 'events'], ['Future', 'studios/orgs'], ['Safe', 'read-first']],
    rows: [
      ['Northern Lights Band', 'Band/project entity · owner admin is outside /admin', 'positive'],
      ['City Orchestra Lab', 'Orchestra entity · membership and settings belong to entity admin space', 'neutral'],
      ['Studio Night Crew', 'Session crew · platform can freeze or review, not casually edit internals', 'warning'],
    ],
    actions: ['Open registry item', 'Flag for review', 'Open read-only audit'],
  },
  {
    path: '/admin/reports', access: 'moderator', label: 'Reports', title: 'Reports Queue',
    subtitle: 'Unified queue for complaints, appeals and escalations before final moderation workflows are connected.',
    kpis: [['2', 'open reports'], ['1', 'high priority'], ['0', 'SLA breaches'], ['Appeals', 'future-ready']],
    rows: [
      ['Fraud report', 'Suspicious post · external payment / social engineering risk', 'danger'],
      ['Spam report', 'Suspicious chat · repeated outreach pattern', 'warning'],
      ['Appeal lane', 'Reserved for user appeals after action is taken', 'neutral'],
    ],
    actions: ['Assign case', 'Escalate to trust', 'Close as rejected'],
  },
  {
    path: '/admin/moderation', access: 'moderator', label: 'Moderation', title: 'Moderation Operations',
    subtitle: 'Platform moderation surface for content, profiles, messages under complaint, and entity visibility decisions.',
    kpis: [['Content', 'posts/comments'], ['Messages', 'complaint-gated'], ['Profiles', 'risk review'], ['Audit', 'immutable']],
    rows: [
      ['Content review', 'Hide/remove through moderation actions, not direct user text editing.', 'warning'],
      ['Complaint-gated messages', 'Moderators do not get blanket access to all private chats.', 'positive'],
      ['Entity visibility', 'Freeze, unpublish or review; entity admins keep entity settings separately.', 'neutral'],
    ],
    actions: ['Open queue', 'Review content flag', 'Write moderation note'],
  },
  {
    path: '/admin/trust', access: 'admin', label: 'Trust & Safety', title: 'Trust & Safety',
    subtitle: 'Risk signals, blocked links, suspicious account patterns, rating abuse and anti-fraud policy controls.',
    kpis: [['Links', 'blocked in MVP'], ['Risk', 'manual review'], ['Rating', 'abuse future'], ['2FA', 'staff required']],
    rows: [
      ['External links', 'MVP blocks unsafe external-link behavior in chats and posts.', 'warning'],
      ['Suspicious logins', 'Device/IP risk belongs to backend policy before enforcement.', 'neutral'],
      ['Rating disputes', 'No-shows, cancellations and reviews need dispute trail before score changes.', 'positive'],
    ],
    actions: ['Review blocked links', 'Open risk user', 'Tune policy draft'],
  },
  {
    path: '/admin/billing', access: 'super_admin', label: 'Billing', title: 'Billing & Plans',
    subtitle: 'Plans, subscriptions, refunds and manual access grants. Kept separate from entity settings and user profile screens.',
    kpis: [['Plans', 'future'], ['Invoices', 'future'], ['Refunds', 'audited'], ['Access', 'manual grant']],
    rows: [
      ['Plan catalog', 'Central owner-managed pricing and entitlements.', 'neutral'],
      ['Manual grant', 'Every manual entitlement change must create an audit event.', 'warning'],
      ['Refund lane', 'Future payment provider integration only after policy slice is ready.', 'neutral'],
    ],
    actions: ['Review plans', 'Open subscriptions', 'Audit refund'],
  },
  {
    path: '/admin/content', access: 'admin', label: 'Content', title: 'Content Operations',
    subtitle: 'Feed, comments, media, categories and featured surfaces controlled at platform level.',
    kpis: [['Feed', 'moderated'], ['Media', 'scan future'], ['Featured', 'curated'], ['Categories', 'controlled']],
    rows: [
      ['Feed operations', 'Platform can feature, hide or send posts to review.', 'neutral'],
      ['Media status', 'MIME and virus scanning remain future-ready backend concerns.', 'warning'],
      ['Categories', 'Localization-safe labels, no text baked into assets.', 'positive'],
    ],
    actions: ['Open content flags', 'Manage featured', 'Review media'],
  },
  {
    path: '/admin/localization', access: 'admin', label: 'Localization', title: 'Localization Console',
    subtitle: 'Language packs, translation keys, missing strings and future import/export workflows.',
    kpis: [['RU/EN', 'active'], ['JSON', 'current MVP'], ['DB', 'future-ready'], ['Fallback', 'English']],
    rows: [
      ['Language packs', 'Source strings stay in i18n JSON, not hardcoded in components.', 'positive'],
      ['Missing keys', 'Admin tooling will later surface untranslated keys by namespace.', 'neutral'],
      ['Asset policy', 'Production assets remain language-neutral.', 'positive'],
    ],
    actions: ['Review keys', 'Export pack', 'Check missing'],
  },
  {
    path: '/admin/notifications', access: 'admin', label: 'Notifications', title: 'Notifications & Broadcasts',
    subtitle: 'Operational channel for platform announcements, templates, push/email/SMS policies and emergency notices.',
    kpis: [['In-app', 'ready shell'], ['Push', 'future'], ['Email', 'templates'], ['SMS', 'critical only']],
    rows: [
      ['Broadcasts', 'Segmented by role, locale, city or entity type when backend is ready.', 'neutral'],
      ['Templates', 'All notification text must be localized and audited.', 'positive'],
      ['Emergency notice', 'Owner-level action with strict audit and confirmation.', 'danger'],
    ],
    actions: ['Create draft', 'Preview template', 'Audit send'],
  },
  {
    path: '/admin/audit', access: 'admin', label: 'Audit', title: 'Audit Trail',
    subtitle: 'Immutable platform action log for role changes, restrictions, billing actions, moderation and data access.',
    kpis: [['Immutable', 'required'], ['Actor', 'captured'], ['Reason', 'required'], ['IP/UA', 'hashed']],
    rows: [
      ['Route guard checked', 'System actor · permission boundary verified.', 'positive'],
      ['Moderation queue viewed', 'Moderator actor · complaint context only.', 'neutral'],
      ['Manual role change', 'Requires reason and 2FA before real implementation.', 'warning'],
    ],
    actions: ['Filter audit', 'Export log', 'Open actor'],
  },
  {
    path: '/admin/settings', access: 'super_admin', label: 'Settings', title: 'Platform Settings',
    subtitle: 'Global platform flags, registration policy, security requirements, providers and feature gates.',
    kpis: [['Registration', 'policy'], ['2FA', 'required staff'], ['Feature flags', 'future'], ['Providers', 'future']],
    rows: [
      ['Registration policy', 'Email, phone and OAuth requirements controlled here, not per entity.', 'positive'],
      ['Security policy', '2FA for elevated staff and owners is non-negotiable.', 'warning'],
      ['Feature gates', 'Controlled rollout before connecting broad social features.', 'neutral'],
    ],
    actions: ['Review policy', 'Open feature flags', 'Check providers'],
  },
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}

function currentSection(pathname = window.location.pathname): AdminSection | null {
  if (!pathname.startsWith(ADMIN_ROOT)) return null;
  return sections.find((section) => section.path === pathname) ?? sections[0] ?? null;
}

function currentRole(root: HTMLElement): string {
  return root.querySelector<HTMLElement>('.bk-shell')?.dataset.role ?? 'guest';
}

function canViewSection(root: HTMLElement, section: AdminSection): boolean {
  return (roleRank[currentRole(root)] ?? 0) >= roleRank[section.access];
}

function badge(label: string, tone: AdminTone = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

function button(label: string, path: string, variant: 'primary' | 'secondary' | 'ghost' = 'secondary'): string {
  return `<button class="bk-button bk-button-${variant}" type="button" data-admin-route="${escapeHtml(path)}">${escapeHtml(label)}</button>`;
}

function renderKpi([value, label]: [string, string]): string {
  return `<div class="bk-kpi"><div class="bk-kpi-value">${escapeHtml(value)}</div><div class="bk-kpi-label">${escapeHtml(label)}</div></div>`;
}

function renderRow([title, meta, tone]: [string, string, AdminTone]): string {
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">◇</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(title)}</div><div class="bk-meta">${escapeHtml(meta)}</div></div>${badge(tone.toUpperCase(), tone)}</div>`;
}

function renderAdminMain(section: AdminSection, root: HTMLElement): string {
  const shortcutButtons = sections
    .filter((item) => item.path !== section.path && canViewSection(root, item))
    .slice(0, 6)
    .map((item) => button(item.label, item.path, 'ghost'))
    .join('');
  return `<header class="bk-page-header"><div class="bk-eyebrow">Platform Console · owner operations · mock only</div><div class="bk-chip-row">${badge('/admin boundary', 'positive')}${badge('entity admin separated', 'warning')}${badge('no real sensitive API calls')}</div><div class="bk-page-header-main"><div><h1 class="bk-title">${escapeHtml(section.title)}</h1><p class="bk-subtitle">${escapeHtml(section.subtitle)}</p></div><div class="bk-action-row">${button('Back to app', '/feed', 'secondary')}</div></div></header><section class="bk-card"><div class="bk-kpi-grid">${section.kpis.map(renderKpi).join('')}</div></section><section class="bk-card"><div class="bk-card-section-head"><div><div class="bk-eyebrow">Operational boundary</div><h3 class="bk-card-title">Platform-level actions only</h3></div>${badge('read-first mock', 'positive')}</div><div class="bk-list">${section.rows.map(renderRow).join('')}</div></section><section class="bk-card"><h3 class="bk-card-title">Safe actions preview</h3><p class="bk-state-copy">These buttons are UI placeholders. Real blocking, refunds, role changes, impersonation and data access must go through backend permissions, reason prompts and immutable audit logs.</p><div class="bk-action-row">${section.actions.map((action) => button(action, section.path, action.includes('Audit') ? 'primary' : 'secondary')).join('')}</div></section><section class="bk-card"><h3 class="bk-card-title">Platform sections</h3><div class="bk-action-row">${shortcutButtons}</div></section>`;
}

function renderAdminRightRail(section: AdminSection): string {
  return `<aside class="bk-right-rail"><section class="bk-card"><div class="bk-meta">Console mode</div><strong>${escapeHtml(section.label)}</strong><p class="bk-state-copy">Owner and platform staff workspace. Entity admins must use their own future routes such as /band/:id/admin, /studio/:id/admin, /org/:id/admin, /event/:id/admin.</p><div class="bk-chip-row">${badge('2FA required', 'warning')}${badge('RBAC')}${badge('audit')}</div></section><section class="bk-card"><h3 class="bk-card-title">Do not mix here</h3><div class="bk-list"><div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">×</span><div class="bk-list-row-main"><div class="bk-list-row-title">Band settings</div><div class="bk-meta">Belongs to entity admin space.</div></div></div><div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">×</span><div class="bk-list-row-main"><div class="bk-list-row-title">Studio settings</div><div class="bk-meta">Belongs to /studio/:id/admin future route.</div></div></div><div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">×</span><div class="bk-list-row-main"><div class="bk-list-row-title">User preferences</div><div class="bk-meta">Belongs to account settings, not owner console.</div></div></div></div></section></aside>`;
}

function renderAdminPage(root: HTMLElement, section: AdminSection): void {
  if (!canViewSection(root, section)) return;
  document.documentElement.dataset.platformAdminConsole = 'true';
  root.querySelectorAll<HTMLElement>('.bk-nav-item').forEach((item) => {
    const href = item.getAttribute('href') ?? '';
    const active = href === section.path;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  const grid = root.querySelector<HTMLElement>('.bk-content-grid');
  const main = root.querySelector<HTMLElement>('.bk-main-column');
  if (grid) grid.classList.remove('bk-content-wide');
  if (main) main.innerHTML = renderAdminMain(section, root);
  const existingRail = root.querySelector<HTMLElement>('.bk-right-rail');
  const railHtml = renderAdminRightRail(section);
  if (existingRail) existingRail.outerHTML = railHtml;
  else grid?.insertAdjacentHTML('beforeend', railHtml);
}

function routeTo(path: string): void {
  if (!path.startsWith(ADMIN_ROOT)) {
    window.location.href = path;
    return;
  }
  if (window.location.pathname !== path) {
    window.history.pushState({ bandkitPlatformAdmin: true }, '', path);
  }
  window.dispatchEvent(new CustomEvent('bandkit:platform-admin-route'));
}

function maybeRender(root: HTMLElement): void {
  const section = currentSection();
  if (!section) {
    document.documentElement.dataset.platformAdminConsole = 'false';
    return;
  }
  window.requestAnimationFrame(() => renderAdminPage(root, section));
}

export function initPlatformAdminConsole(root: HTMLElement): void {
  maybeRender(root);
  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-admin-route], a[href^="/admin"]') : null;
    if (!target) return;
    const nextPath = target.dataset.adminRoute ?? target.getAttribute('href') ?? '';
    if (!nextPath) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    routeTo(nextPath);
  }, true);
  window.addEventListener('popstate', () => maybeRender(root));
  window.addEventListener('bandkit:platform-admin-route', () => maybeRender(root));
}
