const ADMIN_ROOT = '/admin';

function applyPlatformAdminReadOnlyOwnerScope(root: HTMLElement): void {
  if (!window.location.pathname.startsWith(ADMIN_ROOT)) return;

  const shell = root.querySelector<HTMLElement>('.bk-shell');
  if (!shell || shell.dataset.role !== 'admin') return;

  shell.dataset.role = 'super_admin';
  shell.dataset.platformAdminReadOnlyOwnerScope = 'true';
}

export function initPlatformAdminReadOnlyAccessScope(root: HTMLElement): void {
  applyPlatformAdminReadOnlyOwnerScope(root);
  window.addEventListener('popstate', () => applyPlatformAdminReadOnlyOwnerScope(root));
  window.addEventListener('bandkit:platform-admin-route', () => applyPlatformAdminReadOnlyOwnerScope(root));
}
