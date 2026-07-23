# BandKit — Reliability Sanction Gate Checkpoint 1.28.1

## Status

Accepted checkpoint. **Ноль миграций.** Security-фикс в reputation-фундаменте
(оставленном в 1.28.0). Найдено при аудите «утечки / несанкционированное использование»
по запросу владельца.

---

## Находка: санкционированный пользователь сохранял write-доступ к репутации

`canRecordReliabilityEvent` и путь резолюции диспута падали в голый `canManageEntity`,
который **не проверяет `isBarred(actor)`** — в отличие от `canWriteMessage` и
`canCreateEntity`. Следствие: аккаунт под модерационной санкцией (`restricted` /
`read_only` / `blocked`), оставаясь активным менеджером сущности, мог:

- **записывать** reliability-события о контрагентах (влиять на чужую репутацию);
- **резолвить** диспуты (`upheld`/`retracted`).

Это прямо противоречит Moderation Rules «restrict user action», которое чат уже
соблюдает. Запись репутации — content production и сильнее сообщения в чате: чат
санкционированному закрыт, репутация была открыта.

**Класс — не новый.** Слайсы reliability (1.11.x) старше `isBarred`/SANCTIONED (1.11.6+),
и ретрофит бара до них не дошёл. Тот же паттерн «маршрут старше правила, которое должно
его сторожить», что F2 нашёл у заявок в друзья и F4 — у ангажемента. Девятый экземпляр
того же класса за проект.

**Утечки данных нет.** Декларативный роутер (F6) закрывает класс «аноним дошёл до данных»;
все чтения ограничены (`/me/reliability` — по `user_id`, сводка — verified-context со
слоями, roster — только свой engagement); id — `uuid gen_random_uuid()`, перебор нереален.

---

## Фикс: бар на write, но не на защиту

Три действия — три разных ответа, а не один бар на всё:

| Действие | Правило | Почему |
|---|---|---|
| Запись события | `!isBarred && canManageEntity` | content production — «restrict user action» |
| Резолюция диспута | `!isBarred && canManageEntity` (`canResolveReliabilityDispute`) | организаторская власть — write |
| Открытие диспута (о себе) | `!isDenied` (`canOpenReliabilityDispute`) | защита своей репутации, как `canFileReport`: `restricted` сохраняет, иначе санкция затыкает возможную жертву |
| Чтение roster | `canViewReliabilityEvents` (без бара) | чтение остаётся у `restricted` (модель §санкции) |

Тонкость реализации: общий guard `requireEngagementManager` обслуживает и запись (POST), и
чтение roster (GET). Бар положен **не в guard**, а в POST-хендлере — иначе `restricted`
менеджер потерял бы и чтение, которое ему по модели положено. Guard оставлен на
read-doorway (`canViewReliabilityEvents`) и теперь возвращает `membership`, чтобы хендлер
применил write-бар без второго запроса.

Открытие диспута денай-гейтнуто **до** чтения записи — заодно не течёт факт её
существования.

---

## Матрица после фикса

```text
                     active-mgr  restricted-mgr  blocked/gone  staff
запись (POST)            ✓            403            403         —
чтение roster (GET)      ✓             ✓              —          —
открыть диспут (свой)    ✓             ✓             403         —
резолв диспута (PATCH)   ✓            403            403         ✓
сводка (GET)          не тронуто — verified-context
```

---

## Что НЕ сделано (осознанный долг)

- **Юнит-теста на бар нет.** Харнесса для `PermissionService` в проекте не существует, а
  шелл-smoke принципиально не сеет `restricted`-юзера с engagement (он даже проверяет, что
  `/dev/seed-demo` удалён). Правильный дом для проверки — юнит-харнесс `PermissionService`,
  когда он появится. Пока — логическая матрица выше + `node --check`.
- **LOW-находка не закрыта:** roster (`handleListReliabilityEvents`) отдаёт слои
  `moderation`/`hidden` менеджерам сущности, тогда как сводка держит `moderation` за staff.
  Не межарендаторная утечка (все записи — своего engagement), рассинхрон модели видимости.
  Оставлено на отдельное решение.

---

## Цена

Ноль миграций. Правки в двух файлах (`PermissionService.js`, `reliability.routes.js`),
три новых permission-метода, один сдвиг guard→handler. Верификация — `node --check` +
матрица; preview не применим (backend-права).
