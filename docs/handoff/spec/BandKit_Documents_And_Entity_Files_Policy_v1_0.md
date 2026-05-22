# BandKit — Documents and Entity Files Policy v1.0

## Status

Accepted product policy.

This document defines how BandKit handles documents and files connected to users, entities, events and chats.

Related documents:

- `BandKit_Platform_Policy_Framework_v1_0.md`
- `BandKit_Platform_Roles_And_Permissions_v1_0.md`
- `BandKit_Chat_Access_Notifications_Attachments_Archive_Rules_v1_0.md`
- `BandKit_MVP_Scope_And_Product_Positioning_v1_0.md`

---

## Core principle

BandKit must treat professional entity files as first-class documents, not as ordinary chat attachments.

Accepted rule:

> A file can be a temporary upload, a message attachment, or an entity document. These are different concepts.

---

## Document categories

### Message attachment

A file attached to a message.

Examples:

- quick image;
- temporary reference;
- draft screenshot;
- casual file.

Rules:

- visibility follows the message and room context;
- if it points to an entity document, deleting the message does not delete the document;
- attachments can be hidden when message is hidden/deleted.

### Entity document

A managed document belonging to an entity or event.

Examples:

- rider;
- setlist;
- offer/commercial proposal;
- contract draft;
- receipt/act;
- schedule;
- technical plan;
- booking/payment-related file;
- event file;
- group/project file.

Rules:

- has parent entity/event;
- has permissions;
- has versions when needed;
- can be referenced from chats;
- export is restricted;
- changes can create system messages.

### Temporary upload

A file uploaded but not yet attached or committed.

Rules:

- must expire;
- orphan cleanup required;
- not visible as an entity document until committed.

---

## Document lifecycle

Recommended lifecycle:

```text
draft -> active -> versioned/updated -> archived -> revoked/deleted
```

### Draft

Editable/preparation stage.

### Active

Current usable version.

### Versioned/updated

Document has updates or previous versions.

### Archived

Kept for history; normal editing disabled.

### Revoked/deleted

Visible access removed; audit/legal/safety retention may keep internal records.

---

## Access model

Access is based on:

- parent entity/event membership;
- document type;
- user role;
- document-specific permission;
- account restriction state;
- moderation/safety state.

Basic permissions:

- view;
- edit/version;
- attach/reference in chat;
- export externally;
- manage access;
- view audit.

Accepted rule:

> Chat access does not automatically mean full document export access.

---

## Role-based access

Ordinary entity/event participants:

- can view allowed documents;
- can reference/upload documents if allowed;
- cannot export confidential entity documents externally by default.

Entity owner/admin/manager:

- can manage entity documents according to policy;
- can export entity documents externally where allowed;
- can manage versions and access.

Event organizer/manager:

- can manage event documents;
- can export event documents externally where allowed.

Moderator/admin:

- can access documents only through moderation/safety/admin policy and audit.

Former members/participants:

- lose access to related entity/event documents through normal UI;
- exceptions only through dispute/safety/legal case access.

---

## External export rules

Entity documents stay inside the entity by default.

Regular participants cannot externally export:

- riders;
- contracts;
- receipts/acts;
- schedules;
- payment/booking-related files;
- technical plans;
- confidential project/event files.

Allowed external export roles:

- event manager/organizer for event documents;
- entity owner/admin/manager for entity documents;
- organization admin/manager where applicable;
- platform moderator/admin only through policy-controlled case/admin flow.

External export must be auditable later:

- actor;
- document;
- entity/event;
- destination/channel if known;
- timestamp;
- reason/purpose if required.

---

## Versioning

Documents that affect work should support versions.

Versioned documents:

- rider;
- setlist;
- offer;
- contract draft;
- schedule;
- technical plan;
- booking/payment-related files.

Rules:

- updating important document should create new version, not silently overwrite;
- old versions may be visible to authorized roles;
- important updates can generate system messages;
- important updates can require acknowledgement later.

---

## Document builders and paid tools

Document wizards are future paid/pro features, not required MVP baseline.

Future tools:

- rider wizard;
- offer wizard;
- contract draft assistant;
- branded PDF export;
- setlist/template builder;
- document package export.

Legal note for future contract assistant:

> Contract assistant output must not be presented as legal advice unless reviewed and supported by proper legal policy.

---

## Storage model

Do not store files directly in PostgreSQL.

Database stores metadata:

- file/document ID;
- parent entity/event;
- storage key;
- MIME type;
- size;
- permissions;
- version;
- audit/export flags;
- created/updated timestamps.

Files go to storage:

- local staging storage for MVP/testing;
- object storage for production.

---

## Deletion and retention

Deleting a chat message does not delete an entity document.

Document removal must follow document lifecycle and permissions.

Retention depends on type:

- regular chat attachments follow chat/archive policy;
- entity documents follow entity/document policy;
- safety/legal/moderation documents may have longer retention;
- payment/booking/legal documents may require separate future retention rules.

---

## MVP scope

MVP includes:

- basic entity/event document area;
- upload/store metadata;
- link/reference documents in chat/event/entity;
- access based on membership/role;
- no normal external export by participants;
- architecture ready for object storage and versions.

MVP excludes:

- legal-grade contract workflow;
- digital signatures;
- payment processing;
- advanced version diff;
- full AI document wizard as core baseline.

---

## Accepted decision

BandKit documents policy:

- entity documents are first-class records;
- message attachment and entity document are different concepts;
- access follows entity/event roles and document policy;
- external export is restricted to responsible roles;
- deleting chat messages does not delete entity documents;
- important documents should support versioning;
- production files must move to object storage later;
- document builders are paid/pro expansion, not MVP dependency.
