// SharedContext — «есть ли у этих двоих общий подтверждённый контекст».
//
// Жил приватной функцией внутри `chats.routes.js`, пока спрашивал только чат. С F2 его
// спрашивает и Friends (политика `shared_context` у оси `friend_request`), а импорт из
// chats дал бы цикл: chats уже импортирует `areFriends` из friends. Вынос — не рефакторинг
// ради красоты: правило «есть ли общий контекст спрашивают у SharedContext, а не считают
// сами» (CLAUDE.md) существует ровно для того, чтобы второй потребитель не завёл второй
// ответ на этот вопрос, а `Architecture_Decisions §4.14` называет вынос долгом кода.
//
// Здесь по-прежнему нет `Communication §5` целиком: полный список источников и срок
// давности — F8, ещё не решённый. Пока это те же два источника, что были в чате с 1.17.0,
// и ни одного нового.
import { getPool } from '../../db/client.js';

// Активное членство в одной сущности или подтверждённое участие в одном событии
// (`Conversation Lifecycle §2`, «пользователи с общим подтверждённым контекстом»).
//
// `db` — пул или уже взятое соединение: домен зовёт это, уже держа клиента («соединение
// берут последним», 1.16.2).
export async function hasSharedContext(db, actorId, otherId) {
  const result = await (db || getPool()).query(
    `select exists (
       select 1
         from entity_memberships a
         join entity_memberships b on b.entity_id = a.entity_id
        where a.user_id = $1 and b.user_id = $2
          and a.status = 'active' and b.status = 'active'
     ) or exists (
       select 1
         from event_participants a
         join event_participants b on b.event_id = a.event_id
        where a.user_id = $1 and b.user_id = $2
          and a.status = 'confirmed' and b.status = 'confirmed'
     ) as shared`,
    [actorId, otherId]
  );
  return Boolean(result.rows[0]?.shared);
}
