# BandKit Platform Admin Console v1.0

## 1. Purpose

`/admin` is the platform owner operations console. It is not the admin panel for a band, studio, organization, venue, event, marketplace seller, or a user profile.

This document fixes the boundary before real backend admin APIs are connected.

## 2. Non-negotiable boundary

```txt
/admin                       -> platform owner / operations console
/band/:id/admin              -> future band/project admin space
/studio/:id/admin            -> future studio admin space
/org/:id/admin               -> future organization admin space
/event/:id/admin             -> future event admin space
/venue/:id/admin             -> future venue admin space
/marketplace/seller/admin    -> future seller/provider admin space
/profile/settings            -> user account settings
```

The platform console can inspect, freeze, unpublish, verify, flag or audit an entity at platform level. It must not casually edit the internal settings of that entity as if it were the entity owner.

## 3. Platform console sections

The first shell pass defines these platform routes:

```txt
/admin
/admin/users
/admin/entities
/admin/reports
/admin/moderation
/admin/trust
/admin/billing
/admin/content
/admin/roles
/admin/localization
/admin/notifications
/admin/audit
/admin/settings
```

## 4. Section responsibilities

### `/admin`

Owner dashboard for platform-level status, queue pressure, incidents and high-level operating signals.

### `/admin/users`

Platform user registry: support-safe lookup, verification status, risk flags, restrictions, staff notes and future account actions.

### `/admin/entities`

Registry for bands, projects, orchestras, studios, organizations, venues and events. This is a platform registry, not the place to manage each entity's internal configuration.

### `/admin/reports`

Unified queue for reports, complaints, appeals and escalations.

### `/admin/moderation`

Moderation operations for content, profiles, complaint-gated messages and entity visibility actions.

### `/admin/trust`

Trust & Safety operations: blocked links, suspicious patterns, social-engineering risk, rating abuse, account risk and anti-fraud policies.

### `/admin/billing`

Plans, subscriptions, invoices, refunds, manual access grants and billing audit.

### `/admin/content`

Feed, comments, media, categories, featured content and platform content flags.

### `/admin/roles`

Platform staff roles and access matrix. Entity roles remain inside entity admin spaces.

### `/admin/localization`

Language packs, translation keys, missing strings and future import/export flows.

### `/admin/notifications`

Broadcasts, templates, push/email/SMS policies and emergency notices.

### `/admin/audit`

Immutable action log for sensitive operations.

### `/admin/settings`

Global platform flags, registration policy, 2FA policy, providers and feature gates.

## 5. Access model

The mock route map uses three elevated levels for the platform console:

```txt
moderator   -> reports and moderation lanes
admin       -> main platform operations lanes
super_admin -> billing, platform settings and role management lanes
```

Frontend guards are only UX. Real enforcement must come from backend permissions and policy checks.

## 6. Sensitive operations rule

The first `/admin` implementation must remain read-first and mock-only. These actions must not be wired directly from frontend placeholders:

```txt
block user
restrict account
change platform role
change rating/reputation
refund payment
grant paid access
impersonate user
read private messages outside complaint escalation
hard-delete content
change entity ownership
```

When these become real, every operation must have:

```txt
actor id
actor role
target type
target id
reason code
human note when required
old value
new value
ip/user-agent hash where applicable
created_at
immutable audit event
```

## 7. Implementation checkpoint

The first code pass introduces a platform admin console shell surface and expanded routes without connecting real backend business APIs. It intentionally preserves the current MVP shell and staging backend foundation.

Current implementation files:

```txt
src/app/router.ts
src/components/layout/navigation.ts
src/main.ts
src/modules/PlatformAdminConsole.ts
src/locales/en/admin.json
src/locales/ru/admin.json
```

## 8. Next safe backend slice

The next safe backend slice should be small and read-only:

```txt
GET /api/v1/admin/overview
GET /api/v1/admin/entities
GET /api/v1/admin/reports
GET /api/v1/admin/audit
```

Do not start with blocking, billing, impersonation, role mutation or private-message access.
