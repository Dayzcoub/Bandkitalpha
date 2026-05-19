# BandKit Interface Layout Contract v1.0

Статус документа: обязательный контракт разметки для разработки BandKit.  
Назначение: зафиксировать утверждённую компоновку интерфейса так, чтобы при реализации экраны собирались сразу по единой системе, без бесконечных правок вида «подровнять», «сдвинуть на пару пикселей», «кнопка прыгает», «блок не той ширины».

Документ дополняет основное ТЗ BandKit и production asset pack. Если в будущем дизайн будет расширяться, сначала обновляется этот контракт, затем компоненты/UI Kit, и только потом экраны.

---

## 1. Главный принцип

BandKit проектируется как профессиональная социальная сеть и рабочая среда для музыкантов, групп, оркестров, студий, площадок, организаторов и технических специалистов.

Интерфейс должен ощущаться как аккуратный dark SaaS / professional music network, а не как набор разрозненных экранов. Все основные действия, навигация, карточки, модалки, формы и списки должны вести себя одинаково во всех модулях.

Нельзя каждый экран верстать заново «на глаз». Каждый экран собирается из утверждённых зон:

- application shell;
- navigation rail / mobile bottom navigation;
- top bar;
- content container;
- primary content column;
- right context rail;
- cards;
- section headers;
- list rows;
- composer blocks;
- action bars;
- modal / drawer / sheet;
- empty/loading/error/restricted states.

---

## 2. Базовая сетка и размеры

### 2.1. Breakpoints

BandKit использует две основные компоновки:

```text
mobile:  0–767 px
desktop: 768 px и шире
```

Промежуточные breakpoints допускаются только для улучшения плотности контента, но не должны менять архитектуру экрана. Нельзя делать отдельную хаотичную tablet-версию с другим расположением основных кнопок.

### 2.2. Layout width

```text
Desktop app max content canvas: 1440 px
Main content comfortable width: 680–820 px
Right context rail: 300–360 px
Left navigation expanded: 248–280 px
Left navigation collapsed/icon rail: 72–88 px
Top bar height: 64 px
Mobile top bar height: 56 px
Mobile bottom navigation height: 64–72 px + safe-area inset
```

### 2.3. Spacing scale

Использовать 4 px scale:

```text
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
```

Базовые правила:

- внутренний padding карточки: 16–24 px;
- расстояние между карточками в ленте: 16 px mobile, 20–24 px desktop;
- расстояние между секциями: 24–32 px;
- расстояние между заголовком секции и содержимым: 12–16 px;
- расстояние между label и control: 6–8 px;
- минимальный touch target: 44×44 px, лучше 48×48 px.

### 2.4. Radius и визуальная геометрия

```text
Small controls: 10–12 px
Cards: 18–24 px
Main panels / modals: 24–28 px
Avatar/icon tiles: rounded-square, not circle
```

Иконки, аватарки и fallback-объекты в BandKit должны быть преимущественно rounded-square. Круглые аватары запрещены как базовый стиль, чтобы не ломать утверждённую визуальную систему.

---

## 3. Application Shell

### 3.1. Desktop shell

