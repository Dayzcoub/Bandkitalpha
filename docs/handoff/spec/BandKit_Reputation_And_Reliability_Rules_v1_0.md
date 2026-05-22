# BandKit — Reputation and Reliability Rules v1.0

## Status

Accepted product policy.

This document defines the baseline logic for reputation, reliability, feedback, no-shows, late cancellations and disputes in BandKit.

---

## Core principle

BandKit reputation must not be a free-form revenge system.

Accepted rule:

> Reputation is based on verified collaboration context, not arbitrary public attacks.

Reputation should support trust, not social punishment.

---

## Reputation layers

BandKit should separate several concepts:

1. public reputation summary;
2. private event feedback;
3. verified reliability events;
4. moderation-confirmed incidents;
5. positive participation history.

Do not merge everything into one uncontrolled rating number too early.

---

## Who can leave feedback

Feedback can be left only by users connected to a real collaboration context.

Allowed contexts:

- completed event participation;
- confirmed project collaboration;
- entity/member work context;
- organizer/participant relationship within event;
- manager/crew/team collaboration.

Not allowed:

- random profile visitors;
- followers/subscribers with no working context;
- users blocked/restricted by policy;
- users outside the verified collaboration.

---

## When feedback opens

Feedback should open after meaningful collaboration stage:

- event completed;
- project milestone completed;
- participation ended;
- collaboration marked complete;
- moderation/admin opens feedback in dispute context.

Feedback should not open before the work context is real.

---

## Reliability events

Reliability events are structured records, not just opinions.

Possible reliability events:

- completed participation;
- confirmed attendance;
- early decline;
- late cancellation;
- no-show;
- replacement provided;
- organizer cancellation;
- event reschedule;
- dispute opened;
- dispute resolved;
- moderation-confirmed issue.

---

## No-show and late cancellation

No-show and late cancellation can affect reliability, but must be fair.

Rules:

- no-show requires event participation context;
- late cancellation should consider timing, reason and replacement;
- valid reason can reduce or remove negative impact;
- replacement can reduce or remove negative impact;
- organizer cancellation must not punish participants;
- reschedule must not unfairly punish participants who cannot attend new date/time;
- disputed cases should not become final public negative reputation until reviewed or resolved by policy.

---

## Valid reasons and disputes

Valid reasons may include:

- illness;
- emergency;
- force majeure;
- organizer changed conditions;
- event rescheduled;
- unsafe conditions;
- documented conflict;
- other reason accepted by policy/moderation.

Dispute flow must exist for serious negative reliability events.

Dispute should preserve:

- event context;
- chat/system messages;
- participation status;
- cancellation timing;
- provided reason;
- supporting documents if any;
- organizer/participant statements.

---

## Anti-abuse rules

Reputation must protect against:

- revenge feedback;
- fake feedback;
- coordinated attacks;
- pressure/extortion;
- discrimination/harassment through reviews;
- repeated reports by same conflict party;
- one angry user destroying a profile.

Possible protections:

- feedback only after verified collaboration;
- hidden/private feedback first;
- moderation review for serious claims;
- weighting by verified events;
- appeal/dispute;
- limit repeated feedback for same event;
- show structured reliability instead of raw comments.

---

## Visibility

Reputation visibility should be layered.

Possible visibility:

- public summary;
- visible to collaborators;
- visible to organizers/managers;
- private moderation-only;
- hidden during dispute.

MVP should be conservative and avoid aggressive public shaming.

---

## Positive reliability

Reputation should not focus only on punishment.

Positive signals:

- completed event;
- confirmed attendance;
- repeated collaboration;
- positive organizer feedback;
- on-time acknowledgement;
- successful replacement provided;
- no disputes over multiple events.

---

## MVP scope

MVP can include only lightweight reliability-ready structure.

MVP includes:

- participation records;
- event completion context;
- basic feedback-ready model;
- no-show/decline concepts in policy;
- dispute-ready audit context.

MVP excludes:

- public rating algorithm;
- automated punishment;
- complex scoring;
- marketplace ranking;
- monetized reputation boosts.

---

## Accepted decision

BandKit reputation rules:

- reputation is verified-context based;
- feedback only after real collaboration;
- no-show/late cancellation can matter but must support reasons, replacement and dispute;
- organizer cancellation/reschedule must not unfairly punish participants;
- anti-abuse protections are mandatory before public ratings;
- MVP should store participation context before exposing broad public ratings.
