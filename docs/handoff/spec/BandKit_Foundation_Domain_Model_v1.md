# BandKit — Foundation Domain Model v1

## Статус

Фундаментальная доменная модель. Источник истины для структуры данных и границ
модулей. Задаёт **обобщённое ядро**, на котором строится вся дальнейшая
разработка, чтобы расширение продукта на всю event-индустрию было **аддитивным,
а не переписыванием**.

Дополняет `BandKit_TZ_v1_2.md`. Где расходится с формулировками ТЗ v1.2 —
приоритет у этого документа (ТЗ v1.2 писалось от музыкантов; здесь модель
обобщена).

## 0. Позиционирование

BandKit — не «соцсеть музыкантов», а **операционная сеть всей event / live-production
индустрии**, где **событие — узел, связывающий всех участников**.

Изначальная задача (упростить планирование и профдеятельность музыкантов)
сохраняется как стартовый клин, но модель данных с самого начала generic:
музыканты, звук/свет-инженеры, фотографы, видеографы, диджеи, ведущие,
организаторы, продакшн-компании, прокатчики оборудования, площадки, студии,
агентства — всё это **один набор примитивов**.

## 1. Принцип проектирования

> Гибкость = правильные абстракции + швы для расширения. НЕ «построить все
> фичи сразу».

- Закладываем **ядро и границы**, а не реализацию всех функций.
- Расширение вертикали = данные (справочники) + аддитивные модули, не миграция ядра.
- Всё, что растёт (типы, роли, профессии, статусы), — **reference-таблицы, не enum**.
- Вертикально-специфичные поля — **extension-слой (JSONB / typed attributes)** поверх
  общего core, без миграции под каждую вертикаль.
- Не строим сейчас: биллинг, E2EE, PDF-генерацию, реальные вертикальные UI,
  маркетплейс-движок. Для них — **только швы** (см. §7).

## 2. Ядро — 6 примитивов

### 2.1. Party (полиморфный актор)
Единая абстракция «участник, который может действовать, быть нанятым и иметь
репутацию». Party бывает двух видов:
- **individual** — человек (привязан к `users`);
- **organization** — коллективная сущность / workspace (band, studio, agency,
  production company, rental, venue, school…).

Ключевое решение: **и человек, и организация занимают слот на событии одинаково.**
Не две разные ветки кода.

### 2.2. Profession taxonomy (справочник)
`profession → specialization → skills`, всё через reference-таблицы.
- `party ↔ profession` — **many-to-many** (человек может быть DJ и ведущим; студия
  может делать и видео, и фото).
- Новая профессия/вертикаль = строка в справочнике, не релиз.

### 2.3. Workspace / Entity (коллективный Party)
Организация как рабочая сущность: владелец, membership+роли, файлы, чаты,
события, документы, тариф, privacy, moderation state, audit.
- `entity.type` — **через reference-таблицу типов**, не `check`-enum.
- Роли участия (`entity_membership.role`) — reference/lookup, расширяемые.

### 2.4. Event (центральный узел)
Событие — точка, где сходятся все party. Владеется party-организатором.
- **Slots (требования-роли):** `{profession, specialization?, count, terms?}`.
  Абстрактно: «нужен {photographer ×1}», а не «нужен барабанщик».
- Slot может требовать **ресурс**, а не человека: `{resource_requirement: lighting_gear}`.
- Событие владеет **run-of-show** (блоки таймлайна); слоты/engagement’ы могут
  ссылаться на блок (шов, не MVP).
- Событие может принадлежать **grouping (Project/Series)** — см. §3.1.

### 2.5. Engagement (единый lifecycle всех работ)
Центральная транзакционная сущность: **party занял слот события на условиях**.
Гиг, студийная сессия, фотосъёмка, работа ведущего, **аренда техники**, бронь
площадки — это **всё Engagement**, один движок статусов.

`Engagement = { event, slot, counterparty(Party), resource_reservations[]?,
assigned_members[]?, terms(Agreement), status, completion }`

Свойства, зафиксированные стресс-тестами:
- **Симметричен по направлению.** «Организатор нанял band» и «промоутер нанял
  band ×12 в туре» — одна сущность, меняются только роли сторон.
- **Резервирует ресурсы counterparty** — так «resource booking» НЕ отдельный
  примитив, а Engagement с резервом (см. §2.6).
- **Counterparty — Party; workspace исполняет через своих members**
  (`assigned_members`). Репутация — на уровне counterparty-party; внутренняя
  ответственность бригады — внутри workspace. (Шов, не MVP.)
- **Lifecycle и completion — per-engagement, decoupled от события.** Событие может
  быть `occurred`, пока фото-engagement ещё `in_delivery`. ⚠️ Расходится с ТЗ §12,
  где completion привязан к событию — здесь исправлено.
- **Рекурсия без спец-кейсов.** «Клиент нанял организатора» — тоже Engagement.
  Организатор не особый — просто владелец события и/или нанятый party.

### 2.6. Resource / Inventory
Единственная реально новая сущность vs текущая схема. Bookable-вещи:
студийные комнаты, единицы техники (прокат), пространства площадок.
- **Resource принадлежит Party.** Венью-party владеет space-ресурсом; прокат-party
  владеет gear-единицами; студия владеет комнатами.
- Бронь ресурса = Engagement с counterparty-владельцем + `resource_reservations`.
- Свойства: availability, double-booking protection, буфер, статус.

### 2.x. Extension-слой (сквозной)
Вертикально-специфичные поля (у фотографа — оборудование/жанры съёмки; у
прокатчика — каталог техники; у band — инструменты/состав) хранятся как
**typed attributes / JSONB extension** поверх общего core Party/Event/Engagement.
Core одинаковый, «хвост» гибкий, **без миграции под каждую вертикаль**.

