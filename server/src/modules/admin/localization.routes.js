import { sendJson } from '../../shared/http.js';
import { nowIso } from './admin.shared.js';

export async function handleAdminLocalization(req, res) {
  sendJson(res, 200, {
    ok: true,
    mode: 'read_only',
    generated_at: nowIso(),
    locale_items: [],
    summary: {
      ru: 'active',
      fallback: 'en',
      namespaces: 0,
      missing_keys: 0,
      source: 'not_connected_yet'
    },
    language_packs: [
      {
        code: 'ru',
        title: 'RU / базовый язык интерфейса',
        status: 'active',
        fallback: false,
        scope: 'Основная рабочая локаль для продукта и операционной консоли.'
      },
      {
        code: 'en',
        title: 'EN / fallback locale',
        status: 'fallback',
        fallback: true,
        scope: 'Резервная локаль и будущий внешний рынок. Нужна синхронизация missing keys.'
      }
    ],
    namespaces: ['nav', 'admin', 'common', 'auth'],
    operation_types: ['check_missing_keys', 'export_json', 'import_pack', 'compare_ru_en'],
    guardrails: {
      write_actions_enabled: false,
      db_write_enabled: false,
      translation_mutations_enabled: false,
      import_enabled: false,
      export_mutations_enabled: false,
      asset_mutations_enabled: false
    }
  });
}
