# BandKit Component Inventory v1.0

## 1. Назначение

Документ фиксирует состав UI-компонентов, чтобы интерфейс собирался из единой системы, а не из разрозненных блоков.

## 2. Component layers

```txt
components/ui          # базовые primitives
components/layout      # shell/grid/nav
components/domain      # reusable domain cards/widgets
modules/*/components   # компоненты конкретного модуля
```

## 3. UI primitives

### Buttons

- `Button`
- `IconButton`
- `SplitButton` future-ready
- `DangerButton` через variant, не отдельный хаос

Variants:

- primary;
- secondary;
- ghost;
- subtle;
- danger;
- success future-ready.

Sizes:

- sm;
- md;
- lg;
- icon.

### Inputs

- `Input`
- `Textarea`
- `Select`
- `Combobox`
- `Checkbox`
- `RadioGroup`
- `Switch`
- `DateTimeInput`
- `PhoneInput`
- `OtpInput`
- `SearchInput`

Rules:

- label всегда связан с control;
- error/help text через общий компонент;
- длинные локализованные label не ломают сетку.

### Feedback

- `Toast`
- `InlineAlert`
- `Banner`
- `Progress`
- `Skeleton`
- `EmptyState`
- `ErrorState`
- `RestrictedState`
- `LoadingState`

### Overlays

- `Modal`
- `ConfirmDialog`
- `Drawer`
- `BottomSheet`
- `Popover`
- `Tooltip`
- `DropdownMenu`

Mobile rule: длинные формы чаще открывать в BottomSheet/FullScreenDialog, не в маленькой модалке.

### Navigation

- `AppShell`
- `AuthShell`
- `AdminShell`
- `TopBar`
- `SideNav`
- `BottomNav`
- `Breadcrumbs`
- `Tabs`
- `SegmentedControl`

### Data display

- `Card`
- `StatCard`
- `DataTable`
- `DataList`
- `Badge`
- `Avatar`
- `CoverImage`
- `MediaGrid`
- `Timeline`
- `AuditTrail`

### Utilities

- `VisuallyHidden`
- `SafeExternalLink` — в MVP внешние ссылки запрещены/ограничены
- `CopyButton`
- `RelativeTime`
- `LocalizedDateTime`
- `CurrencyAmount`

## 4. Domain components

### Profile

- `ProfileHeader`
- `ProfileCard`
- `ProfileMiniCard`
- `AvatarWithFallback`
- `CoverWithFallback`
- `RoleBadges`
- `ReputationBadge`
- `ReliabilitySummary`
- `ContactActions`

### Bands / projects

- `BandHeader`
- `BandCard`
- `BandMemberList`
- `BandRoleBadge`
- `InviteMemberPanel`
- `JoinRequestCard`

### Feed

- `FeedComposer`
- `PostCard`
- `PostActions`
- `CommentList`
- `CommentComposer`
- `RepostBlock`
- `ReportContentButton`
- `LinkBlockedNotice`

### Events

- `EventCard`
- `EventHeader`
- `EventDateBlock`
- `RsvpPanel`
- `ParticipantList`
- `EventStatusBadge`
- `CancellationReasonDialog`

### Chats

- `ChatRoomList`
- `ChatHeader`
- `MessageList`
- `MessageBubble`
- `MessageComposer`
- `AttachmentButton`
- `TypingIndicator`
- `ReadReceipt`
- `MessageReportAction`

### Documents

- `DocumentCard`
- `DocumentEditorShell`
- `DocumentVersionList`
- `DocumentPermissionPanel`
- `PdfExportButton`

### Marketplace

- `SearchFilters`
- `MusicianSearchCard`
- `StudioSearchCard`
- `VenueSearchCard`
- `AvailabilityBadge`

### Complaints / moderation

- `ComplaintForm`
- `ComplaintCard`
- `ModerationQueue`
- `ModerationCaseHeader`
- `ModerationActionPanel`
- `ReasonCodeSelect`
- `AuditTrailPanel`

### Admin

- `AdminDashboardCard`
- `UserAdminTable`
- `RoleMatrix`
- `LocalizationKeyTable`
- `SecurityEventList`

## 5. Asset usage components

Для production assets:

- `AssetIcon` — получает asset key/semantic name из manifest.
- `Illustration` — language-neutral иллюстрации.
- `FallbackAvatar` — типизированные fallback avatar.
- `FallbackCover` — типизированные fallback cover.
- `AppIconPreview` — только для dev/admin.

Запрет: импортировать PNG/SVG напрямую из случайных путей в каждом компоненте.

## 6. i18n rules for components

Каждый компонент принимает:

- `titleKey` вместо `title`, если текст системный;
- `ariaLabelKey` для icon-only кнопок;
- данные пользователя могут быть plain text, но UI labels — только через t().

## 7. Layout rules

Компоненты не должны задавать page-level margins. Page/layout отвечает за внешние отступы. Компонент отвечает за внутреннюю структуру.

Запрещено:

- inline `style={{ width: 347 }}`;
- индивидуальные media queries внутри каждого компонента без токенов;
- `!important` для normal layout;
- фиксировать высоту карточки под один язык.

## 8. Accessibility minimum

- keyboard navigation;
- visible focus;
- aria labels for icon buttons;
- semantic headings;
- contrast according to theme tokens;
- dialogs trap focus;
- forms expose errors to screen readers.

## 9. Component readiness checklist

Для каждого компонента:

- light/dark compatible;
- mobile/desktop tested;
- long text tested;
- RU/EN text tested;
- empty/loading/error states considered;
- no hardcoded UI strings;
- uses tokens;
- no one-off pixel hacks.
