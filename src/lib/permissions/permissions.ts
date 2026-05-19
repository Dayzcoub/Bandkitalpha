import type { AccessLevel, AppState, Role } from '../../app/types.js';

const roleRank: Record<Role, number> = {
  guest: 0,
  user: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

export function hasRole(state: AppState, role: Role): boolean {
  if (!state.currentUser) return role === 'guest';
  if (role === 'guest') return false;
  return state.currentUser.roles.includes(role) || roleRank[state.role] >= roleRank[role];
}

export function isVerified(state: AppState): boolean {
  return Boolean(state.currentUser) && state.verification === 'verified';
}

export function hasTwoFactor(state: AppState): boolean {
  return Boolean(state.currentUser) && state.verification !== 'twoFactorRequired' && state.verification !== 'restrictedAccount';
}

export function canAccess(access: AccessLevel, state: AppState): boolean {
  switch (access) {
    case 'any': return true;
    case 'guest': return !state.currentUser;
    case 'pending': return true;
    case 'user': return Boolean(state.currentUser) && state.verification !== 'restrictedAccount';
    case 'verified': return isVerified(state);
    case 'band_admin': return hasRole(state, 'admin') || hasRole(state, 'moderator');
    case 'event_admin': return hasRole(state, 'admin') || hasRole(state, 'moderator');
    case 'moderator': return hasRole(state, 'moderator') && hasTwoFactor(state);
    case 'admin': return hasRole(state, 'admin') && hasTwoFactor(state);
    case 'super_admin': return hasRole(state, 'super_admin') && hasTwoFactor(state);
    default: return false;
  }
}

export function requiresVerification(action: string): boolean {
  return ['post:create', 'message:send', 'event:create', 'marketplace:contact', 'complaint:create'].includes(action);
}

export function can(action: string, resource: string, state: AppState): boolean {
  if (!state.currentUser) return false;
  if (state.verification === 'restrictedAccount') return false;
  if (requiresVerification(action) && !isVerified(state)) return false;
  if (resource === 'admin') return hasRole(state, 'admin');
  if (resource === 'moderation') return hasRole(state, 'moderator');
  return true;
}
