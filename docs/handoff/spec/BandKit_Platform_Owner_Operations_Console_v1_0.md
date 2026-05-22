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

## Critical role separation: platform admin vs entity admin

BandKit must strictly separate platform-level administration from entity-level administration.

An entity is a band, orchestra, studio, venue, agency, project, organization, or similar public/workspace object inside BandKit.

### Entity admin is not platform admin

An entity admin manages only the entity where they have a role.

Entity roles may include:

```text
entity_owner
entity_admin
entity_manager
entity_moderator
entity_member
entity_guest
```

These roles are scoped to one entity and must not grant access to platform-owner tools.

Entity admin can manage, depending on entity permissions:

- entity profile content;
- members and invitations;
- internal roles inside that entity;
- entity events;
- entity documents;
- entity chats;
- entity public posts/feed;
- entity settings;
- entity-level moderation such as removing a member from that entity.

Entity admin cannot:

- access the platform owner console;
- view global user management;
- view unrelated users' private data;
- browse all entities;
- process global complaints unless they are a platform moderator;
- access support tickets;
- change platform settings;
- access system health/deploy status;
- see backend diagnostics;
- manage platform staff;
- grant platform roles;
- bypass platform policies;
- delete platform audit logs.

### Platform admin is not automatically entity admin

A platform admin manages the platform according to policy, support, moderation, abuse, legal, or operational needs.

Platform admin does not automatically become a normal day-to-day admin of every entity.

Platform admin can intervene in entities only through explicit platform operations, for example:

- abuse investigation;
- ownership dispute;
- support escalation;
- legal/privacy request;
- frozen/abandoned entity recovery;
- policy violation;
- security incident.

Every intervention must be audited and should include a reason/case reference.

### UI separation

Entity management must live in normal product UI, for example:

```text
/bands/:id/settings
/events/:id/settings
/entity admin panels inside entity context
```

Platform operations must live in a separate internal console, for example:

```text
/admin
/admin/users
/admin/entities
/admin/support
/admin/moderation
/admin/settings
/admin/audit
/admin/system
```

Regular entity admins must not see platform operation navigation unless they also have a platform staff role.

### Backend source of truth

Frontend role placeholders are not security.

Backend permission checks must distinguish:

```text
platform_role
entity_membership.role
support_case_assignment
moderation_case_assignment
```

A user may have both kinds of roles, but each action must check the correct scope.

Example:

```text
Alex can be entity_admin of Northern Lights Band
without being platform_admin of BandKit.
```

Another example:

```text
A support_agent can help with a ticket
without becoming an entity_admin of the user's band.
```

---

## Platform operations safeguards

### Break-glass access

There must be an emergency-only owner mechanism for critical incidents.

Break-glass mode is for cases such as:

- active security incident;
- compromised staff account;
- severe data corruption risk;
- legal or safety emergency;
- system-wide abuse wave.

Requirements:

- only super admin can activate;
- requires explicit reason;
- creates high-priority audit event;
- should expire automatically;
- should notify owner/security channel later;
- all actions during the session are marked as break-glass.

Break-glass must never become normal daily admin workflow.

### Staff impersonation / support view

If support needs to see what a user sees, use controlled support view, not uncontrolled login-as-user.

Rules:

- no password/session theft;
- no access to private chats/documents unless attached to a support/moderation case;
- clear banner: staff is viewing in support mode;
- reason/case ID required;
- all viewed scopes are audited;
- no destructive actions while impersonating unless separately authorized.

### Dual approval for dangerous actions

Some actions should require second approval or owner confirmation:

- grant/revoke super admin;
- bulk suspend users;
- bulk delete/hide content;
- export sensitive data;
- permanent account deletion;
- platform-wide maintenance/lockdown;
- payment/refund bulk actions later;
- disabling safety systems.

### Appeals and reversals

Moderation actions need appeal/review capability.

Required concepts:

- appeal request;
- appeal status;
- original decision;
- reviewer;
- reversal/partial reversal;
- final decision;
- user notification.

### Support SLA and priorities

Support tickets should have clear priority levels:

```text
P0 security/critical outage
P1 account access/payment/safety urgent
P2 normal user support
P3 low priority/how-to/feedback
```

Each priority can later define response/resolution targets.

### Incident management

System incidents should be tracked separately from support tickets.

Incident fields:

- severity;
- affected services;
- started_at;
- resolved_at;
- owner;
- timeline updates;
- public/private status;
- linked deploy/commit;
- postmortem later.

### Backups, retention, and recovery

Owner console should track operational recovery status:

- last database backup;
- backup health;
- restore drill status later;
- retention rules;
- deleted-account retention window;
- audit log retention;
- document/file retention later.

Regular admins must not be able to delete backups or audit trails.

### Internal runbooks

Important operational procedures should be documented and linked from admin console:

- deploy rollback;
- backend restart;
- database migration failure;
- compromised account response;
- scam wave response;
- support escalation;
- entity ownership dispute;
- data export/deletion request;
- incident communication.

### Staff notifications and escalation

The platform needs internal notification routing for staff:

- new P0/P1 support ticket;
- urgent safety case;
- failed deploy;
- failed smoke test;
- DB health failed;
- suspicious spike;
- break-glass activated;
- role changed;
- export/deletion request created.

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

Global platform oversight of groups, orchestras, studios, venues, agencies, projects, and other platform entities.

This is not the same as entity admin UI.

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
- deployment marker later;
- break-glass activated/expired;
- staff support view opened;
- sensitive data revealed;
- dangerous action approval requested/approved/rejected.

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
- error rate later;
- backup status;
- incident status.

This section is not visible to regular users or entity admins.

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
incident_events
data_requests
dangerous_action_approvals
staff_access_sessions
billing_plans
billing_subscriptions
billing_events
```

Entity-scoped roles continue to live in entity membership/permission tables, for example:

```text
entity_memberships
entity_roles later
entity_permissions later
```

Do not mix platform staff roles into entity membership rows.

Use migrations only.

---

## UI principles

The platform owner console must not pollute regular user UI.

Regular users see product-ready pages.

Entity admins see entity management controls only inside their entity context.

Super admin and staff see technical/operational controls only inside dedicated admin/operations sections or behind explicit platform role gates.

Technical labels such as `Real API`, `DB read-only`, `mock`, `offline`, `GET only`, or deploy/debug diagnostics are not user-facing.

---

## Access model

All platform operations must be role-gated.

Minimum platform gates:

```text
super_admin
platform_admin
platform_moderator
support_agent
read_only_auditor
```

Minimum entity gates:

```text
entity_owner
entity_admin
entity_manager
entity_moderator
entity_member
entity_guest
```

Current frontend may mock these roles, but backend must become the source of truth later.

Each backend action must check whether it is platform-scoped or entity-scoped.

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
10. Support SLA and priority model.
11. Incident tracking shell.
12. Dangerous action approval model.
13. Billing/subscriptions later.

In parallel, entity admin UI should evolve separately inside entity settings pages.

---

## Do not regress

- Do not expose owner/staff tools to regular users.
- Do not treat entity admin as platform admin.
- Do not treat platform admin as automatic day-to-day entity admin.
- Do not allow support staff to browse private data without case context.
- Do not allow uncontrolled login-as-user.
- Do not allow break-glass without reason and audit.
- Do not allow dangerous owner actions without explicit confirmation/approval rules.
- Do not let frontend role placeholders become trusted security checks.
- Backend permissions must be the final source of truth.
- Do not store secrets in the repo.
- Do not make destructive admin actions without audit events.
- Do not delete audit logs through normal UI.
