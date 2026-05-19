export type Locale = 'ru' | 'en';
export type Role = 'guest' | 'user' | 'moderator' | 'admin' | 'super_admin';
export type VerificationMode = 'verified' | 'emailPending' | 'phonePending' | 'twoFactorRequired' | 'restrictedAccount';
export type UiStateMode = 'normal' | 'loading' | 'empty' | 'error' | 'restricted' | 'long';
export type ThemeMode = 'dark' | 'light';
export type ShellType = 'public' | 'auth' | 'app' | 'admin';
export type AccessLevel = 'any' | 'guest' | 'pending' | 'user' | 'verified' | 'band_admin' | 'event_admin' | 'moderator' | 'admin' | 'super_admin';

export interface CurrentUser {
  id: string;
  displayName: string;
  handle: string;
  roles: Role[];
  verification: VerificationMode;
  reputationScore: number;
}

export interface AppState {
  locale: Locale;
  role: Role;
  verification: VerificationMode;
  uiState: UiStateMode;
  theme: ThemeMode;
  currentUser: CurrentUser | null;
}

export interface RouteDefinition {
  path: string;
  shell: ShellType;
  access: AccessLevel;
  titleKey: string;
  subtitleKey?: string;
  navKey?: string;
  iconKey?: string;
  section: 'public' | 'auth' | 'app' | 'admin';
  exact?: boolean;
  wide?: boolean;
}

export interface RouteMatch {
  route: RouteDefinition;
  params: Record<string, string>;
}

export interface AppContext {
  state: AppState;
  t: (key: string, vars?: Record<string, string | number>) => string;
  path: string;
  match: RouteMatch;
}
