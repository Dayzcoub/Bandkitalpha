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

// До 1.22.0 реестр admin-маршрутов жил в `server/src/index.js` (`const adminGetRoutes`),
// и эта проверка требовала именно его. F6 сделал декларативным весь роутер: реестр —
// `server/src/routes.js`, и каждый маршрут обязан объявить свой доступ.
//
// Проверка переехала туда же и стала строже. Раньше она подтверждала, что маршрут
// зарегистрирован; теперь — что он ещё и объявлен `staff`. Регистрация без гейта была бы
// ровно той дырой, которую закрыли в 1.15.2: тринадцать эндпоинтов консоли без единой
// проверки сессии.
const routesSource = readFile('server/src/routes.js');
const routeLines = routesSource.split('\n');

for (const route of requiredAdminRoutes) {
  const declaration = routeLines.find((line) => line.includes(`path: '${route}'`));
  if (!declaration) {
    throw new Error(`admin route is not registered in server/src/routes.js: ${route}`);
  }
  if (!declaration.includes("access: 'staff'")) {
    throw new Error(`admin route is registered but not gated as staff: ${route}`);
  }
}

// Диспетчеризация — только через таблицу. Admin-путь, появившийся в `index.js` мимо неё,
// объехал бы и объявление доступа, и эту проверку.
const indexSource = readFile('server/src/index.js');
if (indexSource.includes('/admin/')) {
  throw new Error('admin routes must live in server/src/routes.js, not in index.js');
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
