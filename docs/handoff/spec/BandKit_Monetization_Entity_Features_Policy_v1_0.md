# BandKit — Monetization and Entity Feature Policy v1.0

## Status

Accepted product monetization direction.

This document defines the monetization model for BandKit at the platform policy level.

Related document:

- `BandKit_Platform_Policy_Framework_v1_0.md`

---

## Core monetization principle

BandKit should not monetize by taking payments between users for gigs, events or participation at the MVP stage.

Accepted rule:

> Monetization is based on expanding platform capabilities for entities, not on processing user settlements or taking commission from gigs.

Entities include:

- band/group;
- solo artist;
- orchestra;
- project;
- organization;
- studio/venue/agency later if needed;
- other music-related professional entity types.

---

## Free entity creation

Every user can create an entity for free.

Examples:

- create a band;
- create a solo artist profile;
- create an orchestra;
- create a project/group;
- create another supported music entity type later.

The free tier should provide enough value to let users start using BandKit seriously without paying immediately.

Accepted principle:

> A user should be able to create and run a basic entity for free.

---

## Free starter package

The free entity package should include a basic operational toolkit.

Free capabilities may include:

- entity profile page;
- basic team/member management;
- basic roles;
- entity calendar;
- creating events for the entity;
- sending invitations from the entity;
- collecting/building a team;
- basic entity administration;
- basic document storage;
- storing core documents such as rider, setlists, offer materials and schedules;
- basic event chat/working communication according to chat policies;
- basic notifications;
- basic visibility/search presence;
- basic archive/history within platform limits.

Accepted rule:

> The free tier is not a useless demo. It must be a real starter package for small bands/artists/projects.

---

## Paid expansion model

Paid features should unlock more professional capabilities for entities.

Possible paid feature groups:

### Document and business material tools

- rider builder/wizard with proper formatting;
- technical rider templates;
- offer/commercial proposal builder;
- contract drafting assistant/wizard;
- receipt/act/template builders later;
- branded PDF export;
- versioned document packages;
- advanced document archive;
- document export/audit tools for entity managers.

### Event and operations tools

- advanced event planning;
- advanced team scheduling;
- task assignment and tracking;
- acknowledgement tracking;
- advanced event reminders;
- multi-event calendar tools;
- recurring rehearsals/events;
- event templates;
- logistics checklists.

### Team and administration tools

- advanced roles and permissions;
- extended member limits;
- advanced admin tools;
- internal notes;
- role-based document access;
- manager/administrator dashboards;
- multiple managers/admin seats;
- audit history access.

### Storage and history limits

- increased document storage;
- longer archive retention;
- more file versions;
- larger attachments;
- advanced search across entity history/documents;
- export packages.

### Presentation and promotion tools

- verified entity profile;
- advanced profile customization;
- professional media kit;
- public offer page;
- booking/contact page later;
- promotion/visibility tools later.

### Automation and AI-assist tools

- rider generation assistant;
- offer writing assistant;
- contract draft assistant;
- event checklist generator;
- setlist/document formatting assistant;
- message/announcement templates;
- translation/localization helpers later.

---

## Financial scope boundary

At MVP/current policy stage, BandKit does not include:

- in-platform payments;
- settlement engine;
- gig payment processing;
- escrow;
- commission from gigs;
- invoice/payment automation as a transactional system;
- legally binding financial workflow inside the platform.

Users may store or share financial/payment-related documents according to entity document policies, but the platform does not process the payment itself.

Examples of allowed document storage under document policy:

- contract draft;
- offer/commercial proposal;
- receipt/act file;
- schedule;
- rider;
- booking-related document.

Important:

> Financial workflows can be added later only after legal, accounting and business requirements are clarified.

---

## Future financial module option

The architecture should not block future addition of:

- invoices;
- payments;
- escrow;
- contracts;
- paid bookings;
- settlement tracking;
- commission model;
- tax/accounting integrations.

But these must be a separate future module with:

- legal review;
- accounting review;
- clear user agreements;
- audit;
- permissions;
- dispute flow;
- regional compliance;
- data retention rules.

Accepted rule:

> Do not design the MVP around payment processing, but do not block a future financial module.

---

## Packaging model ideas

Possible future packaging models:

### Free

For small entities starting out.

Includes basic entity creation and basic operational tools.

### Pro Entity

For active bands/projects/artists.

Could include:

- rider wizard;
- offer wizard;
- branded exports;
- more storage;
- more document versions;
- advanced event tools;
- advanced roles.

### Organization / Manager

For larger teams, orchestras, agencies, studios or organizations.

Could include:

- multiple entities;
- manager dashboard;
- advanced permissions;
- audit logs;
- export tools;
- advanced archive/search;
- moderation/admin tools;
- team seats.

### Add-ons

Feature-specific purchases/subscriptions later:

- document builder pack;
- legal template pack;
- increased storage;
- advanced analytics;
- public promotion tools;
- verified entity profile;
- automation/AI credits.

This is a product direction, not final pricing.

---

## UX principles

Monetization should not block core collaboration.

Free users should be able to:

- create a real entity;
- invite people;
- run basic events;
- store basic documents;
- communicate;
- manage a small team.

Paid features should feel like professional acceleration, not basic survival.

Good paid feature framing:

- `Оформить райдер профессионально`;
- `Собрать оффер`;
- `Подготовить договор`;
- `Экспортировать брендированный PDF`;
- `Расширить хранилище документов`;
- `Открыть расширенные роли и администрирование`.

Avoid:

- locking users out of basic entity existence;
- forcing payment before understanding value;
- mixing platform subscriptions with gig settlements;
- making ordinary participants pay to access working information they need.

---

## Backend/product implications

Future backend should support:

- entity subscription/plan state;
- feature flags per entity;
- usage limits per entity;
- storage quotas;
- document generation limits;
- plan-based export permissions;
- billing integration later if needed;
- admin override for testing/support;
- audit for premium document exports if sensitive.

Suggested concepts later:

- `entity_plans`;
- `entity_feature_flags`;
- `entity_usage_limits`;
- `entity_storage_quotas`;
- `entity_billing_profile` later;
- `entity_feature_usage_events`.

---

## Accepted product decision

BandKit monetization rules:

- every user can create an entity for free;
- free entity gets a real starter package;
- no in-platform payment/settlement processing at MVP stage;
- monetization focuses on paid expansion of entity capabilities;
- paid features may include rider wizard, offer wizard, contract drafting assistant, branded exports, advanced documents, advanced events, roles, storage, analytics and organization tools;
- financial modules can be added later only after legal/business/accounting clarification;
- platform architecture should allow future payments, but MVP must not depend on them.
