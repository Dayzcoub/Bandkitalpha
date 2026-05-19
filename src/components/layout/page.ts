import type { AppContext } from '../../app/types.js';
import { button } from '../ui/primitives.js';

export function pageHeader(ctx: AppContext, titleKey: string, subtitleKey?: string, primaryKey?: string, primaryRoute?: string): string {
  const subtitle = subtitleKey ? `<p class="bk-subtitle">${ctx.t(subtitleKey)}</p>` : '';
  const primary = primaryKey ? button(ctx.t(primaryKey), 'primary', primaryRoute) : '';
  return `<header class="bk-page-header"><div class="bk-eyebrow">${ctx.t('app.shellPass')} · ${ctx.t('app.handoff')}</div><div class="bk-page-header-main"><div><h1 class="bk-title">${ctx.t(titleKey)}</h1>${subtitle}</div><div class="bk-action-row">${primary}</div></div><div class="bk-chip-row"><span class="bk-badge">${ctx.t('common.mock')}</span><span class="bk-badge">${ctx.t('common.offline')}</span><span class="bk-badge">${ctx.t('common.i18nReady')}</span><span class="bk-badge">${ctx.t('common.rlsReady')}</span></div></header>`;
}

export function contentGrid(main: string, rightRail: string, wide = false): string {
  return `<main class="bk-page"><div class="bk-content-grid ${wide ? 'bk-content-wide' : ''}"><div class="bk-main-column">${main}</div>${wide ? '' : `<aside class="bk-right-rail">${rightRail}</aside>`}</div></main>`;
}
