# BandKit — Account Data, Privacy, Deletion and Export Rules v1.0

## Status

Accepted product policy.

This document defines baseline account privacy, account deletion, data export and data retention logic for BandKit.

---

## Core principle

Account deletion and privacy must protect user rights without destroying entity history, safety evidence, legal/audit records or other users' legitimate access.

Accepted rule:

> Personal data should be removable/anonymizable where possible, but working entity history must remain consistent where policy requires it.

---

## Privacy layers

User profile visibility should support layers:

- public;
- registered users;
- friends/contacts;
- entity/event collaborators;
- admins/managers;
- moderators/admins by case;
- private only.

Sensitive fields:

- phone;
- email;
- real name;
- location;
- date of birth/age;
- social links;
- event history;
- reliability history;
- documents;
- private notes;
- safety/moderation records.

---

## Account states

Possible account states:

- active;
- deactivated;
- read-only/restricted;
- platform-level denied;
- deletion requested;
- anonymized;
- deleted.

Deactivation is reversible by policy.

Deletion/anonymization may be irreversible.

---

## Account deletion constraints

Before account deletion, check:

- user owns an entity;
- user is last owner/admin;
- user is event organizer for active event;
- user has unresolved moderation/safety case;
- user has active dispute;
- user has pending document/legal/audit responsibility;
- user has paid/plan ownership later.

Rules:

- entity must not be left without responsible owner/admin;
- active events must not be left without organizer/responsible manager;
- safety/legal/audit records may be retained;
- user may need to transfer ownership before deletion.

---

## What can be deleted/anonymized

Can usually delete/anonymize:

- personal profile fields;
- avatar/media not used as entity records;
- private preferences;
- sessions/tokens;
- personal drafts;
- direct personal metadata where policy allows.

May need to preserve with anonymization:

- messages in shared chats;
- entity/event system history;
- document audit;
- moderation cases;
- participation history;
- reliability events;
- export/audit logs.

Example display after anonymization:

- `Удалённый пользователь`
- `Пользователь удалён`

---

## Direct messages

Direct messages may be hidden/deleted locally according to direct chat policy.

Account deletion should not automatically destroy the other user's legitimate message history unless legal/privacy policy requires it.

Sensitive safety reports preserve evidence.

---

## Entity/event content

If deleted user created content inside an entity/event:

- content may remain as part of entity history;
- author can be anonymized;
- documents may remain if they belong to entity;
- system messages remain;
- audit remains internal.

Accepted rule:

> Entity-owned documents and event history do not disappear simply because one user deleted their account.

---

## Data export

User data export should include data the user is allowed to receive.

Possible export categories:

- profile data;
- account settings;
- user's own posts/comments;
- user's own uploaded files where still permitted;
- participation history;
- messages where export is allowed by policy;
- entity data only where user has export rights;
- moderation/reputation summary where policy allows.

Export must not leak:

- confidential entity documents without rights;
- other users' private data;
- moderation-only internal notes;
- safety evidence beyond policy;
- documents from entities where access was revoked.

---

## Retention

Retention differs by data type.

Examples:

- staging/test data follows staging policy;
- archived chat history follows accepted retention unless legal/safety requires longer;
- documents may follow entity/document policy;
- audit/moderation records may require longer retention;
- financial/payment-related documents later require separate legal/accounting policy.

---

## MVP scope

MVP includes:

- privacy-aware data model direction;
- account state concepts;
- deletion/anonymization policy direction;
- owner/last-admin constraints;
- no automatic destruction of entity history;
- export-ready architecture.

MVP excludes:

- full automated data export portal;
- full legal deletion workflow;
- regional compliance automation;
- complex retention engine.

---

## Accepted decision

BandKit account data rules:

- privacy is layered;
- account deletion must not break entity/event history;
- owned entities/events need transfer/closure before deletion;
- shared working content may remain with anonymized author;
- safety/legal/audit data can be retained where required;
- user export must respect access rights and confidentiality.
