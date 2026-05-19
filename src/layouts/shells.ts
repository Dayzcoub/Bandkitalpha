import type { AppContext } from '../app/types.js';
import { bottomNav, mobileTopBar, sideNav, topBar } from '../components/layout/navigation.js';

function shellAttrs(ctx: AppContext): string {
  return `data-theme="${ctx.state.theme}" data-role="${ctx.state.role}"`;
}

export function renderShell(ctx: AppContext, pageHtml: string): string {
  switch (ctx.match.route.shell) {
    case 'auth':
      return `<div class="bk-shell" ${shellAttrs(ctx)}>${pageHtml}</div>`;
    case 'public':
      return `<div class="bk-shell" ${shellAttrs(ctx)}>${pageHtml}</div>`;
    case 'admin':
      return `<div class="bk-shell bk-admin-shell" ${shellAttrs(ctx)}>${sideNav(ctx, 'admin')}<div class="bk-shell-main">${mobileTopBar(ctx, 'admin')}${topBar(ctx)}${pageHtml}${bottomNav(ctx)}</div></div>`;
    case 'app':
    default:
      return `<div class="bk-shell bk-app-shell" ${shellAttrs(ctx)}>${sideNav(ctx, 'app')}<div class="bk-shell-main">${mobileTopBar(ctx, 'app')}${topBar(ctx)}${pageHtml}${bottomNav(ctx)}</div></div>`;
  }
}
