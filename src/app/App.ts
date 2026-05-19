import { loadAppState, updatePreference } from '../lib/auth/session.js';
import { createTranslator } from '../lib/i18n/i18n.js';
import { matchRoute } from './router.js';
import type { AppContext } from './types.js';
import { renderPage } from '../routes/pages.js';
import { renderShell } from '../layouts/shells.js';

export function createBandKitApp(root: HTMLElement) {
  let path = window.location.pathname;

  function render(): void {
    const state = loadAppState();
    const match = matchRoute(path);
    const ctx: AppContext = { state, t: createTranslator(state.locale), path, match };
    document.documentElement.lang = state.locale;
    document.documentElement.dataset.theme = state.theme;
    root.innerHTML = renderShell(ctx, renderPage(ctx));
    bindEvents();
  }

  function navigate(nextPath: string): void {
    path = nextPath;
    window.history.pushState({}, '', nextPath);
    render();
  }

  function bindEvents(): void {
    root.querySelectorAll<HTMLElement>('[data-route]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        const nextPath = node.dataset.route;
        if (nextPath) navigate(nextPath);
      });
    });
    root.querySelectorAll<HTMLSelectElement>('select[data-pref]').forEach((node) => {
      node.addEventListener('change', () => {
        const pref = node.dataset.pref as 'locale' | 'role' | 'verification' | 'uiState' | 'theme' | undefined;
        if (pref) updatePreference(pref, node.value);
        render();
      });
    });
  }

  window.addEventListener('popstate', () => {
    path = window.location.pathname;
    render();
  });

  render();
}
