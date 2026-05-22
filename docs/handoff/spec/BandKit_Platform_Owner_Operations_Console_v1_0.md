# BandKit — Platform Owner Operations Console v1.0

## Purpose

This document defines the platform-owner side of BandKit: the internal operating console used by the owner and trusted platform staff to run, support, moderate, secure, and maintain the whole platform.

This is different from project/group/entity administration.

Entity admins manage their own groups, events, documents, members, and chats.

Platform owner staff manage the whole BandKit platform.

---

## Scope

The Platform Owner Operations Console covers:

- global platform administration;
- user and entity oversight;
- moderation and abuse handling;
- technical support;
- trust and safety operations;
- billing/subscriptions later;
- platform settings and feature flags;
- localization/content management;
- audit logs and staff actions;
- system health and incident response;
- legal/compliance workflows;
- data export/deletion requests.

---

## Primary roles

### Platform Owner / Super Admin

Full control over platform-level systems.

Can:

- manage platform staff;
- assign internal roles;
- view global diagnostics;
- manage platform settings;
- configure moderation rules;
- access audit logs;
- manage emergency lockdowns;
- approve critical actions;
- view internal technical panels.

### Platform Admin

Operational admin without full owner privileges.

Can:

- manage users and entities within policy;
- process support escalations;
- review moderation queues;
- manage public content flags;
- view non-sensitive analytics;
- update non-critical platform settings if allowed.

Cannot:

- view secrets;
- change owner-level security settings;
- bypass audit;
- delete audit logs;
- grant super admin role.

### Platform Moderator

Trust and safety role.

Can:

- process complaints;
- review reported users/content/messages;
- warn, restrict, mute, or suspend accounts within policy;
- escalate cases to admin/owner;
- view context required for a case.

Cannot:

- browse private data without a case context;
- change platform settings;
- access billing or technical secrets.

### Support Agent

Customer support role.

Can:

- view support tickets;
- view safe account summary;
- help with login/access problems;
- guide users through verification;
- escalate security/moderation issues.

Cannot:

- read private chats/documents unless explicitly attached to a support case;
- change roles or punish users;
- access secrets or raw database.

### Read-only Auditor

Internal/legal/accounting/audit role.

Can:

- view audit trails;
- export allowed reports;
- inspect staff actions.

Cannot:

- modify platform state.

---

## Main console sections

### 1. Owner dashboard

High-level platform overview:

- total users;
- verified users;
- active users;
- new registrations;
- created entities;
- created events;
- open complaints;
- support tickets;
- risky accounts;
- system health;
- deploy/version status;
- recent critical audit events.

This page is for platform owner and high-trust staff only.

---

### 2. User management

Global user search and profile administration.

Capabilities:

- search by ID, handle, email, phone hash, display name;
- view account status;
- view verification state;
- view linked entities and memberships;
- view trust/reputation summary;
- view reports and moderation history;
- apply account restrictions;
- suspend/restore account;
- trigger password/session reset later;
- manage 2FA recovery workflows later.

Safety rules:

- sensitive fields masked by default;
- staff can only reveal sensitive data with permission and audit reason;
- all actions logged to `audit_events`.

---

### 3. Entity management

Global management of groups, orchestras, studios, venues, agencies, projects, and other platform entities.

Capabilities:

- search entities;
- view owner and admins;
- inspect members count and status;
- view public profile state;
- freeze entity;
- hide entity from discovery;
- transfer ownership after verification;
- handle abandoned/inactive entity lifecycle;
- review complaints linked to entity.

Entity admins still manage their entity from normal UI. Platform staff only intervene for policy, support, ownership, abuse, or safety reasons.

---

### 4. Moderation center

Central queue for complaints and safety events.

Queues:

- user complaints;
- entity complaints;
- event complaints;
- message complaints;
- document complaints;
- scam/fraud reports;
- harassment/abuse reports;
- suspicious external-link attempts;
- ban evasion signals later.

Case workflow:

1. New case.
2. Triage.
3. Assigned staff member.
4. Evidence/context review.
5. Decision.
6. Action applied.
7. User notification if required.
8. Appeal window if supported.
9. Case closed.

Possible actions:

- no action;
- warning;
- content removal;
- temporary restriction;
- account suspension;
- entity freeze;
- event delisting;
- escalation to owner;
- escalation to legal/security.

---

### 5. Support desk

Internal technical/user support.

Ticket sources:

- user-created support request;
- email later;
- system-created ticket;
- moderation escalation;
- billing escalation later;
- account recovery request.

Ticket fields:

- requester;
- category;
- priority;
- status;
- assigned staff;
- linked user/entity/event/document;
- internal notes;
- public replies;
- attachments later;
- audit history.

