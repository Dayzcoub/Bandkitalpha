import type { AppContext } from '../../app/types.js';

export function canSeeDiagnostics(ctx: AppContext): boolean {
  return ctx.state.role === 'super_admin';
}

export function canSeeTechnicalLabels(ctx: AppContext): boolean {
  return ctx.state.role === 'super_admin';
}
