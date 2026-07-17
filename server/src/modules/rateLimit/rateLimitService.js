// Rate Limiting — платформенный сервис (D5, D6, D10).
//
// Единственный лимитер в проекте. `ChatLimiter`, `InvitationLimiter` и любой доменный
// счётчик запрещены решением D5: пять доменов со своими правилами — это пять разных
// ответов на один вопрос и ни одного места, где видно общую картину.
//
// D10 делит ответственность так: **сервис владеет механизмом, домен владеет смыслом**.
// Здесь — окна, счёт, cooldown и ответ при превышении. Здесь НЕ решается, что считать
// действием и почему у него такой лимит: это `RATE_LIMIT_POLICIES` рядом с маршрутами.
// Сервис не знает, что такое «заявка в друзья», и знать не должен.
import { getPool } from '../../db/client.js';

// Политики. Ключ объявляется у маршрута (`routes.js`) или запрашивается доменом явно,
// когда смысл известен только ему.
//
// Числа — стартовые и намеренно щедрые: цель среза — чтобы неограниченного write-пути не
// осталось, а не угадать точный порог. Пользователей ноль, наблюдений нет; подбирать
// пороги по интуиции, а потом защищать их как выстраданные — худший вариант.
export const RATE_LIMIT_POLICIES = {
  // Чтение. Не «забыли», а решение: read-путь не создаёт ничего и никого не беспокоит.
  none: null,

  // Все остальные записи. Потолок от «сломался клиент или скрипт», а не от спама.
  'write.default': { maxEvents: 300, windowSeconds: 3600, cooldownSeconds: 0 },

  // Три пути, каждый из которых кладёт уведомление незнакомцу. Ради них всё и делалось.
  // Сутки, а не час: спам заявками — это про день, а не про минуту.
  'friend.request': { maxEvents: 20, windowSeconds: 86400, cooldownSeconds: 3 },
  // Он же ограничивает перебор email: хендлер отвечает 404, если пользователя нет, а
  // считаются попытки (миграция 0027, решение 3).
  'entity.invite': { maxEvents: 20, windowSeconds: 86400, cooldownSeconds: 3 },
  // «Лимиты на создание диалогов» (§2). Открыть диалог — ещё не написать в него.
  'conversation.open': { maxEvents: 30, windowSeconds: 86400, cooldownSeconds: 3 },

  // «Лимиты на requests» (§2). Списывается не маршрутом, а доменом: маршрут
  // `POST /chat-rooms/:id/messages` обслуживает и первое обращение к незнакомцу, и сотое
  // сообщение в принятом диалоге, а разница между ними известна только чату. Ровно тот
  // случай, ради которого D10 разделяет механизм и смысл.
  'conversation.request': { maxEvents: 10, windowSeconds: 86400, cooldownSeconds: 30 }
};

export function isKnownPolicy(key) {
  return Object.prototype.hasOwnProperty.call(RATE_LIMIT_POLICIES, key);
}

// Списывает одну попытку. Возвращает { allowed } или { allowed: false, retryAfterSeconds }.
//
// `db` — пул или уже взятое соединение. Параметр, а не `getPool()` внутри, из-за правила
// «соединение берут последним»: домен зовёт этот сервис, уже держа клиента, и второй
// захват при `max: 5` вешал пул (замерено, чекпоинт 1.16.2). Диспетчер соединения не
// держит и передаёт пул.
//
// Одним запросом, без транзакции. Гонка возможна: два одновременных запроса могут оба
// увидеть `used = max - 1` и оба записаться. Перебор на единицу при щедрых порогах ничего
// не значит, а `for update` на горячем пути стоил бы дороже, чем проблема, которую решает.
export async function consumeRateLimit(db, actorUserId, policyKey) {
  const policy = RATE_LIMIT_POLICIES[policyKey];
  if (policy === null) return { allowed: true };
  if (!policy) {
    // Сюда не попасть: ключи проверяются на старте (`router.js`). Если попали — значит
    // проверка обойдена, и тогда закрыто безопаснее, чем открыто.
    return { allowed: false, retryAfterSeconds: 60 };
  }

  const { rows } = await db.query(
    `with pruned as (
       -- Чистка того же актора по той же политике: строка старше окна не значит ничего
       -- (0027, решение 4). Тем же индексом, что и счёт ниже.
       delete from rate_limit_events
        where actor_user_id = $1 and policy_key = $2
          and created_at <= now() - make_interval(secs => $3::int)
     ),
     recent as (
       select count(*)::int as used, max(created_at) as last_at
         from rate_limit_events
        where actor_user_id = $1 and policy_key = $2
          and created_at > now() - make_interval(secs => $3::int)
     ),
     inserted as (
       insert into rate_limit_events (actor_user_id, policy_key)
       select $1, $2 from recent
        where recent.used < $4::int
          and (recent.last_at is null or recent.last_at <= now() - make_interval(secs => $5::int))
       returning id
     )
     select
       (select count(*) from inserted)::int as written,
       recent.used,
       -- Сколько ждать. Каждый срок считается ТОЛЬКО если он и правда мешает: окно
       -- освободится, лишь когда оно заполнено, а иначе «до ухода самого старого
       -- события» — это целое окно, и ответ был бы «приходи через сутки» на трёхсекундном
       -- cooldown. Ровно этим первая версия и врала.
       greatest(
         case when recent.used >= $4::int then
           coalesce(ceil(extract(epoch from (
             (select min(created_at) from rate_limit_events
               where actor_user_id = $1 and policy_key = $2
                 and created_at > now() - make_interval(secs => $3::int))
             + make_interval(secs => $3::int) - now()
           )))::int, 0)
         else 0 end,
         case when recent.last_at is not null then
           coalesce(ceil(extract(epoch from (
             recent.last_at + make_interval(secs => $5::int) - now()
           )))::int, 0)
         else 0 end
       ) as retry_after
       from recent`,
    [actorUserId, policyKey, policy.windowSeconds, policy.maxEvents, policy.cooldownSeconds]
  );

  const row = rows[0];
  if (row.written > 0) return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.max(1, row.retry_after || 1) };
}