Desktop shell состоит из трёх постоянных зон:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Top Bar                                                             │
├───────────────┬──────────────────────────────────────┬──────────────┤
│ Left Nav Rail │ Main Content                         │ Right Rail   │
│               │                                      │              │
└───────────────┴──────────────────────────────────────┴──────────────┘
```

#### Left Nav Rail

Расположение:

- слева;
- sticky / fixed по высоте окна;
- не прыгает между разделами;
- содержит логотип/mark, основные разделы, workspace switcher, нижний блок настроек/профиля.

Поведение:

- active item всегда визуально выделен;
- inactive item не должен быть слишком тусклым;
- текст навигации может скрываться в collapsed state, но иконки остаются на тех же позициях;
- порядок пунктов навигации одинаковый во всех разделах.

Базовый порядок:

```text
1. Feed / Лента
2. Discover / Поиск
3. Projects / Группы и проекты
4. Events / События
5. Chats / Чаты
6. Documents / Документы
7. Marketplace / Объявления
8. Ratings / Надёжность
9. Admin / Модерация и управление, если доступно
```

#### Top Bar

Top bar содержит:

- глобальный search;
- quick create button;
- notifications;
- language/workspace indicator при необходимости;
- user menu.

Top bar не должен превращаться в склад кнопок. Вторичные действия уходят в contextual меню, right rail или overflow.

#### Main Content

Main content — основная рабочая зона. В большинстве социальных экранов это центральная колонка 680–820 px.

Правила:

- primary action не меняет своё место между похожими экранами;
- фильтры и tabs находятся над контентом, а не внутри случайных карточек;
- карточки одной сущности имеют одинаковую ширину и внутренний ритм;
- при отсутствии right rail main content остаётся визуально центрированным.

#### Right Context Rail

Right rail используется для:

- профиля/summary текущей сущности;
- upcoming events;
- online members;
- invitations;
- safety/trust hints;
- moderation queue summary;
- pinned details;
- secondary actions.

Right rail не используется для критичных primary actions, без которых невозможно выполнить основной сценарий. На mobile его содержимое переносится ниже основного контента или в отдельный sheet/drawer.

### 3.2. Mobile shell

Mobile shell состоит из:

```text
┌────────────────────────┐
│ Mobile Top Bar         │
├────────────────────────┤
│ Page Content           │
│                        │
├────────────────────────┤
│ Bottom Navigation      │
└────────────────────────┘
```

Правила mobile:

- одна колонка;
- минимум горизонтального скролла — запрещён для основного интерфейса;
- bottom navigation закреплена и не прыгает;
- primary action может быть FAB или sticky bottom action, но одинаково в рамках модуля;
- drawers/sheets открываются снизу;
- long forms разбиваются на секции;
- таблицы превращаются в cards или compact rows.

---

## 4. Page Header Pattern

Каждый основной экран начинается с стандартизированного page header.

### Desktop

```text
┌────────────────────────────────────────────┐
│ Breadcrumb / Context                       │
│ Page Title                      Primary CTA│
│ Subtitle / meta                 Secondary  │
│ Tabs / filters                             │
└────────────────────────────────────────────┘
```

### Mobile

```text
┌────────────────────────────┐
│ Back / Context / Actions   │
│ Page Title                 │
│ Subtitle / meta            │
│ Tabs / filters             │
└────────────────────────────┘
```

Правила:

- title не должен прыгать между страницами одного типа;
- primary CTA всегда справа на desktop и в sticky/FAB зоне на mobile;
- tabs находятся внизу header;
- длинные названия обрезаются только после 2 строк, с tooltip/details where applicable;
- кнопки не должны переноситься буквами или ломать высоту header.

---

## 5. Core Component Placement

### 5.1. Cards

Карточка — базовый контейнер для поста, события, профиля, документа, приглашения или админского объекта.

Структура карточки:

```text
┌────────────────────────────────────┐
│ Header: avatar/title/meta/actions  │
│ Body: content                      │
│ Media / attachment preview         │
│ Footer: reactions/comments/actions │
└────────────────────────────────────┘
```

Правила:

- avatar/icon tile слева;
- title и meta справа от avatar;
- kebab/overflow menu всегда в правом верхнем углу;
- footer actions всегда внизу карточки;
- dangerous actions не размещать рядом с обычными лайками/комментариями;
- если media нет, место media не резервировать пустым блоком;
- skeleton loading должен повторять размеры итоговой карточки.

### 5.2. Buttons

Иерархия кнопок:

```text
Primary: главное действие экрана
Secondary: дополнительное действие
Tertiary/Ghost: вспомогательное действие
Destructive: опасное действие
Icon button: компактное действие
```

Правила:

- primary action один на зону;
- кнопки одинакового уровня имеют одинаковую высоту;
- icon button минимум 40×40 px desktop, 44×44 px mobile;
- текстовые кнопки должны выдерживать длинные локализации;
- destructive action требует подтверждения или undo, если действие критичное.

### 5.3. Forms

Структура формы:

```text
Section title
Description / helper text
Label
Control
Hint / validation
```

Правила:

- label всегда над control, не слева, если форма сложная;
- related controls объединяются в секции;
- primary submit находится в footer формы или sticky action bar;
- ошибки появляются под полем, не в случайном toast;
- backend errors показываются в summary area сверху секции;
- обязательные поля обозначаются системно, а не только цветом.

### 5.4. Tables and Lists

Desktop:

- tables допустимы для admin, documents, members, payments, logs;
- header sticky при длинных списках;
- row height 48–64 px;
- actions справа;
- bulk actions появляются только при selected rows.

Mobile:

- таблицы превращаются в карточки/rows;
- основные данные сверху;
- вторичные данные в meta rows;
- actions уходят в overflow или bottom sheet.

---

## 6. Feed Layout

Лента — центральный ежедневный экран BandKit.

### Desktop

```text
Left Nav | Feed Column | Right Rail
```

Feed column:

1. page header / filters;
2. post composer;
3. feed tabs/filter chips;
4. post cards;
5. pagination/infinite loader.

Right rail:

- upcoming rehearsals/concerts;
- suggested musicians/projects;
- invitations;
- safety reminders;
- trending/open opportunities.

### Mobile

1. mobile top bar;
2. composer compact card;
3. horizontal chips;
4. post cards;
5. bottom navigation;
6. create post FAB or sticky CTA.

Правила:

- composer всегда выше ленты;
- post actions не меняют порядок;
- комментарии открываются inline на desktop и sheet/full page на mobile;
- repost/share flow не должен уводить primary actions в разные места.

---

## 7. Profile Layouts

Профили используют общий layout независимо от типа сущности:

- musician/user;
- group/project;
- orchestra;
- studio;
- venue;
- organizer;
- teacher;
- technical specialist.

### Desktop profile

```text
┌──────────────────────────────────────────────┐
│ Cover image                                  │
├──────┬─────────────────────────────┬─────────┤
│Avatar│ Name / role / trust / meta  │ Actions │
├──────┴─────────────────────────────┴─────────┤
│ Tabs: Overview / Posts / Events / Media ...  │
├──────────────────────────────┬───────────────┤
│ Main profile content         │ Right summary │
└──────────────────────────────┴───────────────┘
```

### Mobile profile

```text
Cover
Avatar tile
Name / role / meta
Primary actions
Tabs horizontally scrollable
Content cards
```

Правила:

- cover ratio фиксированный: desktop около 4:1, mobile около 2.6–3:1;
- avatar накладывается на нижнюю часть cover, но не перекрывает title до нечитаемости;
- trust/rating badges рядом с именем, но не вместо имени;
- tabs sticky после прокрутки header;
- fallback cover/avatar применяются автоматически при отсутствии пользовательской загрузки.

---

## 8. Projects, Bands and Organizations

Страницы группы/проекта/организации наследуют Profile Layout, но добавляют workspace/member management.

Обязательные зоны:

- hero/profile header;
- member roles summary;
- upcoming events;
- pinned announcement;
- documents/riders;
- media;
- open positions/casting;
- internal chat entry;
- admin/moderation shortcuts for managers.

Правила:

- публичная часть и внутренняя workspace-часть визуально различаются;
- admin actions не должны выглядеть как обычные user actions;
- приглашения участников всегда в одном месте: members block или right rail;
- role management открывается через modal/drawer, а не inline-хаос.

---

## 9. Events Layout

Событие может быть концертом, репетицией, записью, кастингом, встречей, дедлайном или туровой датой.

### Desktop event page

```text
Event header: title/date/status/actions
Main column: description, schedule, setlist, tasks, comments
Right rail: participants, location, documents, checklist, status
```

### Mobile event page

```text
Header
Date/location card
Primary action bar
Details sections
Participants
Documents
Comments
```

Правила:

- дата/время всегда видны в верхней зоне;
- RSVP/status action не должен теряться в меню;
- location/map не занимает первый экран целиком;
- participants показываются компактно;
- документы события не смешиваются с комментариями;
- timezone/locale formatting обязательно через i18n layer.

---

## 10. Chats Layout

### Desktop chat

```text
┌──────────────┬─────────────────────────┬──────────────┐
│ Rooms list   │ Conversation            │ Chat details │
│ 300–340 px   │ flexible                │ 300–360 px   │
└──────────────┴─────────────────────────┴──────────────┘
```

Conversation:

- sticky chat header;
- message list;
- pinned/announcement area if exists;
- composer sticky bottom;
- attachments/actions near composer.

### Mobile chat

Mobile chat uses separate states:

1. rooms list screen;
2. conversation screen;
3. chat details sheet/screen.

Правила:

- composer всегда внизу;
- send button не прыгает при добавлении attachment;
- reply/edit state появляется над composer;
- moderation/report action в overflow;
- links policy/safety warnings должны иметь отдельное системное место, а не ломать сообщения;
- unread divider не должен перекрывать content.

---

## 11. Documents and Media Layout

Documents module содержит договоры, райдеры, счета, сетлисты, медиа, вложения событий и workspace-файлы.

### Desktop

```text
Header + filters + upload/create CTA
Toolbar: search/filter/sort/view mode
Table/Grid/List
Right preview/details panel optional
```

### Mobile

```text
Header
Search/filter chips
Document cards
Bottom sheet details/actions
```

Правила:

- document type icon слева;
- title первая строка;
- status/version/date/owner — meta;
- actions справа/overflow;
- preview открывается в panel/sheet;
- upload progress занимает стабильное место и не двигает список хаотично.

---

## 12. Marketplace / Opportunities Layout

Marketplace/объявления используются для поиска музыкантов, проектов, вакансий, студий, площадок и услуг.

Desktop:

```text
Header
Search + filters
Results grid/list
Right filters/details rail optional
```

Mobile:

```text
Header
Search
Filter button opens sheet
Cards list
```

Правила:

- filters не должны занимать весь первый экран на mobile;
- card всегда содержит title, type, location/remote, date/status, trust/rating hint;
- apply/contact action всегда в нижней части card;
- безопасные ограничения и жалобы доступны из overflow.

---

## 13. Admin and Moderation Layout

Admin/moderation UI должен быть плотнее, но не ломать общий UI Kit.

Desktop:

```text
Admin nav / section tabs
Queue table/list
Details panel
Action footer
Audit log / notes
```

Mobile:

- queue cards;
- details full-screen sheet;
- actions в sticky footer;
- destructive decisions require confirmation.

Правила:

- status, priority, assignee, SLA видны без открытия карточки;
- decision buttons grouped and visually separated;
- moderation notes never mixed with public comments;
- audit log read-only and visually separate;
- admin role visibility controlled by permissions, not by hidden CSS only.

---

## 14. Auth and Onboarding Layout

Auth/onboarding не должны отличаться стилем от основного приложения.

### Auth

```text
Left/Top brand area
Auth card
Security hints
Language switch
Footer legal links
```

Правила:

- Google/Apple login buttons одинаковой ширины;
- phone verification и email verification — отдельные predictable steps;
- 2FA setup uses wizard pattern;
- error messages under fields + summary;
- language switch visible before login.

### Onboarding

Onboarding steps:

1. choose account type/role;
2. verify phone/email;
3. choose profile/workspace setup;
4. safety/trust intro;
5. invite/join/create first workspace;
6. complete profile essentials.

Правила:

- progress indicator fixed;
- back/next buttons stay in one place;
- skip action secondary;
- long role lists use cards/grid, not tiny dropdown only.

---

## 15. Wizards and Multi-Step Flows

Все многошаговые сценарии используют единый wizard pattern.

```text
Wizard header
Step indicator
Step content card
Validation/error area
Sticky footer: Back / Save draft / Next or Finish
```

Примеры:

- create event;
- create project/group;
- invite members;
- upload documents;
- submit complaint;
- moderation decision;
- setup 2FA;
- organization verification.

Правила:

- кнопки Back/Next/Finish не прыгают;
- step content может меняться по высоте, footer остаётся стабильным;
- autosave/draft status находится в header/footer;
- validation не переносит кнопки вниз внезапно;
- mobile footer sticky.

---

## 16. Modals, Drawers and Sheets

### Desktop modal sizes

```text
Small: 420–480 px
Medium: 560–720 px
Large: 840–960 px
Fullscreen/workspace modal: only for complex editors
```

### Mobile

- bottom sheet for simple actions;
- full-screen sheet for forms/editors;
- no tiny centered modals on mobile.

Правила:

- header fixed внутри modal;
- footer fixed для actions;
- content scrolls independently;
- close button top-right;
- primary action справа на desktop, справа/полная ширина на mobile footer;
- dangerous action separated and confirmed.

---

## 17. Empty, Loading, Error, Restricted States

Каждый экран обязан иметь состояния:

```text
loading
empty
error
no-access
restricted
archived
blocked/moderated
```

Правила:

- empty state использует отдельную прозрачную иллюстрацию из asset pack;
- текст empty state берётся из locales;
- CTA empty state не меняет основное место primary action;
- skeleton повторяет реальную структуру контента;
- error state объясняет, что делать дальше;
- restricted state не раскрывает лишние приватные данные.

---

## 18. Asset Placement Rules

Все production assets подключаются через manifest.

### Размеры иконок

```text
Navigation icon: 24 px
Action icon: 20–24 px
Status/badge icon: 16–20 px inline, 32–48 px card
Role icon tile: 40–56 px list, 72–96 px profile/empty state
Fallback avatar: 96/192/512 source, rendered 40–128 px
Cover fallback: ratio preserved, object-fit cover
```

Правила:

- SVG — основной формат для UI;
- PNG/WebP — fallback, PWA, previews;
- не растягивать маленькие PNG вместо SVG;
- иконки не должны содержать локализуемый текст;
- empty state illustration не должна быть внутри text block;
- brand/logo only through approved brand assets.

---

## 19. Localization Impact on Layout

BandKit должен выдерживать длинные строки переводов.

Запрещено:

- фиксировать width кнопки под русский текст;
- зашивать текст в SVG/PNG/WebP;
- использовать line-height, при котором длинная строка ломает card;
- прятать важную информацию только ellipsis без доступа к full text;
- делать layout, где DE/FI/EN строки ломают primary actions.

Обязательно:

- min/max widths;
- wrapping where safe;
- tooltip/details for truncated title;
- locale-aware date/time/number/currency;
- RTL-ready структура, даже если RTL не входит в MVP.

---

## 20. Placement Contracts by Module

### 20.1. Main navigation

```text
Desktop: left rail
Mobile: bottom nav
Order: Feed, Discover, Projects, Events, Chats, Documents, Marketplace, Profile/Menu
```

Admin/moderation не должен появляться в основной nav для обычного пользователя.

### 20.2. Create action

```text
Desktop: top bar quick create + contextual page CTA
Mobile: FAB or sticky bottom CTA depending on module
```

Create action не должен переезжать из header в случайную карточку между экранами одного типа.

### 20.3. Search

```text
Desktop: global search in top bar, local search in section toolbar
Mobile: search field below page title or opens dedicated search screen
```

### 20.4. Notifications

```text
Desktop: top bar icon + dropdown/panel
Mobile: top bar icon or profile/menu entry
```

### 20.5. User/workspace switcher

```text
Desktop: left rail top/bottom stable zone
Mobile: profile/menu screen or top context selector
```

### 20.6. Safety/report actions

```text
Overflow menu on content cards/profile/chat messages
Dedicated complaint flow opens modal/sheet
Admin handling opens moderation workspace
```

---

## 21. Anti-Drift Rules

Эти правила нужны, чтобы интерфейс не расползался по мере разработки.

Запрещено:

1. Подгонять один экран inline style.
2. Создавать локальный CSS-класс ради одного сдвига на 2 px.
3. Менять расположение primary action в похожих экранах.
4. Делать уникальные размеры карточек без причины.
5. Добавлять новый radius/spacing вне токенов.
6. Вставлять текстовые PNG вместо локализованного текста.
7. Делать mobile как уменьшенный desktop.
8. Прятать важные действия только в overflow.
9. Использовать пустые spacer-div вместо layout primitives.
10. Размещать admin/destructive actions рядом с обычными social actions.

Разрешено:

1. Добавлять новый pattern только после обновления UI Kit/Layout Contract.
2. Делать module-specific extension, если он наследует базовый pattern.
3. Использовать CSS variables/design tokens.
4. Исправлять проблему системно на уровне компонента, а не экрана.

---

## 22. Implementation Acceptance Checklist

Перед принятием экрана нужно проверить:

### Layout

- [ ] Экран использует утверждённый shell.
- [ ] Header, tabs, primary CTA стоят в стандартных местах.
- [ ] Карточки одной сущности одинаковой ширины.
- [ ] Right rail не содержит критичных primary actions.
- [ ] Mobile не имеет горизонтального скролла.
- [ ] Sticky footer/header не перекрывает content.

### Components

- [ ] Используются общие Button/Card/Input/Modal/ListRow компоненты.
- [ ] Нет inline styles.
- [ ] Нет одноразовых CSS-костылей.
- [ ] Empty/loading/error states реализованы.
- [ ] Focus states и keyboard navigation не сломаны.

### Assets

- [ ] SVG используется как основной UI asset.
- [ ] PNG/WebP только как fallback/preview/PWA.
- [ ] Fallback avatar/cover подключены.
- [ ] Нет preview boards в production UI.
- [ ] Нет локализуемого текста внутри ассетов.

### i18n

- [ ] Все строки через locale keys.
- [ ] Длинные переводы не ломают buttons/cards/header.
- [ ] Date/time/number/currency форматируются локально.
- [ ] Empty/error/push/system texts не hard-coded.

### Security/Moderation

- [ ] Report/block/restrict действия доступны там, где нужны.
- [ ] Dangerous actions имеют confirm/undo.
- [ ] Admin actions видны только по правам.
- [ ] Restricted states не раскрывают приватные данные.

---

## 23. Development Order

Правильный порядок реализации:

1. Design tokens.
2. App shell.
3. Base components.
4. Layout primitives.
5. Page header pattern.
6. Cards/list rows/tables.
7. Modal/drawer/sheet system.
8. Empty/loading/error/restricted states.
9. Module pages.
10. Admin/moderation screens.
11. Final responsive QA.
12. i18n stress test.
13. Asset manifest validation.

Нельзя начинать с отдельных страниц без готового shell и базовых компонентов.

---

## 24. Canonical CSS Token Names

Рекомендуемые имена токенов:

```css
--bk-space-1: 4px;
--bk-space-2: 8px;
--bk-space-3: 12px;
--bk-space-4: 16px;
--bk-space-5: 20px;
--bk-space-6: 24px;
--bk-space-8: 32px;
--bk-space-10: 40px;
--bk-space-12: 48px;

--bk-radius-control: 12px;
--bk-radius-card: 22px;
--bk-radius-panel: 28px;

--bk-shell-left-rail: 264px;
--bk-shell-left-rail-collapsed: 80px;
--bk-shell-topbar: 64px;
--bk-shell-mobile-topbar: 56px;
--bk-shell-mobile-bottom-nav: 68px;

--bk-content-feed: 760px;
--bk-content-wide: 1120px;
--bk-right-rail: 336px;
```

Имена можно адаптировать под выбранный стек, но смысл и значения должны остаться согласованными.

---

## 25. Final Rule

Если при разработке возникает желание сказать «тут чуть-чуть подвинем руками», сначала надо проверить, какой layout pattern нарушен. Если pattern не описан — обновить этот документ и UI Kit. Если описан — исправлять общий компонент, а не конкретный экран.
