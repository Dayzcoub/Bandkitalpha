import type { AppState, CurrentUser, Locale, Role, ThemeMode, UiStateMode, VerificationMode } from '../../app/types.js';
import { normalizeLocale } from '../i18n/i18n.js';

type SessionUser = {
  id: string;
  email?: string;
  display_name?: string;
  handle?: string | null;
  platform_role?: string | null;
  email_verified?: boolean;
};

const storageKeys = {
  locale: 'bandkit.locale',
  role: 'bandkit.role',
  verification: 'bandkit.verification',
  uiState: 'bandkit.uiState',
  theme: 'bandkit.theme',
};

// Live session user from /auth/me (set at bootstrap by AuthClient). When present
// it is the source of truth for role/verification/currentUser; the localStorage
// values are only a dev/mock fallback used when there is no real session.
let sessionUser: SessionUser | null = null;

export function setSessionUser(user: SessionUser | null): void {
  sessionUser = user || null;
}

function read<K extends string>(key: string, allowed: readonly K[], fallback: K): K {
  const value = localStorage.getItem(key) as K | null;
  return value && allowed.includes(value) ? value : fallback;
}

// Platform roles map onto the app's coarse role enum used by route guards.
function roleFromPlatformRole(platformRole: string | null | undefined): Role {
  if (platformRole === 'super_admin') return 'super_admin';
  if (platformRole === 'platform_admin') return 'admin';
  if (platformRole === 'platform_moderator') return 'moderator';
  return 'user';
}

function elevatedRoles(role: Role): Role[] {
  if (role === 'super_admin') return ['user', 'moderator', 'admin', 'super_admin'];
  if (role === 'admin') return ['user', 'moderator', 'admin'];
  if (role === 'moderator') return ['user', 'moderator'];
  return ['user'];
}

export function loadAppState(): AppState {
  const locale = normalizeLocale(localStorage.getItem(storageKeys.locale));
  const uiState = read<UiStateMode>(storageKeys.uiState, ['normal', 'loading', 'empty', 'error', 'restricted', 'long'], 'normal');
  const theme = read<ThemeMode>(storageKeys.theme, ['dark', 'light'], 'dark');

  // The live session is the only source of identity. No session = guest —
  // the app never pretends someone is logged in (no mock fallback user).
  if (sessionUser) {
    const role = roleFromPlatformRole(sessionUser.platform_role);
    const verification: VerificationMode = sessionUser.email_verified ? 'verified' : 'emailPending';
    return { locale, role, verification, uiState, theme, currentUser: sessionCurrentUser(sessionUser, role, verification) };
  }
  return { locale, role: 'guest', verification: 'emailPending', uiState, theme, currentUser: null };
}

function sessionCurrentUser(user: SessionUser, role: Role, verification: VerificationMode): CurrentUser {
  const email = user.email || '';
  return {
    id: user.id,
    displayName: user.display_name || email,
    handle: user.handle || `@${email.split('@')[0]}`,
    roles: elevatedRoles(role),
    verification,
    reputationScore: 98,
  };
}

export function updatePreference(key: keyof typeof storageKeys, value: string): void {
  localStorage.setItem(storageKeys[key], value);
}

export function persistLocale(locale: Locale): void {
  localStorage.setItem(storageKeys.locale, locale);
}
