import type { AppContext } from '../app/types.js';
import { bottomNav, mobileTopBar, sideNav, topBar } from '../components/layout/navigation.js';

export function renderShell(ctx: AppContext, pageHtml: string): string {
  switch (ctx.match.route.shell) {
    case 'auth':
      return `<div class="bk-shell" data-theme="${ctx.state.theme}">${pageHtml}</div>`;
    case 'public':
      return `<div class="bk-shell" data-theme="${ctx.state.theme}">${pageHtml}</div>`;
    case 'admin':
      return `<div class="bk-shell bk-admin-shell" data-theme="${ctx.state.theme}">${sideNav(ctx, 'admin')}<div class="bk-shell-main">${mobileTopBar(ctx)}${topBar(ctx)}${pageHtml}${bottomNav(ctx)}</div></div>`;
    case 'app':
    default:
      return `<div class="bk-shell bk-app-shell" data-theme="${ctx.state.theme}">${sideNav(ctx, 'app')}<div class="bk-shell-main">${mobileTopBar(ctx)}${topBar(ctx)}${pageHtml}${bottomNav(ctx)}</div></div>`;
  }
}
