import { getAsset, type AssetKey } from '../../lib/assets/assetRegistry.js';
import { escapeHtml } from '../../lib/security/linkPolicy.js';

export function img(assetKey: AssetKey, className: string, alt: string): string {
  return `<img class="${className}" src="${getAsset(assetKey)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`;
}

export function button(label: string, variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'secondary', route?: string): string {
  const routeAttr = route ? ` data-route="${escapeHtml(route)}"` : '';
  return `<button class="bk-button bk-button-${variant}" type="button"${routeAttr}>${escapeHtml(label)}</button>`;
}

export function iconButton(label: string, assetKey: AssetKey, route?: string): string {
  const routeAttr = route ? ` data-route="${escapeHtml(route)}"` : '';
  return `<button class="bk-button bk-icon-button" type="button" aria-label="${escapeHtml(label)}"${routeAttr}>${img(assetKey, 'bk-nav-icon', '')}</button>`;
}

export function badge(label: string, tone: 'neutral' | 'positive' | 'warning' | 'danger' = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

export function card(content: string, extraClass = ''): string {
  return `<section class="bk-card ${extraClass}">${content}</section>`;
}

export function cardHeader(title: string, meta = '', assetKey: AssetKey = 'mark'): string {
  const metaHtml = meta ? `<div class="bk-meta">${escapeHtml(meta)}</div>` : '';
  return `<div class="bk-card-header">${img(assetKey, 'bk-avatar', '')}<div><h3 class="bk-card-title">${escapeHtml(title)}</h3>${metaHtml}</div></div>`;
}

export function listRow(title: string, meta: string, assetKey: AssetKey, trailing = ''): string {
  return `<div class="bk-list-row">${img(assetKey, 'bk-avatar', '')}<div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(title)}</div><div class="bk-meta">${escapeHtml(meta)}</div></div>${trailing}</div>`;
}

export function kpi(value: string | number, label: string): string {
  return `<div class="bk-kpi"><div class="bk-kpi-value">${escapeHtml(String(value))}</div><div class="bk-kpi-label">${escapeHtml(label)}</div></div>`;
}

export function formField(label: string, inputHtml: string, hint = ''): string {
  const hintHtml = hint ? `<div class="bk-hint">${escapeHtml(hint)}</div>` : '';
  return `<label class="bk-field"><span class="bk-label">${escapeHtml(label)}</span>${inputHtml}${hintHtml}</label>`;
}
