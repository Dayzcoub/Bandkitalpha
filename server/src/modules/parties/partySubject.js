// Party — указатель, а не состояние. Решение владельца F4 (Architecture Freeze,
// `Architecture_Decisions_v1 §7`). Чекпоинт 1.27.0.
//
// У Party НЕТ своего статуса и не будет. `parties` — это (kind, user_id XOR entity_id) с
// CHECK, который требует ровно одну связь, и cascade с обеих сторон: Party без субъекта не
// существует физически. Колонка статуса рядом с таким указателем была бы вторым описанием
// того, что лежит в одном join'е, и рассинхронизировалась бы в первый же день — синхронно
// её держал бы только триггер, копирующий чужое поле. Это D8 буквально.
//
// ПОЧЕМУ ДАЖЕ ПРОИЗВОДНОГО СТАТУСА НЕТ. Соблазн — вьюха `party_status`. Но общего словаря
// у субъектов не существует:
//
//   users     active | deactivated | anonymized          (0023)
//   entities  draft | active | paused | archived | deleted (0030)
//
// Свести их в один словарь — ровно то, что запрещает D11: унификация ради единообразия,
// без доказательства эквивалентности моделей. «Активна ли эта Party?» — на деле два разных
// вопроса к двум разным машинам.
//
// Производится не статус, а ОТВЕТ. Вопрос «может ли эта Party быть контрагентом» общий, и
// общим может быть его результат; словари при этом остаются каждый в своей таблице и
// никуда не переезжают.
import { getPool } from '../../db/client.js';

// Субъект Party со своим — не приведённым — статусом. Возвращает null, если Party нет.
// Это lookup, а не решение: решение принимает `PermissionService.canEngageParty`
// (в проекте запрос принадлежит маршруту, решение — сервису).
//
// `db` — пул или уже взятое соединение («соединение берут последним», 1.16.2).
export async function loadPartySubject(db, partyId) {
  const result = await (db || getPool()).query(
    `select p.id as party_id,
            p.kind,
            coalesce(u.status, e.status) as subject_status
       from parties p
       left join users u on u.id = p.user_id
       left join entities e on e.id = p.entity_id
      where p.id = $1
      limit 1`,
    [partyId]
  );
  return result.rows[0] || null;
}