Support categories:

- login and access;
- verification;
- account recovery;
- entity ownership;
- event/document access;
- bug report;
- payment/subscription later;
- safety concern;
- data request.

---

### 6. Trust and safety rules

Platform owner settings for risk control.

Includes:

- external link policy;
- suspicious message detection later;
- blocked domains;
- scam patterns;
- rate limits;
- report thresholds;
- automatic content hold rules;
- temporary account restrictions;
- staff review rules.

Important: automatic systems should assist, not silently punish, unless the policy explicitly allows it.

---

### 7. Platform settings

Global application configuration.

Examples:

- registration open/closed;
- invite-only mode;
- maintenance mode;
- feature flags;
- public discovery toggles;
- verification requirements;
- allowed languages;
- default locale;
- support contact settings;
- legal document versions;
- notification settings;
- upload limits later.

Only owner/super admin can change critical settings.

---

### 8. Staff management

Internal staff accounts and role assignment.

Capabilities:

- invite staff;
- assign roles;
- remove staff access;
- require 2FA;
- view staff activity;
- revoke sessions later;
- restrict access by role and scope.

Security requirements:

- super admin role cannot be granted casually;
- all role changes require audit log;
- staff accounts require 2FA;
- staff actions must be attributable to a real person.

---

### 9. Audit log

Immutable record of sensitive actions.

Must record:

- actor;
- action;
- target object;
- timestamp;
- IP/user agent later;
- reason/comment for sensitive action;
- before/after state for important changes;
- related case/ticket ID when applicable.

Audit events include:

- user restricted/restored;
- entity frozen/unfrozen;
- role changed;
- staff invited/removed;
- support ticket action;
- moderation decision;
- platform setting changed;
- data export/deletion request;
- deployment marker later.

Audit logs must not be deletable from normal admin UI.

---

### 10. System health and deploy status

Operational visibility for owner/admin.

Shows:

- frontend version;
- backend version;
- latest Git commit;
- latest deploy status;
- API health;
- DB health;
- migration status;
- background jobs later;
- storage status later;
- queue status later;
- error rate later.

This section is not visible to regular users.

---

### 11. Billing and subscriptions later

Not required for current MVP, but reserve structure.

Will include:

- plans;
- user subscriptions;
- entity subscriptions;
- invoices;
- payment provider events;
- failed payments;
- refunds;
- promo codes;
- manual credits;
- accounting exports.

Billing actions must be audited.

---

### 12. Localization/content operations

Platform owner/admin can manage:

- language packs;
- UI text keys;
- legal pages;
- help center content;
- onboarding content;
- complaint reason lists;
- support categories;
- system notification templates.

Changes should be versioned.

---

### 13. Legal and data requests

Support for:

- user data export request;
- user deletion request;
- entity ownership dispute;
- copyright/content complaint later;
- law enforcement/legal request workflow later;
- privacy request tracking.

All actions must be logged and restricted.

---

## Data model additions later

Potential tables:

```text
platform_staff_roles
support_tickets
support_ticket_messages
support_ticket_internal_notes
moderation_cases
moderation_case_events
platform_settings
feature_flags
staff_action_reasons
blocked_domains
risk_rules
system_incidents
data_requests
billing_plans
billing_subscriptions
billing_events
```

Use migrations only.

---

## UI principles

The platform owner console must not pollute regular user UI.

Regular users see product-ready pages.

Super admin and staff see technical/operational controls only inside dedicated admin/operations sections or behind explicit role gates.

Technical labels such as `Real API`, `DB read-only`, `mock`, `offline`, `GET only`, or deploy/debug diagnostics are not user-facing.

---

## Access model

All platform operations must be role-gated.

Minimum gates:

```text
super_admin
platform_admin
platform_moderator
support_agent
read_only_auditor
```

Current frontend may mock these roles, but backend must become the source of truth later.

---

## MVP implementation order

Recommended vertical slices:

1. Platform owner dashboard shell.
2. User search/read-only admin view.
3. Entity search/read-only admin view.
4. Moderation case queue.
5. Support ticket shell.
6. Staff role model.
7. Audit events expansion.
8. Platform settings/feature flags.
9. System health/deploy status panel.
10. Billing/subscriptions later.

---

## Do not regress

- Do not expose owner/staff tools to regular users.
- Do not allow support staff to browse private data without case context.
- Do not let frontend role placeholders become trusted security checks.
- Backend permissions must be the final source of truth.
- Do not store secrets in the repo.
- Do not make destructive admin actions without audit events.
- Do not delete audit logs through normal UI.
