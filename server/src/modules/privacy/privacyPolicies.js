// Privacy — хранение и резолвинг политик. Механизм, не домен (F2, §3.2).
//
// Единого домена Privacy в проекте нет и не заводится: D8 запрещает god-объект, который
// владел бы кусками каждого домена. «Кто может мне писать» принадлежит Communication,
// «кто может слать заявку в друзья» — Friends, и смысл каждой оси остаётся там. Общее
// здесь — только форма хранения и ответ на вопрос «какая политика у этого пользователя по
// этой оси», который для всех осей одинаков.
//
// Разделение то же, что у Rate Limiting (D10): **механизм здесь, смысл — в домене.** Этот
// файл не знает, что такое `dm` и чем она отличается от `friend_request`; он знает, что
// ось имеет варианты, ровно один из них дефолтный, а строка пользователя — отклонение.
// Кто удовлетворяет политике — тоже не здесь: это `PermissionService.satisfiesPolicy`,
// потому что это решение, а не запрос.
//
// `db` — пул или уже взятое соединение, как у rateLimitService и по той же причине:
// правило «соединение берут последним». Домен зовёт резолв, уже держа клиента, и второй
// захват при `max: 5` вешает пул (замерено, чекпоинт 1.16.2).

// Одна ось. Возвращает политику или null, если оси не существует — вызывающий обязан
// упасть закрыто: политика, которая не резолвится, не значит «можно всем».
export async function resolvePolicy(db, userId, axis) {
  const result = await db.query(
    `select coalesce(chosen.policy, fallback.policy) as policy
       from (select policy from privacy_axis_options where axis = $2 and is_default) fallback
       left join (select policy from user_privacy_policies where user_id = $1 and axis = $2) chosen
         on true`,
    [userId, axis]
  );
  return result.rows[0]?.policy ?? null;
}

// Все оси одной строкой на ось. `is_default` в WHERE — это и есть перечисление осей:
// partial unique index из 0029 гарантирует ровно одну дефолтную строку на ось, поэтому
// ось не может ни продублироваться, ни исчезнуть из выдачи.
export async function resolveAllPolicies(db, userId) {
  const result = await db.query(
    `select o.axis, coalesce(chosen.policy, o.policy) as policy
       from privacy_axis_options o
       left join user_privacy_policies chosen
         on chosen.user_id = $1 and chosen.axis = o.axis
      where o.is_default
      order by o.axis`,
    [userId]
  );
  return result.rows;
}

// Каталог для UI: какие оси есть и какие значения у каждой допустимы. Словари у осей
// РАЗНЫЕ (у `friend_request` нет `circle`), поэтому это выдача по осям, а не один общий
// список значений — общий список означал бы, что UI предложит невозможное.
export async function listAxisOptions(db) {
  const result = await db.query(
    `select axis, policy, label, is_default
       from privacy_axis_options
      order by axis, sort_order, policy`
  );
  return result.rows;
}

// Валиден ли (ось, политика) — до записи, ради честного 400 вместо 500 от FK. Составной FK
// в 0029 остаётся последним словом: эта проверка для сообщения об ошибке, а не для
// целостности.
export async function isKnownPolicy(db, axis, policy) {
  const result = await db.query(
    'select 1 from privacy_axis_options where axis = $1 and policy = $2 limit 1',
    [axis, policy]
  );
  return result.rowCount > 0;
}

// Выставить политику. Дефолт удаляет строку, а не пишет её: строка — отклонение от
// дефолта (0029). Иначе «вернул как было» оставляло бы след, неотличимый от осознанного
// выбора, и смена дефолта продукта молча переписала бы его.
export async function setPolicy(db, userId, axis, policy) {
  const defaultRow = await db.query(
    'select policy from privacy_axis_options where axis = $1 and is_default',
    [axis]
  );
  if (defaultRow.rows[0]?.policy === policy) {
    await db.query('delete from user_privacy_policies where user_id = $1 and axis = $2', [userId, axis]);
    return;
  }
  await db.query(
    `insert into user_privacy_policies (user_id, axis, policy)
     values ($1, $2, $3)
     on conflict (user_id, axis) do update set policy = excluded.policy, updated_at = now()`,
    [userId, axis, policy]
  );
}
