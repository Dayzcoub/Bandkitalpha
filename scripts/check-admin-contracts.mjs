import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const adminRouteFiles = [
  'server/src/modules/admin/admin.routes.js',
  'server/src/modules/admin/billing.routes.js',
  'server/src/modules/admin/content.routes.js',
  'server/src/modules/admin/localization.routes.js',
  'server/src/modules/admin/notifications.routes.js',
  'server/src/modules/admin/settings.routes.js',
  'server/src/modules/admin/staff.routes.js'
];

const requiredAdminRoutes = [
  '/admin/overview',
  '/admin/users',
  '/admin/entities',
  '/admin/reports',
  '/admin/moderation',
  '/admin/trust',
  '/admin/billing',
  '/admin/content',
  '/admin/localization',
  '/admin/notifications',
  '/admin/roles',
  '/admin/settings',
  '/admin/audit'
];

const requiredFrontendInitializers = [
  'initPlatformAdminConsole',
  'initPlatformAdminReadOnlyDataBridge',
  'initPlatformAdminBillingReadOnlyBridge',
  'initPlatformAdminContentReadOnlyBridge',
  'initPlatformAdminLocalizationReadOnlyBridge',
  'initPlatformAdminNotificationsReadOnlyBridge',
  'initPlatformAdminRolesReadOnlyBridge',
  'initPlatformAdminSettingsReadOnlyBridge'
];

const forbiddenWriteGuardrails = [
  'write_actions_enabled: true',
  'sensitive_actions_enabled: true',
  'private_message_access_enabled: true',
  'billing_mutations_enabled: true',
  'role_mutations_enabled: true',
  'user_restrictions_enabled: true',
  'role_mutations_enabled: true',
  'two_factor_reset_enabled: true',
  'private_data_access_enabled: true',
  'entity_internal_settings_editable: true',
  'ownership_mutations_enabled: true',
  'moderation_decisions_enabled: true',
  'content_mutation_enabled: true',
  'private_message_bulk_access_enabled: true',
  'entity_visibility_mutations_enabled: true',
  'sanctions_enabled: true',
  'auto_blocking_enabled: true',
  'message_restrictions_enabled: true',
  'rating_mutations_enabled: true',
  'audit_mutation_enabled: true',
  'raw_sensitive_metadata_enabled: true',
  'payment_mutations_enabled: true',
  'refund_actions_enabled: true',
  'entitlement_mutations_enabled: true',
  'tariff_mutations_enabled: true',
  'manual_access_grants_enabled: true',
  'post_mutations_enabled: true',
  'media_mutations_enabled: true',
  'category_mutations_enabled: true',
  'publication_mutations_enabled: true',
  'deletion_enabled: true',
  'db_write_enabled: true',
  'translation_mutations_enabled: true',
  'import_enabled: true',
  'export_mutations_enabled: true',
  'asset_mutations_enabled: true',
  'send_actions_enabled: true',
  'bulk_send_enabled: true',
  'subscription_mutations_enabled: true',
  'template_mutations_enabled: true',
  'private_message_content_enabled: true',
  'config_mutations_enabled: true',
  'registration_policy_mutations_enabled: true',
  'maintenance_toggle_enabled: true',
  'provider_mutations_enabled: true',
  'two_factor_policy_mutations_enabled: true',
  'changes_enabled: true'
];

function readFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label} is missing: ${expected}`);
  }
}

const indexSource = readFile('server/src/index.js');
assertIncludes(indexSource, 'const adminGetRoutes = [', 'admin route registry');
assertIncludes(indexSource, "if (req.method === 'GET')", 'admin route method guard');

for (const route of requiredAdminRoutes) {
  assertIncludes(indexSource, `path: '${route}'`, 'admin GET route registry');
}

for (const route of requiredAdminRoutes) {
  const legacyIf = `url.pathname === \`${'${env.apiPrefix}'}${route}\``;
  if (indexSource.includes(legacyIf)) {
    throw new Error(`Admin route should stay in adminGetRoutes registry, not legacy if-chain: ${route}`);
  }
}

for (const routeFile of adminRouteFiles) {
  const source = readFile(routeFile);
  assertIncludes(source, "mode: 'read_only'", `${routeFile} read-only mode`);
  assertIncludes(source, 'guardrails:', `${routeFile} guardrails`);

  for (const forbidden of forbiddenWriteGuardrails) {
    if (source.includes(forbidden)) {
      throw new Error(`${routeFile} must not enable guardrail: ${forbidden}`);
    }
  }
}

const frontendEntrySource = readFile('src/main.ts');
assertIncludes(frontendEntrySource, 'const platformAdminInitializers:', 'platform admin frontend initializer registry');

for (const initializer of requiredFrontendInitializers) {
  assertIncludes(frontendEntrySource, initializer, 'platform admin frontend initializer');
}

console.log(`[OK] Admin route registry contains ${requiredAdminRoutes.length} read-only endpoints.`);
console.log('[OK] Admin route files keep read-only mode and disabled write/sensitive guardrails.');
console.log(`[OK] Frontend admin registry contains ${requiredFrontendInitializers.length} initializers.`);
