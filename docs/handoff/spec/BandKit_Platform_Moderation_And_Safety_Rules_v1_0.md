# BandKit — Platform Moderation and Safety Rules v1.0

## Status

Accepted product policy.

This document defines moderation and safety rules for BandKit across users, chats, posts, entities, events, documents and reputation.

---

## Core principle

BandKit moderation must preserve context, evidence and audit.

Accepted rule:

> Safety-sensitive content must not be destroyed by normal user actions.

---

## Reportable objects

Users can report:

- user profile;
- direct message;
- chat message;
- post;
- comment;
- entity/group/project;
- event;
- document/file;
- review/feedback/reputation event;
- invitation/application abuse;
- suspicious external link or payment pattern.

---

## Report reasons

Required reason categories:

- spam;
- scam/fraud;
- suspicious link;
- payment outside platform / suspicious payment request;
- harassment/insults;
- threats;
- prohibited content;
- confidential information leak;
- impersonation;
- fake profile/entity;
- violation of event/project agreement;
- no-show/reliability dispute;
- document abuse;
- other.

---

## Evidence preservation

Reports must preserve:

- reported object;
- reporter;
- accused user/entity if applicable;
- parent context;
- timestamps;
- relevant surrounding messages/comments;
- attachments metadata;
- edit/delete history;
- current access/deletion state;
- moderation action history.

Reported content cannot be destroyed by normal delete/edit actions.

---

## Moderation case states

Recommended states:

```text
created -> triage -> in_review -> action_required -> resolved -> appealed -> closed
```

Additional states if needed:

- duplicate;
- rejected;
- escalated;
- waiting_for_user;
- waiting_for_admin;
- legal_hold.

---

## Moderation actions

Possible actions:

- no action;
- warning;
- hide content;
- remove public visibility;
- restrict user action;
- read-only state;
- temporary suspension;
- platform-level denial;
- remove from entity/event;
- revoke document access;
- flag entity/event;
- escalate to senior moderator/admin;
- preserve legal/safety hold.

All sensitive actions require reason and audit event.

---

## Entity admin vs platform moderator

Entity admins can moderate inside their entity according to entity policy.

Platform moderation can override entity decisions when safety/platform policy requires it.

Rules:

- entity admin cannot destroy platform safety evidence;
- platform moderator does not automatically become entity manager for normal operations;
- moderation access is purpose-limited to the case/context;
- actions must be auditable.

---

## User-facing behavior

After reporting, user should see:

- confirmation that report was sent;
- no promise of exact outcome;
- safe next actions if needed: block, mute, leave, contact support.

Example:

```text
Жалоба отправлена. Мы сохранили сообщение и контекст для проверки.
```

---

## Appeals and disputes

Appeals should exist for serious actions:

- account restriction;
- platform-level denial;
- negative reliability event;
- content removal affecting entity/event;
- document restriction.

Appeal must preserve:

- original decision;
- moderator reason;
- user explanation;
- evidence/context;
- final result.

---

## Anti-fraud and external links

BandKit should restrict or review suspicious patterns:

- external payment requests;
- suspicious links;
- attempts to move users off-platform for payment/fraud;
- impersonation;
- repeated copy/paste spam;
- mass invitations/messages;
- suspicious document export behavior.

External links policy can be tightened later with whitelist/risk scoring.

---

## MVP scope

MVP includes:

- report-ready data model;
- basic report action concept;
- evidence preservation in policy/backend design;
- admin/moderator hooks;
- no normal user destruction of reported content.

MVP excludes:

- full moderation dashboard;
- automated ML moderation;
- complex appeal portal;
- full legal workflow.

---

## Accepted decision

BandKit moderation and safety rules:

- reports can target users, messages, posts, entities, events, documents and reputation;
- reports preserve context and evidence;
- normal delete/edit cannot destroy reported evidence;
- moderation actions require reason and audit;
- entity admins and platform moderators have separate responsibilities;
- serious sanctions require appeal/dispute path later;
- anti-fraud and external-link safety are first-class concerns.
