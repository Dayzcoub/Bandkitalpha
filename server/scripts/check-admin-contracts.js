import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

const ADMIN_ENDPOINTS = [
  { path: '/api/v1/admin/overview', file: 'src/modules/admin/admin.routes.js', handler: 'handleAdminOverview' },
  { path: '/api/v1/admin/users', file: 'src/modules/admin/admin.routes.js', handler: 'handleAdminUsers' },
  { path: '/api/v1/admin/entities', file: 'src/modules/admin/admin.routes.js', handler: 'handleAdminEntities' },
  { path: '/api/v1/admin/reports', file: 'src/modules/admin/admin.routes.js', handler: 'handleAdminReports' },
  { path: '/api/v1/admin/moderation', file: 'src/modules/admin/admin.routes.js', handler: 'handleAdminModeration' },
  { path: '/api/v1/admin/trust', file: 'src/modules/admin/admin.routes.js', handler: 'handleAdminTrust' },
  { path: '/api/v1/admin/billing', file: 'src/modules/admin/billing.routes.js', handler: 'handleAdminBilling' },
  { path: '/api/v1/admin/content', file: 'src/modules/admin/content.routes.js', handler: 'handleAdminContent' },
  { path: '/api/v1/admin/localization', file: 'src/modules/admin/localization.routes.js', handler: 'handleAdminLocalization' },
  { path: '/api/v1/admin/notifications', file: 'src/modules/admin/notifications.routes.js', handler: 'handleAdminNotifications' },
  { path: '/api/v1/admin/roles', file: 'src/modules/admin/staff.routes.js', handler: 'handleAdminStaffCatalog' },
  { path: '/api/v1/admin/settings', file: 'src/modules/admin/settings.routes.js', handler: 'handleAdminSettings' },
  { path: '/api/v1/admin/audit', file: 'src/modules/admin/admin.routes.js', handler: 'handleAdminAudit' }
];

const DANGEROUS_GUARDRAIL_PATTERN = /(write|mutation|mutations|action|actions|grant|grants|editable|delete|deletion|send|refund|role|config|maintenance|provider|private|restriction|restrictions|sanction|sanctions|blocking|access)/i;

function fail(message) {
  throw new Error(`[admin-contract] ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readRouteFile(relativePath) {
  return readFileSync(path.join(serverRoot, relativePath), 'utf8');
}

function extractFunctionSource(source, handlerName) {
  const declaration = `export async function ${handlerName}`;
  const start = source.indexOf(declaration);
  if (start === -1) fail(`missing handler export: ${handlerName}`);

  const bodyStart = source.indexOf('{', start);
  if (bodyStart === -1) fail(`missing handler body: ${handlerName}`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }

  fail(`unterminated handler body: ${handlerName}`);
}

function assertStaticContract(endpoint) {
  const routeSource = readRouteFile(endpoint.file);
  const handlerSource = extractFunctionSource(routeSource, endpoint.handler);

  assert(handlerSource.includes('sendJson(res, 200'), `${endpoint.path} must respond through sendJson(res, 200, ...)`);
  assert(/ok:\s*true/.test(handlerSource), `${endpoint.path} must include ok: true`);
  assert(/mode:\s*['"]read_only['"]/.test(handlerSource), `${endpoint.path} must include mode: 'read_only'`);
  assert(/guardrails:\s*{/.test(handlerSource), `${endpoint.path} must include guardrails`);

  const dangerousTrueMatch = handlerSource.match(/([a-zA-Z0-9_]*(?:enabled|editable|mutations|mutation|actions|action|grants|grant|access)[a-zA-Z0-9_]*)\s*:\s*true/g) || [];
  assert(
    dangerousTrueMatch.length === 0,
    `${endpoint.path} has dangerous guardrail set to true: ${dangerousTrueMatch.join(', ')}`
  );
}

function assertPayloadContract(endpoint, payload) {
  assert(payload && typeof payload === 'object', `${endpoint.path} response must be a JSON object`);
  assert(payload.ok === true, `${endpoint.path} response must include ok: true`);
  assert(payload.mode === 'read_only', `${endpoint.path} response must include mode: read_only`);
  assert(payload.guardrails && typeof payload.guardrails === 'object' && !Array.isArray(payload.guardrails), `${endpoint.path} response must include guardrails object`);

  for (const [key, value] of Object.entries(payload.guardrails)) {
    if (DANGEROUS_GUARDRAIL_PATTERN.test(key)) {
      assert(value === false, `${endpoint.path} dangerous guardrail ${key} must be false`);
    }
  }
}

async function runHttpSmoke(baseUrl) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  for (const endpoint of ADMIN_ENDPOINTS) {
    const response = await fetch(`${normalizedBaseUrl}${endpoint.path}`, {
      headers: { accept: 'application/json' }
    });

    assert(response.status === 200, `${endpoint.path} expected HTTP 200, got ${response.status}`);
    const payload = await response.json();
    assertPayloadContract(endpoint, payload);
  }
}

for (const endpoint of ADMIN_ENDPOINTS) {
  assertStaticContract(endpoint);
}

if (process.env.ADMIN_CONTRACT_BASE_URL) {
  await runHttpSmoke(process.env.ADMIN_CONTRACT_BASE_URL);
  console.log(`[admin-contract] static + HTTP checks passed for ${ADMIN_ENDPOINTS.length} endpoints`);
} else {
  console.log(`[admin-contract] static checks passed for ${ADMIN_ENDPOINTS.length} endpoints`);
  console.log('[admin-contract] set ADMIN_CONTRACT_BASE_URL=http://host to run live HTTP smoke checks');
}
