import { img, button } from './primitives.js';

export function loadingState(title: string, copy: string): string {
  return `<section class="bk-card bk-loading" aria-live="polite"><div class="bk-skeleton bk-illustration"></div><h2 class="bk-state-title">${title}</h2><p class="bk-state-copy">${copy}</p><div class="bk-list" aria-hidden="true"><div class="bk-skeleton"></div><div class="bk-skeleton"></div><div class="bk-skeleton"></div></div></section>`;
}

export function emptyState(title: string, copy: string, actionLabel: string, assetKey: 'emptyPosts' | 'emptyMessages' | 'emptyFiles' | 'emptyEvents' | 'emptyNoAccess' | 'emptyRestricted' | 'emptyVerification' = 'emptyPosts'): string {
  return `<section class="bk-card bk-empty">${img(assetKey, 'bk-illustration', '')}<h2 class="bk-state-title">${title}</h2><p class="bk-state-copy">${copy}</p>${button(actionLabel, 'secondary')}</section>`;
}

export function errorState(title: string, copy: string, retryLabel: string): string {
  return `<section class="bk-card bk-error" role="alert">${img('emptyNoAccess', 'bk-illustration', '')}<h2 class="bk-state-title">${title}</h2><p class="bk-state-copy">${copy}</p>${button(retryLabel, 'secondary')}</section>`;
}

export function restrictedState(title: string, copy: string, actionLabel: string, verification = false): string {
  const asset = verification ? 'emptyVerification' : 'emptyRestricted';
  return `<section class="bk-card bk-restricted">${img(asset, 'bk-illustration', '')}<h2 class="bk-state-title">${title}</h2><p class="bk-state-copy">${copy}</p>${button(actionLabel, 'primary', verification ? '/settings/security' : '/feed')}</section>`;
}