## 3. Сквозные механизмы

### 3.1. Grouping (Project / Series)
Event и/или Engagement могут принадлежать контейнеру-группировке (тур, сезон,
резиденция, серия съёмок). Реализуется как **light-контейнер + link-таблица**
(`project_events`, `project_engagements`), переиспользует существующий тип
сущности `project`. Не новый тяжёлый примитив, но **назван на уровне фундамента**,
чтобы Event не считался по коду standalone-топом.

### 3.2. Template → Instance с override
Load-bearing механизм наследования. Спека/условия/назначения (райдер, crew,
terms) задаются один раз на уровне Project или Template и **переопределяются на
уровне instance** (event / engagement). Пример: райдер тура применён к 12
площадкам с локальными правками; FOH назначен на тур, унаследован каждым шоу.

### 3.3. Структурированные / условные Terms (Agreement)
`terms` — это **структурированный версионируемый объект**, а не скаляр:
поддерживает guarantee + door split + expenses + предоплату + условия отмены
(«€2000 гарантии ИЛИ 70% от net door, что больше»). Движок versioning / snapshot /
PDF — общий; шаблоны — per-profession.

### 3.4. Run-of-show / itinerary
Event владеет run-of-show (блоки таймлайна); Project владеет itinerary (маршрут
тура, дни переезда). Слоты/engagement’ы могут ссылаться на блоки для
меж-engagement зависимостей. Шов, не MVP.

## 4. Общие движки поверх ядра (из ТЗ, работают для всех ролей)
- **Reputation / Trust** — надёжность/пунктуальность/неявки/завершённость.
  Универсальны для всех профессий, драйвятся completion’ом engagement’ов.
- **Agreement / Document** — versioning, immutable snapshot, PDF. Шаблоны per-profession.
- **Membership / Permissions** — контекстные роли; server-side permission service —
  источник истины (frontend-роли не безопасность).
- **Audit** — append-only на sensitive-действия.
- **Link Guard, Moderation cases, Files/media, Billing** — отдельные модули, швы.

## 5. Ревизия текущей схемы → целевая

Текущие 12 таблиц заложены под музыкантов. Load-bearing правки:

| Сейчас | Целевое | Почему дорого потом |
|---|---|---|
| `entities.type` — `check`-enum | reference-таблица `entity_types` | каждая вертикаль = миграция |
| роли/статусы — строковые enum | reference/lookup | негибко, ломает расширение |
| individual vs org не разделены как party | единый примитив **party** (individual/organization) | инверсия «нанят/наниматель» невозможна |
| `event_participants` (плоско) | **Event slots** + **Engagement** | нет абстракции требования-роли и lifecycle |
| нет engagement-сущности | таблица `engagements` (единый lifecycle) | completion/terms/статусы негде жить |
| нет resource/inventory | таблица `resources` + `resource_reservations` | прокат/студии/площадки не смоделировать |
| нет profession-таксономии | `professions`, `specializations`, `party_professions` | мульти-роль и discovery невозможны |
| профиль под инструменты | core + **extension attributes** | каждая вертикаль тянет ALTER TABLE |
| нет grouping | `projects` + `project_events`/`project_engagements` link | тур/серия = переписывание Event |

## 6. Что в первую миграцию, что — шов

**Первая foundation-миграция (ядро, чтобы не переписывать):**
1. `parties` (individual/organization) + связь с `users`/`entities`.
2. reference-таблицы: `entity_types`, `professions`, `specializations`, статусы.
3. `party_professions` (many-to-many).
4. `event_slots` + `engagements` (базовый lifecycle, terms как JSONB).
5. `resources` + `resource_reservations`.
6. `projects` + link-таблицы grouping.
7. extension-поля (JSONB) на party/event/engagement.

**Оставить швом (не строить сейчас, место заложено):**
- `assigned_members` на engagement (workspace исполняет через людей);
- run-of-show / itinerary блоки;
- template-объекты для §3.2 (пока override — вручную);
- billing, E2EE, PDF-движок, moderation cases, link guard, files.

## 7. Не-цели этой фазы
Реализация вертикальных UI, маркетплейс-движок, платежи, PDF-генерация,
E2EE-чаты. Для них — только точки расширения в модели, не код.

## 8. Приложение — валидация модели (стресс-тесты)

Ядро прогнано на двух намеренно противоположных сценариях; новых сущностей под
конкретную вертикаль не потребовалось.

**Сценарий A — свадьба (хаб нанимает многих в один день).**
Организатор-party владеет Event; слоты `{band, DJ, photographer, videographer,
host, lighting_gear, venue}`; каждый занятый слот — Engagement; площадка = party,
владеющий space-resource; свет = Engagement с прокат-party + резерв gear.
Выявил: party↔profession many-to-many; resource принадлежит party (booking
схлопывается в engagement); completion per-engagement (фото приходит через 3
недели); рекурсия «клиент→организатор».

**Сценарий B — тур band на 12 городов (один поставщик, много событий).**
Тур = Project над 12 Event; band — counterparty, нанятый 12 промоутерами;
райдер = template с per-city override; свой crew назначен на Project, унаследован
событиями; локальный прокат = Engagement с резервом в каждом городе; расчёт =
структурированные условные terms.
Выявил: grouping (Project/Series); template→override; terms структурированные.

Обе оси нагрузки легли на симметричную сущность Engagement — свидетельство, что
ядро generic, а не подогнано под один сценарий.
