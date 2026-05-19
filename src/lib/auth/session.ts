import type { AppState, CurrentUser, Locale, Role, ThemeMode, UiStateMode, VerificationMode } from '../../app/types.js';
import { normalizeLocale } from '../i18n/i18n.js';

const storageKeys = {
  locale: 'bandkit.locale',
  role: 'bandkit.role',
  verification: 'bandkit.verification',
  uiState: 'bandkit.uiState',
  theme: 'bandkit.theme',
};

function read<K extends string>(key: string, allowed: readonly K[], fallback: K): K {
  const value = localStorage.getItem(key) as K | null;
  return value && allowed.includes(value) ? value : fallback;
}

export function loadAppState(): AppState {
  const locale = normalizeLocale(localStorage.getItem(storageKeys.locale));
  const role = read<Role>(storageKeys.role, ['guest', 'user', 'moderator', 'admin', 'super_admin'], 'user');
  const verification = read<VerificationMode>(storageKeys.verification, ['verified', 'emailPending', 'phonePending', 'twoFactorRequired', 'restrictedAccount'], 'verified');
  const uiState = read<UiStateMode>(storageKeys.uiState, ['normal', 'loading', 'empty', 'error', 'restricted', 'long'], 'normal');
  const theme = read<ThemeMode>(storageKeys.theme, ['dark', 'light'], 'dark');
  const currentUser = role === 'guest' ? null : createCurrentUser(role, verification);
  return { locale, role, verification, uiState, theme, currentUser };
}

function createCurrentUser(role: Role, verification: VerificationMode): CurrentUser {
  const elevated: Role[] = role === 'super_admin'
    ? ['user', 'moderator', 'admin', 'super_admin']
    : role === 'admin'
      ? ['user', 'moderator', 'admin']
      : role === 'moderator'
        ? ['user', 'moderator']
        : ['user'];
  return {
    id: 'mock-current-user',
    displayName: role === 'admin' ? 'BandKit Admin' : role === 'moderator' ? 'BandKit Moderator' : 'Alex Rhythm',
    handle: role === 'admin' ? '@admin' : role === 'moderator' ? '@moderator' : '@alex-rhythm',
    roles: elevated,
    verification,
    reputationScore: role === 'user' ? 92 : 98,
  };
}

export function updatePreference(key: keyof typeof storageKeys, value: string): void {
  localStorage.setItem(storageKeys[key], value);
}

export function persistLocale(locale: Locale): void {
  localStorage.setItem(storageKeys.locale, locale);
}
