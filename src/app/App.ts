import { loadAppState, updatePreference } from '../lib/auth/session.js';
import { createTranslator } from '../lib/i18n/i18n.js';
import { matchRoute } from './router.js';
import type { AppContext } from './types.js';
import { renderPage } from '../routes/pages.js';
import { renderShell } from '../layouts/shells.js';

const NAVIGATION_STATE_KEY = 'bkNavigationKey';
const SCROLL_STORAGE_KEY = 'bandkit.scrollPositions.v1';

type BandKitHistoryState = HistoryState & {
  [NAVIGATION_STATE_KEY]?: string;
};

type RenderOptions = {
  scrollMode?: 'top' | 'restore' | 'preserve';
  restoreKey?: string;
};

function createNavigationKey(): string {
  return `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function historyState(): BandKitHistoryState {
  return (window.history.state ?? {}) as BandKitHistoryState;
}

function navigationKeyFromState(state: BandKitHistoryState | null | undefined): string | undefined {
  return state?.[NAVIGATION_STATE_KEY];
}

function ensureInitialHistoryState(): string {
  const current = historyState();
  const existingKey = navigationKeyFromState(current);
  if (existingKey) return existingKey;
  const key = createNavigationKey();
  window.history.replaceState({ ...current, [NAVIGATION_STATE_KEY]: key }, '', window.location.href);
  return key;
}

function readScrollPositions(): Record<string, { x: number; y: number }> {
  try {
    const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { x: number; y: number }>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeScrollPositions(positions: Record<string, { x: number; y: number }>): void {
  try {
    window.sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Session storage may be unavailable in hardened browsers. Native back still works.
  }
}

function saveScrollPosition(key: string): void {
  const positions = readScrollPositions();
  positions[key] = { x: window.scrollX, y: window.scrollY };
  writeScrollPositions(positions);
}

function restoreScrollPosition(key: string): void {
  const position = readScrollPositions()[key];
  const x = position?.x ?? 0;
  const y = position?.y ?? 0;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ left: x, top: y, behavior: 'auto' });
    });
  });
}

export function createBandKitApp(root: HTMLElement) {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  let path = window.location.pathname;
  let activeNavigationKey = ensureInitialHistoryState();

  function render(options: RenderOptions = {}): void {
    const state = loadAppState();
    const match = matchRoute(path);
    const ctx: AppContext = { state, t: createTranslator(state.locale), path, match };
    document.documentElement.lang = state.locale;
    document.documentElement.dataset.theme = state.theme;
    root.innerHTML = renderShell(ctx, renderPage(ctx));
    bindEvents();

    if (options.scrollMode === 'top') {
      window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
    }
    if (options.scrollMode === 'restore' && options.restoreKey) {
      restoreScrollPosition(options.restoreKey);
    }
  }

  function navigate(nextPath: string): void {
    if (nextPath === path) return;
    saveScrollPosition(activeNavigationKey);
    const nextNavigationKey = createNavigationKey();
    activeNavigationKey = nextNavigationKey;
    path = nextPath;
    window.history.pushState({ [NAVIGATION_STATE_KEY]: nextNavigationKey }, '', nextPath);
    render({ scrollMode: 'top' });
  }

  function closeMobileMenu(): void {
    const layer = root.querySelector<HTMLElement>('[data-mobile-menu-layer]');
    layer?.classList.remove('is-open');
    layer?.setAttribute('aria-hidden', 'true');
  }

  function openMobileMenu(): void {
    const layer = root.querySelector<HTMLElement>('[data-mobile-menu-layer]');
    layer?.classList.add('is-open');
    layer?.setAttribute('aria-hidden', 'false');
  }

  function bindEvents(): void {
    root.querySelectorAll<HTMLElement>('[data-route]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        const nextPath = node.dataset.route;
        if (nextPath) {
          closeMobileMenu();
          navigate(nextPath);
        }
      });
    });
    root.querySelectorAll<HTMLElement>('[data-mobile-menu-open]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        openMobileMenu();
      });
    });
    root.querySelectorAll<HTMLElement>('[data-mobile-menu-close]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        closeMobileMenu();
      });
    });
    root.querySelectorAll<HTMLSelectElement>('select[data-pref]').forEach((node) => {
      node.addEventListener('change', () => {
        const pref = node.dataset.pref as 'locale' | 'role' | 'verification' | 'uiState' | 'theme' | undefined;
        if (pref) updatePreference(pref, node.value);
        render({ scrollMode: 'preserve' });
      });
    });
  }

  window.addEventListener('beforeunload', () => {
    saveScrollPosition(activeNavigationKey);
  });

  window.addEventListener('popstate', (event) => {
    saveScrollPosition(activeNavigationKey);
    path = window.location.pathname;
    const stateKey = navigationKeyFromState(event.state as BandKitHistoryState | null);
    activeNavigationKey = stateKey ?? ensureInitialHistoryState();
    render({ scrollMode: 'restore', restoreKey: activeNavigationKey });
  });

  render({ scrollMode: 'preserve' });
}