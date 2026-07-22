import { getPool } from '../../db/client.js';
import { readJsonBody, sendError, sendJson } from '../../shared/http.js';
import { resolveSessionUser } from '../auth/session.js';
import { isKnownPolicy, listAxisOptions, resolveAllPolicies, setPolicy } from './privacyPolicies.js';

// Один маршрут на все оси, а не маршрут на ось. `/me/dm-policy` (0022) был вторым — и
// последним — местом, где форма «одна ось = одна колонка» проступала наружу: восемь осей
// означали бы восемь пар маршрутов и восемь клиентских вызовов. Ось добавляется строкой в
// `privacy_axis_options`, и здесь не меняется ничего.

// GET /me/privacy — что выставлено и из чего выбирать, одним ответом: экран настроек
// иначе делал бы второй вызов ради каталога.
//
// Каталог сгруппирован по осям, потому что словари у осей разные (у `friend_request` нет
// `circle`, 0029). Один плоский список значений заставил бы UI предлагать невозможное, а
// БД — отказывать в том, что он предложил.
export async function handleGetPrivacy(req, res) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const [current, catalogue] = await Promise.all([
      resolveAllPolicies(getPool(), actor.id),
      listAxisOptions(getPool())
    ]);

    const axes = current.map((row) => ({
      axis: row.axis,
      policy: row.policy,
      options: catalogue
        .filter((option) => option.axis === row.axis)
        .map((option) => ({ policy: option.policy, label: option.label, is_default: option.is_default }))
    }));

    sendJson(res, 200, { ok: true, axes });
  } catch (error) {
    sendError(res, 500, 'PRIVACY_FAILED', 'Failed to load privacy settings');
  }
}

// PUT /me/privacy/:axis — сменить одну ось. Свою и только свою: чужая приватность не
// редактируется никем, включая staff.
export async function handleSetPrivacy(req, res, axis) {
  try {
    const actor = await resolveSessionUser(req);
    if (!actor) {
      sendError(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
      return;
    }
    const body = await readJsonBody(req);
    const policy = String(body.policy || '').trim();

    // Одна проверка на пару (ось, политика), а не две по отдельности: неизвестная ось и
    // валидное-но-не-для-этой-оси значение — одна и та же ошибка «такой двери с таким
    // замком нет». Ответ не говорит, какая из половин неверна, — незачем.
    if (!(await isKnownPolicy(getPool(), axis, policy))) {
      sendError(res, 400, 'PRIVACY_POLICY_INVALID', 'This policy is not available for this axis');
      return;
    }

    await setPolicy(getPool(), actor.id, axis, policy);
    sendJson(res, 200, { ok: true, axis, policy });
  } catch (error) {
    sendError(res, 500, 'PRIVACY_FAILED', 'Failed to update privacy settings');
  }
}
